import { Notification } from '../models/index.js';
import emailService from './email.service.js';

export class NotificationService {
  /**
   * Create an in-app notification and optionally trigger email
   */
  static async sendNotification({
    userId,
    title,
    message,
    type = 'SYSTEM',
    link = null,
    data = {},
    userEmail = null,
  }) {
    try {
      if (!userId) return null;

      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        link,
        isRead: false,
      });

      // If user has email and email service is configured, deliver copy
      if (userEmail) {
        try {
          await emailService.sendMail({
            to: userEmail,
            subject: title,
            text: message,
            html: `<div style="font-family:sans-serif;padding:16px;">
              <h2>${title}</h2>
              <p>${message}</p>
              ${link ? `<p><a href="${link}">View details on SevaSetu</a></p>` : ''}
            </div>`,
          });
        } catch (e) {
          // Dev fallback / non-fatal
          console.warn(`[NotificationService] Email delivery skipped: ${e.message}`);
        }
      }

      return notification;
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err.message);
      return null;
    }
  }

  static async notifyBookingEvent(event, booking, metadata = {}) {
    if (!booking) return;

    const customerUserId = booking.customerId?.userId || booking.customerId;
    const providerUserId = booking.providerId?.userId || booking.providerId;

    switch (event) {
      case 'BOOKING_CREATED':
        if (providerUserId) {
          await this.sendNotification({
            userId: providerUserId,
            title: 'New Booking Request',
            message: `New booking #${booking.bookingNumber} has been scheduled for ${booking.timeSlot}.`,
            type: 'BOOKING',
            link: `/provider/bookings/${booking._id}`,
          });
        }
        break;

      case 'BOOKING_ACCEPTED':
        if (customerUserId) {
          await this.sendNotification({
            userId: customerUserId,
            title: 'Booking Accepted',
            message: `Your booking #${booking.bookingNumber} has been accepted by the service provider.`,
            type: 'BOOKING',
            link: `/customer/bookings/${booking._id}`,
          });
        }
        break;

      case 'BOOKING_REJECTED':
        if (customerUserId) {
          await this.sendNotification({
            userId: customerUserId,
            title: 'Booking Declined',
            message: `Booking #${booking.bookingNumber} was declined by the provider. Reason: ${metadata.reason || 'Provider unavailable'}`,
            type: 'BOOKING',
            link: `/customer/bookings/${booking._id}`,
          });
        }
        break;

      case 'SERVICE_STARTED':
        if (customerUserId) {
          await this.sendNotification({
            userId: customerUserId,
            title: 'Service Work Started',
            message: `Work for booking #${booking.bookingNumber} has started.`,
            type: 'BOOKING',
            link: `/customer/bookings/${booking._id}`,
          });
        }
        break;

      case 'SERVICE_COMPLETED':
        if (customerUserId) {
          await this.sendNotification({
            userId: customerUserId,
            title: 'Service Completed',
            message: `Booking #${booking.bookingNumber} has been marked completed. Please leave a review!`,
            type: 'BOOKING',
            link: `/customer/bookings/${booking._id}`,
          });
        }
        break;

      case 'BOOKING_CANCELLED':
        if (providerUserId) {
          await this.sendNotification({
            userId: providerUserId,
            title: 'Booking Cancelled',
            message: `Booking #${booking.bookingNumber} was cancelled. Reason: ${metadata.reason || 'User cancelled'}`,
            type: 'BOOKING',
            link: `/provider/bookings/${booking._id}`,
          });
        }
        if (customerUserId) {
          await this.sendNotification({
            userId: customerUserId,
            title: 'Booking Cancelled',
            message: `Your booking #${booking.bookingNumber} has been cancelled.`,
            type: 'BOOKING',
            link: `/customer/bookings/${booking._id}`,
          });
        }
        break;

      case 'COLLECTION_REPORTED':
        if (customerUserId) {
          await this.sendNotification({
            userId: customerUserId,
            title: 'Cash Collection Reported',
            message: `Provider reported cash collection of ₹${booking.totalAmount} for booking #${booking.bookingNumber}. Please confirm payment.`,
            type: 'PAYMENT',
            link: `/customer/bookings/${booking._id}`,
          });
        }
        break;

      case 'COLLECTION_CONFIRMED':
        if (providerUserId) {
          await this.sendNotification({
            userId: providerUserId,
            title: 'Payment Confirmed by Customer',
            message: `Customer confirmed payment of ₹${booking.totalAmount} for booking #${booking.bookingNumber}. Earnings credited.`,
            type: 'PAYMENT',
            link: `/provider/earnings`,
          });
        }
        break;

      case 'COLLECTION_DISPUTED':
        if (providerUserId) {
          await this.sendNotification({
            userId: providerUserId,
            title: 'Payment Disputed',
            message: `Customer disputed payment for booking #${booking.bookingNumber}. Note: ${metadata.reason || 'Discrepancy noted'}`,
            type: 'PAYMENT',
            link: `/provider/bookings/${booking._id}`,
          });
        }
        break;

      default:
        break;
    }
  }
}

export default NotificationService;
