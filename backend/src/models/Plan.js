import mongoose from 'mongoose'

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'forever'],
      default: 'monthly',
    },
    pipelineLimit: {
      type: Number,
      required: true,
      min: 1,
      default: 20, // Free plan gets exactly 20 runs
    },
    brandLimit: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    historyDays: {
      type: Number,
      default: 14,
    },
    reportAccess: {
      type: String,
      enum: ['basic', 'standard', 'advanced'],
      default: 'basic',
    },
    exportFormats: {
      type: [String],
      default: ['markdown'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

const Plan = mongoose.model('Plan', planSchema)

export default Plan
