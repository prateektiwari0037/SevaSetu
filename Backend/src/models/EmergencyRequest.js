import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
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
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
    },
    emergencyCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fullAddress: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'TIMEOUT', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    notifiedProviderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProviderProfile',
      },
    ],
    rejectedProviderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProviderProfile',
      },
    ],
    acceptedProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      default: null,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    disclaimer: {
      type: String,
      default:
        'SevaSetu facilitates priority notifications to nearby independent verified providers. Assistance is subject to provider availability and cannot be legally guaranteed.',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

emergencyRequestSchema.virtual('customer', {
  ref: 'CustomerProfile',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

emergencyRequestSchema.virtual('acceptedProvider', {
  ref: 'ProviderProfile',
  localField: 'acceptedProviderId',
  foreignField: '_id',
  justOne: true,
});

const EmergencyRequest =
  mongoose.models.EmergencyRequest ||
  mongoose.model('EmergencyRequest', emergencyRequestSchema);

export default EmergencyRequest;
