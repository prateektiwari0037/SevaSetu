import mongoose from 'mongoose';

const paymentAuditSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['UNPAID', 'PROVIDER_REPORTED', 'CONFIRMED', 'DISPUTED', 'PENDING', 'PAID'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountInPaise: {
      type: Number,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 0.1, // 10%
    },
    commissionInPaise: {
      type: Number,
      default: 0,
    },
    providerEarningsInPaise: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH_ON_SERVICE', 'PAY_LATER', 'CASH'],
      default: 'CASH_ON_SERVICE',
      index: true,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PROVIDER_REPORTED', 'CONFIRMED', 'DISPUTED', 'PENDING', 'PAID', 'CANCELLED'],
      default: 'UNPAID',
      index: true,
    },
    collectionStatus: {
      type: String,
      enum: ['UNPAID', 'PROVIDER_REPORTED', 'CONFIRMED', 'DISPUTED'],
      default: 'UNPAID',
      index: true,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    disputeReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    auditHistory: [paymentAuditSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.pre('save', function () {
  if (this.amount !== undefined) {
    this.amountInPaise = Math.round(this.amount * 100);
    this.commissionInPaise = Math.round(this.amountInPaise * this.commissionRate);
    this.providerEarningsInPaise = this.amountInPaise - this.commissionInPaise;
  }
  if (this.collectionStatus && !this.status) {
    this.status = this.collectionStatus;
  }
});

paymentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
