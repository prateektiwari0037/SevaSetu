import mongoose from 'mongoose';

const providerServiceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    fixedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 60,
      min: 15,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate service offering for the same provider
providerServiceSchema.index({ providerId: 1, serviceId: 1 }, { unique: true });

providerServiceSchema.virtual('service', {
  ref: 'Service',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true,
});

providerServiceSchema.virtual('provider', {
  ref: 'ProviderProfile',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true,
});

providerServiceSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

const ProviderService =
  mongoose.models.ProviderService ||
  mongoose.model('ProviderService', providerServiceSchema);

export default ProviderService;
