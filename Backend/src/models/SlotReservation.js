import mongoose from 'mongoose';

const slotReservationSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
      required: true,
      index: true,
    },
    dateString: {
      type: String,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['RESERVED', 'RELEASED'],
      default: 'RESERVED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Atomic unique reservation per provider, date, and slot
slotReservationSchema.index(
  { providerId: 1, dateString: 1, timeSlot: 1 },
  { unique: true }
);

const SlotReservation =
  mongoose.models.SlotReservation ||
  mongoose.model('SlotReservation', slotReservationSchema);

export default SlotReservation;
