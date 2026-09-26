import mongoose from 'mongoose'
import { SOCIAL_PLATFORMS } from '../constants/social.js'

const socialPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: SOCIAL_PLATFORMS,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: 2000,
    },
    externalId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    sourceUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    ingestionMethod: { type: String, enum: ['manual', 'platform_api', 'screenshot'], default: 'manual' },
    comments: [{
      author: { type: String, required: true, trim: true, maxlength: 100 },
      content: { type: String, required: true, trim: true, maxlength: 1000 },
      publishedAt: { type: Date, default: null },
    }],
    publishedAt: {
      type: Date,
    },
    engagement: {
      likes: {
        type: Number,
        default: 0,
        min: [0, 'Likes cannot be negative'],
      },
      shares: {
        type: Number,
        default: 0,
        min: [0, 'Shares cannot be negative'],
      },
      comments: {
        type: Number,
        default: 0,
        min: [0, 'Comments cannot be negative'],
      },
    },
    cleanedText: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    processingStatus: {
      type: String,
      enum: ['collected', 'processed', 'failed'],
      default: 'collected',
    },
  },
  {
    timestamps: true,
  },
)

socialPostSchema.index({ user: 1, createdAt: -1 })
socialPostSchema.index({ user: 1, platform: 1, externalId: 1 }, { unique: true, partialFilterExpression: { externalId: { $type: 'string', $gt: '' } } })

const SocialPost = mongoose.model('SocialPost', socialPostSchema)

export default SocialPost
