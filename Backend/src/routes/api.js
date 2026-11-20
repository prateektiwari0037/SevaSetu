import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import categoriesRoutes from '../modules/categories/categories.routes.js';
import servicesRoutes from '../modules/services/services.routes.js';
import providersRoutes from '../modules/providers/providers.routes.js';
import bookingsRoutes from '../modules/bookings/bookings.routes.js';
import quotationsRoutes from '../modules/quotations/quotations.routes.js';
import shopsRoutes from '../modules/shops/shops.routes.js';
import emergencyRoutes from '../modules/emergency/emergency.routes.js';
import reviewsRoutes from '../modules/reviews/reviews.routes.js';
import paymentsRoutes from '../modules/payments/payments.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import complaintsRoutes from '../modules/complaints/complaints.routes.js';
import warrantiesRoutes from '../modules/warranties/warranties.routes.js';
import subscriptionsRoutes from '../modules/subscriptions/subscriptions.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import uploadsRoutes from '../modules/uploads/uploads.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/providers', providersRoutes);
apiRouter.use('/bookings', bookingsRoutes);
apiRouter.use('/', quotationsRoutes); // mounts /service-requests, /quotations, /provider/quotations
apiRouter.use('/shops', shopsRoutes);
apiRouter.use('/emergency-requests', emergencyRoutes);
apiRouter.use('/reviews', reviewsRoutes);
apiRouter.use('/payments', paymentsRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/complaints', complaintsRoutes);
apiRouter.use('/', warrantiesRoutes); // mounts /warranties and /revisits
apiRouter.use('/', subscriptionsRoutes); // mounts /subscription-plans and /subscriptions
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/uploads', uploadsRoutes);

export default apiRouter;
