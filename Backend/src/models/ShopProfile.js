import mongoose from 'mongoose';

const shopProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    shopCategory: {
      type: String,
      default: 'General Hardware',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    streetAddress: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: 'Mumbai',
      trim: true,
      index: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      default: '400001',
      trim: true,
      index: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    bannerUrl: {
      type: String,
      default: null,
    },
    operatingHours: {
      type: String,
      default: '9:00 AM - 9:00 PM',
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

shopProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

const ShopProfile =
  mongoose.models.ShopProfile || mongoose.model('ShopProfile', shopProfileSchema);

export default ShopProfile;
