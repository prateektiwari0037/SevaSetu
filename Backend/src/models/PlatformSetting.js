import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const PlatformSetting =
  mongoose.models.PlatformSetting ||
  mongoose.model('PlatformSetting', platformSettingSchema);

export default PlatformSetting;
