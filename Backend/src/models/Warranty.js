import mongoose from 'mongoose';

const revisitRequestSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'],
      default: 'PENDING',
    },
    providerNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

const warrantySchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revisitRequests: [revisitRequestSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

warrantySchema.virtual('endDate').get(function () {
  return this.validUntil;
});

warrantySchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

const Warranty =
  mongoose.models.Warranty || mongoose.model('Warranty', warrantySchema);

export default Warranty;
