import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopProfile',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General Hardware',
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    priceInPaise: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      default: 'piece',
      trim: true,
    },
    stockStatus: {
      type: String,
      enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LIMITED_STOCK'],
      default: 'IN_STOCK',
      index: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    images: {
      type: [String],
      default: [],
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

productSchema.pre('save', function () {
  if (this.price !== undefined) {
    this.priceInPaise = Math.round(this.price * 100);
  }
  if (this.stockStatus !== undefined) {
    this.inStock = this.stockStatus === 'IN_STOCK' || this.stockStatus === 'LIMITED_STOCK';
  } else if (this.inStock !== undefined) {
    this.stockStatus = this.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK';
  }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
