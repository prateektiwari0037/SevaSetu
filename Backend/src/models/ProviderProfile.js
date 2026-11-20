import mongoose from 'mongoose';

const availabilityDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true,
    },
    isWorking: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String,
      default: '09:00',
    },
    endTime: {
      type: String,
      default: '18:00',
    },
    breaks: [
      {
        startTime: String,
        endTime: String,
        reason: { type: String, default: 'Break' },
      },
    ],
  },
  { _id: false }
);

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
      default: '',
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
    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
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
    serviceAreas: [
      {
        pincode: { type: String, trim: true },
        area: { type: String, trim: true },
        city: { type: String, trim: true },
      },
    ],
    serviceRadiusKm: {
      type: Number,
      default: 10,
    },
    verificationStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_VERIFICATION'],
      default: 'DRAFT',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verificationNotes: {
      type: String,
      default: '',
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
    portfolioImages: [
      {
        url: { type: String, required: true },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    availability: {
      weeklySchedule: {
        type: [availabilityDaySchema],
        default: () => [
          { day: 'MONDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch' }] },
          { day: 'TUESDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch' }] },
          { day: 'WEDNESDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch' }] },
          { day: 'THURSDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch' }] },
          { day: 'FRIDAY', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ startTime: '13:00', endTime: '14:00', reason: 'Lunch' }] },
          { day: 'SATURDAY', isWorking: true, startTime: '10:00', endTime: '17:00', breaks: [] },
          { day: 'SUNDAY', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] },
        ],
      },
      unavailableDates: [
        {
          type: Date,
        },
      ],
      timeOffBlocks: [
        {
          startDate: { type: Date, required: true },
          endDate: { type: Date, required: true },
          reason: { type: String, default: 'Personal Leave' },
        },
      ],
    },
    documents: [
      {
        documentType: {
          type: String,
          enum: ['ID_PROOF', 'ADDRESS_PROOF', 'TRADE_CERTIFICATE', 'POLICE_VERIFICATION', 'AADHAAR', 'PAN', 'CERTIFICATE', 'OTHER'],
          required: true,
        },
        documentUrl: { type: String, required: true },
        originalName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
          default: 'PENDING',
        },
        rejectionReason: { type: String, default: '' },
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

providerProfileSchema.virtual('services', {
  ref: 'ProviderService',
  localField: '_id',
  foreignField: 'providerId',
});

const ProviderProfile =
  mongoose.models.ProviderProfile ||
  mongoose.model('ProviderProfile', providerProfileSchema);

export default ProviderProfile;
