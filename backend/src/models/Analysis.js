import mongoose from 'mongoose'

const SENTIMENT_LABELS = ['positive', 'negative', 'neutral']
const MAX_SUMMARY_LENGTH = 500

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialPost',
      required: [true, 'Post is required'],
      unique: true,
    },
    sentiment: {
      label: {
        type: String,
        required: true,
        enum: SENTIMENT_LABELS,
      },
      score: {
        type: Number,
        required: true,
        min: -1,
        max: 1,
      },
      confidence: { type: Number, required: true, min: 0, max: 1 },
    },
    topics: {
      type: [String],
      default: [],
    },
    entities: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: '',
      maxlength: MAX_SUMMARY_LENGTH,
    },
    intent: {
      type: String,
      enum: ['complaint', 'question', 'praise', 'suggestion', 'spam', 'other'],
      default: 'other',
    },
    emotion: {
      label: { type: String, default: 'neutral' },
      scores: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    priority: {
      level: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },
      score: { type: Number, min: 0, max: 100, default: 0 },
      factors: { type: [String], default: [] },
    },
    namedEntities: [{
      text: { type: String, required: true },
      type: { type: String, required: true },
      _id: false,
    }],
    commentAnalyses: [{
      author: { type: String, required: true },
      content: { type: String, required: true },
      sentiment: {
        label: { type: String, enum: SENTIMENT_LABELS, required: true },
        score: { type: Number, min: -1, max: 1, required: true },
        confidence: { type: Number, min: 0, max: 1, required: true },
      },
      topics: { type: [String], default: [] },
      entities: { type: [String], default: [] },
      intent: { type: String, default: 'other' },
      emotion: {
        label: { type: String, default: 'neutral' },
        confidence: { type: Number, default: 0.5 },
      },
      priority: {
        level: { type: String, default: 'low' },
        score: { type: Number, default: 0 },
      },
      summary: { type: String, default: '' },
    }],
    conversation: {
      totalComments: { type: Number, default: 0 },
      positive: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      questions: { type: Number, default: 0 },
      complaints: { type: Number, default: 0 },
      praise: { type: Number, default: 0 },
      suggestions: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0, min: -1, max: 1 },
      backlashRatio: { type: Number, default: 0, min: 0, max: 1 },
    },
  },
  {
    timestamps: true,
  },
)

analysisSchema.index({ user: 1, createdAt: -1 })

const Analysis = mongoose.model('Analysis', analysisSchema)

export default Analysis
