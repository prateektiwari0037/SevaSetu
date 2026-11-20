import mongoose from 'mongoose';

const bookingStatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      default: '',
    },
    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: true }
);

const collectionAuditSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['UNPAID', 'PROVIDER_REPORTED', 'CONFIRMED', 'DISPUTED'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amountPaise: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      required: true,
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      default: null,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    providerServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderService',
      default: null,
    },
    bookingType: {
      type: String,
      enum: ['NORMAL', 'EMERGENCY'],
      default: 'NORMAL',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    problemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
      index: true,
    },
    scheduledStart: {
      type: Date,
      index: true,
    },
    scheduledEnd: {
      type: Date,
    },
    serviceAddress: {
      type: String,
      required: true,
    },
    addressArea: {
      type: String,
      default: '',
      index: true,
    },
    addressCity: {
      type: String,
      default: 'Mumbai',
      index: true,
    },
    addressPincode: {
      type: String,
      required: true,
      index: true,
    },
    addressSnapshot: {
      fullAddress: { type: String, default: '' },
      area: { type: String, default: '' },
      city: { type: String, default: 'Mumbai' },
      pincode: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
    },
    serviceSnapshot: {
      name: { type: String, default: '' },
      description: { type: String, default: '' },
      categoryName: { type: String, default: '' },
      durationMinutes: { type: Number, default: 60 },
      basePrice: { type: Number, default: 0 },
    },
    priceSnapshot: {
      basePricePaise: { type: Number, default: 0 },
      totalPaise: { type: Number, default: 0 },
      commissionRate: { type: Number, default: 0.1 },
      commissionPaise: { type: Number, default: 0 },
      providerEarningsPaise: { type: Number, default: 0 },
      amountInRupees: { type: Number, default: 0 },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH_ON_SERVICE', 'PAY_LATER', 'CASH'],
      default: 'CASH_ON_SERVICE',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    collectionStatus: {
      type: String,
      enum: ['UNPAID', 'PROVIDER_REPORTED', 'CONFIRMED', 'DISPUTED'],
      default: 'UNPAID',
      index: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    disputeReason: {
      type: String,
      default: '',
    },
    statusHistory: [bookingStatusHistorySchema],
    collectionHistory: [collectionAuditSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for slot searches
bookingSchema.index(
  { providerId: 1, bookingDate: 1, timeSlot: 1, status: 1 },
  { background: true }
);

bookingSchema.pre('save', function () {
  // Sync status and bookingStatus
  if (this.isModified('status') && !this.isModified('bookingStatus')) {
    this.bookingStatus = this.status;
  } else if (this.isModified('bookingStatus') && !this.isModified('status')) {
    this.status = this.bookingStatus;
  }

  // Sync isPaid and paymentStatus
  if (this.isModified('isPaid')) {
    this.paymentStatus = this.isPaid ? 'PAID' : 'UNPAID';
  } else if (this.isModified('paymentStatus')) {
    this.isPaid = this.paymentStatus === 'PAID';
  }

  // Populate addressSnapshot if empty
  if (!this.addressSnapshot || !this.addressSnapshot.fullAddress) {
    this.addressSnapshot = {
      fullAddress: this.serviceAddress || '',
      area: this.addressArea || '',
      city: this.addressCity || 'Mumbai',
      pincode: this.addressPincode || '',
      contactPhone: this.addressSnapshot?.contactPhone || '',
    };
  }

  // Populate priceSnapshot if empty
  if (this.totalAmount !== undefined && (!this.priceSnapshot || !this.priceSnapshot.totalPaise)) {
    const totalPaise = Math.round(this.totalAmount * 100);
    const rate = 0.1; // 10% platform commission
    const commissionPaise = Math.round(totalPaise * rate);
    const providerEarningsPaise = totalPaise - commissionPaise;

    this.priceSnapshot = {
      basePricePaise: totalPaise,
      totalPaise,
      commissionRate: rate,
      commissionPaise,
      providerEarningsPaise,
      amountInRupees: this.totalAmount,
    };
  }

  // Populate scheduledStart if empty
  if (this.bookingDate && !this.scheduledStart) {
    this.scheduledStart = new Date(this.bookingDate);
  }
});

bookingSchema.virtual('customer', {
  ref: 'CustomerProfile',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

bookingSchema.virtual('provider', {
  ref: 'ProviderProfile',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true,
});

bookingSchema.virtual('service', {
  ref: 'Service',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true,
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;
