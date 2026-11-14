import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return successResponse(res, 'Subscription plans retrieved', plans);
  } catch (error) {
    next(error);
  }
};

export const createSubscriptionPlan = async (req, res, next) => {
  try {
    const { name, slug, category, description, price, durationDays = 30, serviceLimit = 1, features = [] } =
      req.body;

    if (!name || !slug || !price) {
      return errorResponse(res, 'Name, slug, and price are required', 400);
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        category: category || 'General',
        description: description || '',
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        serviceLimit: parseInt(serviceLimit),
        features: Array.isArray(features) ? features : [features],
      },
    });

    return successResponse(res, 'Subscription plan created', plan, 201);
  } catch (error) {
    next(error);
  }
};

export const subscribeToPlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) return errorResponse(res, 'Plan ID is required', 400);

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!customer) return errorResponse(res, 'Customer profile required', 403);

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return errorResponse(res, 'Plan not available', 404);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        servicesRemaining: plan.serviceLimit,
        totalPaid: plan.price,
      },
      include: { plan: true },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: `Subscribed to ${plan.name}`,
        message: `Your subscription to "${plan.name}" is now active until ${endDate.toDateString()}.`,
        type: 'SUBSCRIPTION',
        link: '/customer/subscriptions',
      },
    });

    return successResponse(res, 'Subscribed successfully', subscription, 201);
  } catch (error) {
    next(error);
  }
};

export const getMySubscriptions = async (req, res, next) => {
  try {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!customer) return successResponse(res, 'Subscriptions', []);

    const subscriptions = await prisma.subscription.findMany({
      where: { customerId: customer.id },
      include: {
        plan: true,
        recurringBookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'My subscriptions retrieved', subscriptions);
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { plan: true },
    });
    return successResponse(res, 'Subscription cancelled', subscription);
  } catch (error) {
    next(error);
  }
};
