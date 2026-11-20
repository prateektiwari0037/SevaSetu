import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: [true, 'Subscription plan ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'MANUAL_VERIFICATION', 'CASH_ON_SERVICE', 'PAY_LATER'],
      default: 'CASH',
    },
    paymentReference: {
      type: String,
      default: null,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    servicesRemaining: {
      type: Number,
      default: 1,
      min: [0, 'Remaining services cannot be negative'],
    },
    totalPaid: {
      type: Number,
      required: [true, 'Total amount paid is required'],
      min: [0, 'Total paid cannot be negative'],
    },
    approvedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subscriptionSchema.virtual('customer', {
  ref: 'CustomerProfile',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

subscriptionSchema.virtual('plan', {
  ref: 'SubscriptionPlan',
  localField: 'planId',
  foreignField: '_id',
  justOne: true,
});

const Subscription =
  mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
