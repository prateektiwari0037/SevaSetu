import crypto from 'crypto';
import {
  Payment,
  Booking,
  CustomerProfile,
  ProviderProfile,
  Notification,
} from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

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
      return errorResponse(res, 'This booking has already been paid', 400);
    }

    const transactionId = `TXN-${Date.now()}-${crypto.randomInt(1000, 9999)}`;

    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = await Payment.create({
        bookingId: booking._id,
        transactionId,
        amount: booking.totalAmount,
        paymentMethod,
        status: 'PENDING',
        notes: `Payment for booking #${booking.bookingNumber}`,
      });
    }

    return successResponse(res, 'Cash collection order registered', {
      payment,
      amount: booking.totalAmount,
      currency: 'INR',
      bookingNumber: booking.bookingNumber,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, transactionId, paymentMethod = 'CASH_ON_SERVICE' } = req.body;

    const query = {};
    if (paymentId) query._id = paymentId;
    if (transactionId) query.transactionId = transactionId;

    const payment = await Payment.findOne(query).populate({
      path: 'bookingId',
      populate: [
        { path: 'customerId', populate: { path: 'userId' } },
        { path: 'providerId', populate: { path: 'userId' } },
      ],
    });

    if (!payment) return errorResponse(res, 'Payment record not found', 404);

    payment.status = 'PAID';
    payment.paymentMethod = paymentMethod;
    payment.collectedAt = new Date();
    payment.collectedBy = req.user._id || req.user.id;
    await payment.save();

    // Mark booking as paid
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId._id, {
        isPaid: true,
        paymentMethod,
      });
    }

    // Notifications
    const customerUserId = payment.bookingId?.customerId?.userId?._id;
    if (customerUserId) {
      await Notification.create({
        userId: customerUserId,
        title: 'Payment Recorded',
        message: `Cash collection of ₹${payment.amount} for booking #${payment.bookingId?.bookingNumber} confirmed.`,
        type: 'PAYMENT',
        link: `/customer/bookings/${payment.bookingId?._id}`,
      });
    }

    return successResponse(res, 'Payment verified and settled successfully', payment);
  } catch (error) {
    next(error);
  }
};

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

    if (!payment) return errorResponse(res, 'Payment not found', 404);

    return successResponse(res, 'Payment retrieved', payment);
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    let bookingFilter = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user._id || req.user.id });
      if (customer) bookingFilter.customerId = customer._id;
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user._id || req.user.id });
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

export const requestRefund = async (req, res, next) => {
  try {
    const { paymentId, reason } = req.body;
    if (!paymentId || !reason) {
      return errorResponse(res, 'Payment ID and reason are required', 400);
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return errorResponse(res, 'Payment not found', 404);

    payment.notes = `${payment.notes || ''} [Refund requested: ${reason}]`;
    await payment.save();

    return successResponse(res, 'Refund request submitted for admin review', payment);
  } catch (error) {
    next(error);
  }
};
