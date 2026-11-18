import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      default: 'Home',
      trim: true,
    },
    addressLine: {
      type: String,
      required: [true, 'Address line is required'],
      trim: true,
    },
    landmark: {
      type: String,
      default: '',
      trim: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'PIN Code is required'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Alias: streetAddress <-> addressLine
addressSchema.virtual('streetAddress').get(function () {
  return this.addressLine;
}).set(function (val) {
  this.addressLine = val;
});

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);
export default Address;
