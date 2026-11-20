import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Plan slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['SILVER', 'GOLD', 'PLATINUM', 'CUSTOM'],
      default: 'SILVER',
      index: true,
    },
    category: {
      type: String,
      default: 'General Home Maintenance',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Price cannot be negative'],
    },
    durationDays: {
      type: Number,
      default: 30,
      min: [1, 'Duration must be at least 1 day'],
    },
    serviceLimit: {
      type: Number,
      default: 1,
      min: [1, 'Service limit must be at least 1'],
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
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

const SubscriptionPlan =
  mongoose.models.SubscriptionPlan ||
  mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
