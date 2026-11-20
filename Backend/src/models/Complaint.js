import mongoose from 'mongoose';

const complaintMessageSchema = new mongoose.Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['CUSTOMER', 'PROVIDER', 'SHOP_OWNER', 'ADMIN'],
      default: 'CUSTOMER',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerProfile',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'GENERAL',
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        originalName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 },
      },
    ],
    resolution: {
      notes: { type: String, default: '' },
      resolvedAt: { type: Date, default: null },
      resolvedByAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
    messages: [complaintMessageSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

complaintSchema.virtual('customer', {
  ref: 'CustomerProfile',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

complaintSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

complaintSchema.virtual('assignedAdmin', {
  ref: 'User',
  localField: 'assignedAdminId',
  foreignField: '_id',
  justOne: true,
});

const Complaint =
  mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

export default Complaint;
