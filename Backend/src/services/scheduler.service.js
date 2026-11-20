import { Booking, EmergencyRequest, Warranty, Notification } from '../models/index.js';
import NotificationService from './notification.service.js';

export class SchedulerService {
  /**
   * 1. Cleanup expired temporary/stale reservations
   * Stale PENDING bookings older than 24 hours with unassigned provider
   */
  static async cleanupExpiredReservations() {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const staleBookings = await Booking.find({
        status: 'PENDING',
        providerId: null,
        createdAt: { $lt: cutoff },
      });

      let updatedCount = 0;
      for (const b of staleBookings) {
        b.status = 'CANCELLED';
        b.bookingStatus = 'CANCELLED';
        b.cancellationReason = 'Expired automatically due to provider unassignment timeout';
        b.statusHistory.push({
          status: 'CANCELLED',
          timestamp: new Date(),
          comment: 'System auto-cancellation after 24h unassigned window',
        });
        await b.save();
        updatedCount++;
      }

      return { success: true, expiredBookingsCount: updatedCount };
    } catch (err) {
      console.error('[Scheduler] cleanupExpiredReservations error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 2. Emergency Request Timeouts
   * Mark PENDING emergency requests whose expiresAt has passed as TIMEOUT
   */
  static async handleEmergencyTimeouts() {
    try {
      const now = new Date();
      const expiredEmergencies = await EmergencyRequest.find({
        status: 'PENDING',
        expiresAt: { $lt: now },
      });

      let timedOutCount = 0;
      for (const em of expiredEmergencies) {
        em.status = 'TIMEOUT';
        await em.save();
        timedOutCount++;

        // Notify customer
        const customerUserId = em.customerId?.userId || em.customerId;
        if (customerUserId) {
          await NotificationService.sendNotification({
            userId: customerUserId,
            title: 'Emergency Request Timeout',
            message: `No active provider accepted SOS #${em.requestNumber} within 15 minutes. Please try alternate local emergency contacts.`,
            type: 'EMERGENCY',
          });
        }
      }

      return { success: true, timedOutEmergenciesCount: timedOutCount };
    } catch (err) {
      console.error('[Scheduler] handleEmergencyTimeouts error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 3. Warranty Expiry Updates
   * Mark ACTIVE warranties past validUntil as EXPIRED
   */
  static async updateWarrantyExpiryStates() {
    try {
      const now = new Date();
      const expiredWarranties = await Warranty.find({
        status: 'ACTIVE',
        validUntil: { $lt: now },
      });

      let expiredCount = 0;
      for (const w of expiredWarranties) {
        w.status = 'EXPIRED';
        w.isActive = false;
        await w.save();
        expiredCount++;
      }

      return { success: true, expiredWarrantiesCount: expiredCount };
    } catch (err) {
      console.error('[Scheduler] updateWarrantyExpiryStates error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 4. Pending Booking Reminders
   * Send reminder for bookings accepted and scheduled for tomorrow
   */
  static async sendPendingBookingReminders() {
    try {
      const startTomorrow = new Date();
      startTomorrow.setDate(startTomorrow.getDate() + 1);
      startTomorrow.setHours(0, 0, 0, 0);

      const endTomorrow = new Date(startTomorrow);
      endTomorrow.setHours(23, 59, 59, 999);

      const upcomingBookings = await Booking.find({
        status: 'ACCEPTED',
        bookingDate: { $gte: startTomorrow, $lte: endTomorrow },
      }).populate('customerId providerId');

      let remindersSent = 0;
      for (const b of upcomingBookings) {
        if (b.customerId?.userId) {
          await NotificationService.sendNotification({
            userId: b.customerId.userId,
            title: 'Upcoming Service Reminder',
            message: `Friendly reminder: Your service booking #${b.bookingNumber} is scheduled for tomorrow at ${b.timeSlot}.`,
            type: 'BOOKING',
          });
          remindersSent++;
        }
      }

      return { success: true, remindersSent };
    } catch (err) {
      console.error('[Scheduler] sendPendingBookingReminders error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Run all background tasks (idempotent)
   */
  static async runAllJobs() {
    const results = {
      cleanupReservations: await this.cleanupExpiredReservations(),
      emergencyTimeouts: await this.handleEmergencyTimeouts(),
      warrantyExpiry: await this.updateWarrantyExpiryStates(),
      reminders: await this.sendPendingBookingReminders(),
    };
    return results;
  }
}

export default SchedulerService;
