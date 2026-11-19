import { Notification } from '../../models/index.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    const formatted = notifications.map((n) => ({
      ...n,
      id: n._id.toString(),
    }));

    return successResponse(res, 'Notifications retrieved', {
      notifications: formatted,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.updateMany(
      { _id: id, userId: req.user.id },
      { $set: { isRead: true } }
    );
    return successResponse(res, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return successResponse(res, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.deleteOne({ _id: id, userId: req.user.id });
    return successResponse(res, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};
