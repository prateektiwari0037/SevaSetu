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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    description: {
      type: String,
      default: '',
      trim: true,
    },
    shopCategory: {
      type: String,
      default: 'General Hardware',
      trim: true,
      index: true,
    },
    contact: {
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
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
    serviceArea: {
      type: [String],
      default: [],
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
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
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

shopProfileSchema.pre('save', function () {
  if (this.userId && !this.ownerId) {
    this.ownerId = this.userId;
  } else if (this.ownerId && !this.userId) {
    this.userId = this.ownerId;
  }
  if (this.contactPhone && (!this.contact || !this.contact.phone)) {
    if (!this.contact) this.contact = {};
    this.contact.phone = this.contactPhone;
  } else if (this.contact?.phone && !this.contactPhone) {
    this.contactPhone = this.contact.phone;
  }
});

shopProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

shopProfileSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'shopId',
});

const ShopProfile =
  mongoose.models.ShopProfile || mongoose.model('ShopProfile', shopProfileSchema);

export default ShopProfile;
