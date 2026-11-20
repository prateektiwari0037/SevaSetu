import mongoose from 'mongoose';

const shopInquirySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopProfile',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    itemName: {
      type: String,
      default: '',
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RESPONDED', 'CLOSED'],
      default: 'PENDING',
      index: true,
    },
    responseNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

shopInquirySchema.virtual('shop', {
  ref: 'ShopProfile',
  localField: 'shopId',
  foreignField: '_id',
  justOne: true,
});

const ShopInquiry =
  mongoose.models.ShopInquiry || mongoose.model('ShopInquiry', shopInquirySchema);

export default ShopInquiry;
