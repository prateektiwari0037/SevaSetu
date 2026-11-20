import {
  SubscriptionPlan,
  Subscription,
  CustomerProfile,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

/**
 * GET /api/v1/subscription-plans & /api/v1/admin/subscription-plans
 * Retrieve all available subscription plans
 */
export const getSubscriptionPlans = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' && req.user?.role === 'ADMIN' ? {} : { isActive: true };

    const plans = await SubscriptionPlan.find(filter).sort({ price: 1 });
    return successResponse(res, 'Subscription plans retrieved', plans);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/subscription-plans
 * Administrator creates a new subscription plan
 */
export const createSubscriptionPlan = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      tier = 'SILVER',
      category = 'General Maintenance',
      description = '',
      price,
      durationDays = 30,
      serviceLimit = 1,
      features = [],
    } = req.body;

    if (!name || price === undefined) {
      return errorResponse(res, 'Plan name and price are required', 400);
    }

    const planSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingPlan = await SubscriptionPlan.findOne({ slug: planSlug });
    if (existingPlan) {
      return errorResponse(res, `A subscription plan with slug '${planSlug}' already exists`, 409);
    }

    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      slug: planSlug,
      tier: tier.toUpperCase(),
      category: category.trim(),
      description: description.trim(),
      price: parseFloat(price),
      durationDays: Math.max(1, parseInt(durationDays)),
      serviceLimit: Math.max(1, parseInt(serviceLimit)),
      features: Array.isArray(features) ? features : [features].filter(Boolean),
      isActive: true,
    });

    await logAuditEvent(
      req,
      'ADMIN_CREATE_SUBSCRIPTION_PLAN',
      { planId: plan._id, slug: plan.slug, price: plan.price },
      req.user._id || req.user.id
    );

    return successResponse(res, 'Subscription plan created successfully', plan, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/subscription-plans/:id
 * Administrator updates an existing subscription plan
 */
export const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedUpdates = [
      'name',
      'category',
      'description',
      'price',
      'durationDays',
      'serviceLimit',
      'features',
      'isActive',
      'tier',
    ];

    const safeUpdates = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(id, safeUpdates, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return errorResponse(res, 'Subscription plan not found', 404);
    }

    await logAuditEvent(
      req,
      'ADMIN_UPDATE_SUBSCRIPTION_PLAN',
      { planId: id, updates: safeUpdates },
      req.user._id || req.user.id
    );

    return successResponse(res, 'Subscription plan updated successfully', plan);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/subscriptions
 * Customer subscribes to a plan (Cash on Activation / Manual Verification workflow)
 */
export const subscribeToPlan = async (req, res, next) => {
  try {
    const { planId, paymentMethod = 'CASH', paymentReference = null } = req.body;

    if (!planId) {
      return errorResponse(res, 'Plan ID is required', 400);
    }

    const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
    if (!customer) {
      return errorResponse(res, 'Customer profile required to subscribe', 403);
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return errorResponse(res, 'Selected subscription plan is unavailable or disabled', 404);
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      customerId: customer._id,
      planId: plan._id,
      status: 'ACTIVE',
      paymentMethod,
      paymentReference,
      startDate,
      endDate,
      servicesRemaining: plan.serviceLimit,
      totalPaid: plan.price,
    });

    await subscription.populate('plan');

    // Notify customer
    await Notification.create({
      userId: req.user._id || req.user.id,
      title: `Subscribed to ${plan.name}`,
      message: `Your "${plan.name}" plan is active until ${endDate.toDateString()} with ${plan.serviceLimit} included service visit(s).`,
      type: 'SUBSCRIPTION',
      link: '/customer/subscriptions',
      data: { subscriptionId: subscription._id.toString() },
    });

    return successResponse(res, 'Subscribed to plan successfully', subscription, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/subscriptions
 * Customer gets their subscriptions
 */
export const getMySubscriptions = async (req, res, next) => {
  try {
    const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
    if (!customer) return successResponse(res, 'Subscriptions', []);

    const subscriptions = await Subscription.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .populate('plan');

    return successResponse(res, 'My subscriptions retrieved', subscriptions);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/subscriptions/:id/cancel
 * Customer cancels active subscription
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });

    const query = { _id: id };
    if (req.user.role === 'CUSTOMER' && customer) {
      query.customerId = customer._id;
    }

    const subscription = await Subscription.findOneAndUpdate(
      query,
      { status: 'CANCELLED' },
      { new: true }
    ).populate('plan');

    if (!subscription) {
      return errorResponse(res, 'Subscription record not found or access denied', 404);
    }

    return successResponse(res, 'Subscription cancelled', subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/subscriptions
 * Administrator lists all subscriptions across the platform
 */
export const getAdminSubscriptions = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'fullName email mobile' },
      })
      .populate('plan')
      .populate('approvedByAdminId', 'fullName email');

    const total = await Subscription.countDocuments(query);

    return successResponse(res, 'Admin subscriptions retrieved', subscriptions, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/subscriptions/:id/approve
 * Administrator manually verifies and activates a subscription
 */
export const approveSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalNotes = '' } = req.body;

    const subscription = await Subscription.findById(id).populate([
      { path: 'customerId', populate: { path: 'userId', select: 'fullName email' } },
      { path: 'plan' },
    ]);

    if (!subscription) {
      return errorResponse(res, 'Subscription not found', 404);
    }

    subscription.status = 'ACTIVE';
    subscription.approvedByAdminId = req.user._id || req.user.id;
    subscription.approvalNotes = approvalNotes;
    await subscription.save();

    await logAuditEvent(
      req,
      'ADMIN_APPROVE_SUBSCRIPTION',
      { subscriptionId: id, customerId: subscription.customerId?._id },
      req.user._id || req.user.id
    );

    if (subscription.customerId?.userId) {
      await Notification.create({
        userId: subscription.customerId.userId,
        title: 'Subscription Activated',
        message: `Your subscription to "${subscription.plan?.name}" has been verified and activated by our team.`,
        type: 'SUBSCRIPTION',
        link: '/customer/subscriptions',
      });
    }

    return successResponse(res, 'Subscription approved and activated', subscription);
  } catch (error) {
    next(error);
  }
};
