import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema(
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
    businessName: {
      type: String,
      trim: true,
      default: null,
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
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    primaryCategory: {
      type: String,
      trim: true,
      default: null,
    },
    city: {
      type: String,
      trim: true,
      default: 'Mumbai',
      index: true,
    },
    area: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    servicePincode: {
      type: String,
      trim: true,
      default: '400001',
      index: true,
    },
    serviceRadiusAreas: [
      {
        type: String,
        trim: true,
      },
    ],
    serviceRadiusKm: {
      type: Number,
      default: 10,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
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
      min: 0,
    },
    completedJobsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    documents: [
      {
        documentType: { type: String, enum: ['AADHAAR', 'PAN', 'CERTIFICATE', 'OTHER'] },
        documentUrl: String,
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

providerProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

const ProviderProfile =
  mongoose.models.ProviderProfile ||
  mongoose.model('ProviderProfile', providerProfileSchema);

export default ProviderProfile;
