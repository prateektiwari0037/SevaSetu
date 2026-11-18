import mongoose from 'mongoose';

const adminProfileSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'Executive Operations',
      trim: true,
    },
    permissions: {
      type: String,
      default: 'ALL_ACCESS',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

adminProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

const AdminProfile =
  mongoose.models.AdminProfile ||
  mongoose.model('AdminProfile', adminProfileSchema);

export default AdminProfile;
