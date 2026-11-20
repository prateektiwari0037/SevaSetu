import crypto from 'crypto';
import {
  Payment,
  Booking,
  CustomerProfile,
  ProviderProfile,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import NotificationService from '../../services/notification.service.js';

/**
 * 1. CREATE PAYMENT RECORD (Cash on Service)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod = 'CASH_ON_SERVICE' } = req.body;

    if (!bookingId) {
      return errorResponse(res, 'Booking ID is required', 400);
    }

    const booking = await Booking.findById(bookingId).populate([
      { path: 'customerId', populate: { path: 'userId' } },
      { path: 'providerId', populate: { path: 'userId' } },
      { path: 'serviceId' },
    ]);

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (booking.isPaid) {
      return errorResponse(res, 'This booking has already been paid and settled', 400);
    }

    const transactionId = `TXN-COS-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
    const amountPaise = booking.priceSnapshot?.totalPaise || Math.round(booking.totalAmount * 100);
    const commissionPaise = Math.round(amountPaise * 0.1);
    const providerEarningsPaise = amountPaise - commissionPaise;

    const payment = await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      {
        bookingId: booking._id,
        transactionId,
        amount: booking.totalAmount,
        amountInPaise: amountPaise,
        commissionRate: 0.1,
        commissionInPaise: commissionPaise,
        providerEarningsPaise: providerEarningsPaise,
        paymentMethod,
        status: 'UNPAID',
        collectionStatus: 'UNPAID',
        notes: `Cash collection registered for booking #${booking.bookingNumber}`,
      },
      { upsert: true, returnDocument: 'after' }
    );

    return successResponse(res, 'Cash on Service payment initialized', {
      payment,
      paymentMethod,
      amount: booking.totalAmount,
      amountDue: booking.totalAmount,
      amountDuePaise: amountPaise,
      currency: 'INR',
      bookingNumber: booking.bookingNumber,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. VERIFY / CONFIRM PAYMENT
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, bookingId, transactionId, paymentMethod = 'CASH_ON_SERVICE' } = req.body;

    const filter = {};
    if (paymentId) filter._id = paymentId;
    if (bookingId) filter.bookingId = bookingId;
    if (transactionId) filter.transactionId = transactionId;

    const payment = await Payment.findOne(filter).populate({
      path: 'bookingId',
      populate: [
        { path: 'customerId', populate: { path: 'userId' } },
        { path: 'providerId', populate: { path: 'userId' } },
      ],
    });

    if (!payment) return errorResponse(res, 'Payment record not found', 404);

    const userId = req.user._id || req.user.id;
    payment.collectionStatus = 'CONFIRMED';
    payment.status = 'PAID';
    payment.paymentMethod = paymentMethod;
    payment.confirmedAt = new Date();
    payment.collectedAt = payment.confirmedAt;
    payment.confirmedBy = userId;
    payment.collectedBy = userId;
    await payment.save();

    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId._id || payment.bookingId, {
        collectionStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        isPaid: true,
        paymentMethod,
      });
    }

    // Notify customer
    const customerUserId = payment.bookingId?.customerId?.userId?._id;
    if (customerUserId) {
      await NotificationService.sendNotification({
        userId: customerUserId,
        title: 'Payment Recorded',
        message: `Cash collection of ₹${payment.amount} for booking #${payment.bookingId?.bookingNumber || ''} confirmed.`,
        type: 'PAYMENT',
        link: `/customer/bookings/${payment.bookingId?._id}`,
      });
    }

    return successResponse(res, 'Payment verified and settled successfully', payment);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET PAYMENT BY ID
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate({
      path: 'bookingId',
      populate: [
        { path: 'customerId', populate: { path: 'userId' } },
        { path: 'providerId', populate: { path: 'userId' } },
        { path: 'serviceId' },
      ],
    });

    if (!payment) return errorResponse(res, 'Payment record not found', 404);

    return successResponse(res, 'Payment retrieved', payment);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET PAYMENT HISTORY
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    let bookingFilter = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId });
      if (customer) bookingFilter.customerId = customer._id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId });
      if (provider) bookingFilter.providerId = provider._id;
    }

    const bookings = await Booking.find(bookingFilter).select('_id');
    const bookingIds = bookings.map((b) => b._id);

    const payments = await Payment.find({ bookingId: { $in: bookingIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'customerId', populate: { path: 'userId', select: 'fullName email' } },
          { path: 'providerId', populate: { path: 'userId', select: 'fullName email' } },
          { path: 'serviceId', select: 'name basePrice' },
        ],
      });

    return successResponse(res, 'Payment history retrieved', payments);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. REQUEST REFUND OR DISPUTE
 */
export const requestRefund = async (req, res, next) => {
  try {
    const { paymentId, bookingId, reason } = req.body;
    if (!reason) {
      return errorResponse(res, 'Reason is required for refund or dispute', 400);
    }

    const filter = {};
    if (paymentId) filter._id = paymentId;
    if (bookingId) filter.bookingId = bookingId;

    if (!paymentId && !bookingId) {
      return errorResponse(res, 'Payment ID or Booking ID is required', 400);
    }

    const payment = await Payment.findOne(filter);
    if (!payment) return errorResponse(res, 'Payment record not found', 404);

    payment.collectionStatus = 'DISPUTED';
    payment.status = 'DISPUTED';
    payment.disputeReason = reason;
    payment.notes = `${payment.notes || ''} [Refund requested: ${reason}]`.trim();
    await payment.save();

    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        collectionStatus: 'DISPUTED',
        disputeReason: reason,
      });
    }

    return successResponse(res, 'Dispute / adjustment request submitted', payment);
  } catch (error) {
    next(error);
  }
};
