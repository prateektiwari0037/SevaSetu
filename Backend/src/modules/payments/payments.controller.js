import crypto from 'crypto';
import prisma from '../../config/db.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { DEFAULT_COMMISSION_RATE } from '../../config/constants.js';

export const createOrder = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod = 'ONLINE' } = req.body;

    if (!bookingId) {
      return errorResponse(res, 'Booking ID is required', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, provider: true, service: true },
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.isPaid) {
      return errorResponse(res, 'This booking has already been paid', 400);
    }

    const transactionId = `TXN-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
    const gatewayOrderId = paymentMethod === 'ONLINE' ? `order_sevasetu_${Date.now()}` : null;

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId,
        paymentGatewayOrderId: gatewayOrderId,
        amount: booking.totalAmount,
        paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE',
        status: paymentMethod === 'CASH' ? 'PENDING' : 'PROCESSING',
      },
    });

    return successResponse(res, 'Payment order created', {
      payment,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_sevasetu2026',
      amount: booking.totalAmount * 100, // in paise if gateway
      currency: 'INR',
      bookingNumber: booking.bookingNumber,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, transactionId, paymentMethod = 'ONLINE' } = req.body;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(paymentId ? [{ id: paymentId }] : []),
          ...(transactionId ? [{ transactionId }] : []),
        ],
      },
      include: {
        booking: {
          include: { provider: true, customer: true, service: true },
        },
      },
    });

    if (!payment) return errorResponse(res, 'Payment record not found', 404);
    if (payment.status === 'SUCCESSFUL') {
      return successResponse(res, 'Payment already verified successfully', payment);
    }

    const commissionRate = DEFAULT_COMMISSION_RATE;
    const commissionAmount = Math.round(payment.amount * commissionRate * 100) / 100;
    const providerEarning = Math.round((payment.amount - commissionAmount) * 100) / 100;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESSFUL',
          paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE',
          gatewayResponse: JSON.stringify({
            verifiedAt: new Date().toISOString(),
            status: 'CAPTURED',
            verifiedBy: req.user.email,
          }),
        },
      });

      // 2. Mark booking as paid
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          isPaid: true,
          paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'ONLINE',
        },
      });

      // 3. Create platform commission record if provider assigned
      if (payment.booking.providerId) {
        await tx.platformCommission.upsert({
          where: { paymentId: payment.id },
          create: {
            paymentId: payment.id,
            providerId: payment.booking.providerId,
            grossAmount: payment.amount,
            commissionRate,
            commissionAmount,
            providerEarning,
          },
          update: {
            grossAmount: payment.amount,
            commissionRate,
            commissionAmount,
            providerEarning,
          },
        });
      }

      // 4. Notifications
      await tx.notification.create({
        data: {
          userId: payment.booking.customer.userId,
          title: 'Payment Successful',
          message: `Payment of ₹${payment.amount} for booking #${payment.booking.bookingNumber} was received.`,
          type: 'PAYMENT',
          link: `/customer/bookings/${payment.bookingId}`,
        },
      });

      if (payment.booking.provider) {
        await tx.notification.create({
          data: {
            userId: payment.booking.provider.userId,
            title: 'Payment Credited',
            message: `Payment for booking #${payment.booking.bookingNumber} confirmed. Your net earning: ₹${providerEarning}.`,
            type: 'PAYMENT',
            link: '/provider/earnings',
          },
        });
      }

      return updatedPayment;
    });

    return successResponse(res, 'Payment verified and settled successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: { customer: true, provider: true, service: true },
        },
        commission: true,
        refunds: true,
      },
    });

    if (!payment) return errorResponse(res, 'Payment not found', 404);

    return successResponse(res, 'Payment retrieved', payment);
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    let where = {};

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (customer) where.booking = { customerId: customer.id };
    } else if (req.user.role === 'PROVIDER') {
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (provider) where.booking = { providerId: provider.id };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: { customer: true, provider: true, service: true },
        },
        commission: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, 'Payment history retrieved', payments);
  } catch (error) {
    next(error);
  }
};

export const requestRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId || !reason) {
      return errorResponse(res, 'Payment ID and reason are required', 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return errorResponse(res, 'Payment not found', 404);

    const refund = await prisma.refund.create({
      data: {
        paymentId,
        amount: amount ? parseFloat(amount) : payment.amount,
        reason,
        status: 'PENDING',
      },
    });

    return successResponse(res, 'Refund request submitted for admin review', refund, 201);
  } catch (error) {
    next(error);
  }
};
