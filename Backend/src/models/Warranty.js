import mongoose from 'mongoose';

const revisitSchema = new mongoose.Schema(
  {
    revisitNumber: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    preferredDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    providerNotes: {
      type: String,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
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
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      index: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    durationDays: {
      type: Number,
      default: 30,
    },
    startDate: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
    },
    policySnapshot: {
      allowsFreeRevisit: {
        type: Boolean,
        default: true,
      },
      terms: {
        type: String,
        default:
          'Covers workmanship and defects directly relating to the completed service within warranty period. Parts excluded unless explicitly specified.',
      },
      coveredScope: {
        type: String,
        default: 'Standard Service Workmanship',
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CLAIMED'],
      default: 'ACTIVE',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revisits: [revisitSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

warrantySchema.pre('save', function () {
  if (this.validUntil && !this.endDate) {
    this.endDate = this.validUntil;
  } else if (this.endDate && !this.validUntil) {
    this.validUntil = this.endDate;
  }
  if (this.validUntil) {
    const isExpired = new Date() > this.validUntil;
    if (isExpired) {
      this.status = 'EXPIRED';
      this.isActive = false;
    }
  }
});

warrantySchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

warrantySchema.virtual('customer', {
  ref: 'CustomerProfile',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

warrantySchema.virtual('provider', {
  ref: 'ProviderProfile',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true,
});

const Warranty = mongoose.models.Warranty || mongoose.model('Warranty', warrantySchema);

export default Warranty;
