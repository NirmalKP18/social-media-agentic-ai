import mongoose from 'mongoose'

const brandProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Brand or profile name is required'],
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ['brand', 'company', 'product', 'personal_name', 'creator', 'campaign', 'keyword'],
      default: 'brand',
    },
    primaryKeyword: {
      type: String,
      required: [true, 'Primary keyword is required'],
      trim: true,
      maxlength: 120,
    },
    alternativeKeywords: {
      type: [String],
      default: [],
    },
    platforms: {
      type: [String],
      default: ['x', 'reddit', 'linkedin', 'facebook', 'youtube', 'instagram'],
    },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    competitors: {
      type: [String],
      default: [],
    },
    stats: {
      totalMentions: { type: Number, default: 0 },
      positiveMentions: { type: Number, default: 0 },
      neutralMentions: { type: Number, default: 0 },
      negativeMentions: { type: Number, default: 0 },
      averageSentiment: { type: Number, default: 0 },
      totalEngagement: { type: Number, default: 0 },
      pipelineRunsCount: { type: Number, default: 0 },
    },
    lastAnalyzedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

brandProfileSchema.index({ user: 1, name: 1 })

const BrandProfile = mongoose.model('BrandProfile', brandProfileSchema)

export default BrandProfile
