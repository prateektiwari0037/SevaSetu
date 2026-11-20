import crypto from 'crypto';
import { Payment, Booking, CustomerProfile, ProviderProfile } from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import NotificationService from '../../services/notification.service.js';

/**
 * 1. CREATE PAYMENT RECORD (Cash on Service)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return errorResponse(res, 'Booking ID is required', 400);
    }

    const booking = await Booking.findById(bookingId);
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
        paymentMethod: 'CASH_ON_SERVICE',
        status: 'UNPAID',
        collectionStatus: 'UNPAID',
      },
      { upsert: true, returnDocument: 'after' }
    );

    return successResponse(res, 'Cash on Service payment initialized', {
      payment,
      paymentMethod: 'CASH_ON_SERVICE',
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
    const { paymentId, bookingId } = req.body;

    const filter = {};
    if (paymentId) filter._id = paymentId;
    if (bookingId) filter.bookingId = bookingId;

    const payment = await Payment.findOne(filter);
    if (!payment) return errorResponse(res, 'Payment record not found', 404);

    payment.collectionStatus = 'CONFIRMED';
    payment.status = 'PAID';
    payment.confirmedAt = new Date();
    payment.confirmedBy = req.user.id;
    await payment.save();

    await Booking.findByIdAndUpdate(payment.bookingId, {
      collectionStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      isPaid: true,
    });

    return successResponse(res, 'Payment confirmed successfully', payment);
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
    const payment = await Payment.findById(id).populate('bookingId');
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
    let filter = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await CustomerProfile.findOne({ userId: req.user.id });
      if (customer) {
        const bookings = await Booking.find({ customerId: customer._id }).select('_id');
        filter.bookingId = { $in: bookings.map((b) => b._id) };
      }
    } else if (req.user.role === 'PROVIDER') {
      const provider = await ProviderProfile.findOne({ userId: req.user.id });
      if (provider) {
        const bookings = await Booking.find({ providerId: provider._id }).select('_id');
        filter.bookingId = { $in: bookings.map((b) => b._id) };
      }
    }

    const payments = await Payment.find(filter)
      .populate('bookingId', 'bookingNumber serviceAddress totalAmount bookingStatus')
      .sort({ createdAt: -1 })
      .lean();

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

    const filter = {};
    if (paymentId) filter._id = paymentId;
    if (bookingId) filter.bookingId = bookingId;

    const payment = await Payment.findOne(filter);
    if (!payment) return errorResponse(res, 'Payment record not found', 404);

    payment.collectionStatus = 'DISPUTED';
    payment.status = 'DISPUTED';
    payment.disputeReason = reason || 'Customer requested dispute/refund';
    await payment.save();

    await Booking.findByIdAndUpdate(payment.bookingId, {
      collectionStatus: 'DISPUTED',
      disputeReason: payment.disputeReason,
    });

    return successResponse(res, 'Dispute / adjustment request submitted', payment);
  } catch (error) {
    next(error);
  }
};
