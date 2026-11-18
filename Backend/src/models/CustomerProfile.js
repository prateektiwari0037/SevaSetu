import mongoose from 'mongoose';

const customerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: null,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const CustomerProfile =
  mongoose.models.CustomerProfile ||
  mongoose.model('CustomerProfile', customerProfileSchema);

export default CustomerProfile;
