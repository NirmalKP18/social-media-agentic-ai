import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true },
    count: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const entitySchema = new mongoose.Schema(
  {
    entity: { type: String, required: true, trim: true },
    count: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const rankedPostSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialPost',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
  },
  { _id: false },
)

const insightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    retrieval: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Retrieval',
      default: null,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialPost',
      default: null,
      index: true,
    },
    pipelineRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PipelineRun',
      default: null,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    statistics: {
      totalPosts: {
        type: Number,
        required: true,
        min: 0,
      },
      analyzedPosts: {
        type: Number,
        required: true,
        min: 0,
      },
      sentimentDistribution: {
        positive: { type: Number, required: true, min: 0 },
        negative: { type: Number, required: true, min: 0 },
        neutral: { type: Number, required: true, min: 0 },
        positivePercent: { type: Number, required: true, min: 0, max: 100 },
        negativePercent: { type: Number, required: true, min: 0, max: 100 },
        neutralPercent: { type: Number, required: true, min: 0, max: 100 },
      },
      averageSentimentScore: {
        type: Number,
        required: true,
        min: -1,
        max: 1,
      },
      totalEngagement: {
        likes: { type: Number, required: true, min: 0 },
        shares: { type: Number, required: true, min: 0 },
        comments: { type: Number, required: true, min: 0 },
      },
    },
    topTopics: {
      type: [topicSchema],
      default: [],
    },
    topEntities: {
      type: [entitySchema],
      default: [],
    },
    topPositivePosts: {
      type: [rankedPostSchema],
      default: [],
    },
    topNegativePosts: {
      type: [rankedPostSchema],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    evidence: [{
      post: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialPost', required: true },
      score: { type: Number, min: 0, max: 1, default: 1 },
    }],
    knowledgeSources: [{
      title: { type: String, default: '' },
      source: { type: String, default: '' },
      chunk: { type: String, default: '' },
      score: { type: Number, min: 0, max: 1, default: 0 },
      _id: false,
    }],
    insufficientEvidence: { type: Boolean, default: false },
    agentMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    generation: {
      provider: { type: String, required: true, default: 'local-fallback' },
      model: { type: String, required: true, default: 'template-v1' },
      warning: { type: String, default: '' },
      rationale: { type: String, default: '' },
    },
    draftResponse: { type: String, required: true, trim: true, maxlength: 2000 },
    review: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      editedDraft: { type: String, default: '', maxlength: 2000 },
      note: { type: String, default: '', maxlength: 500 },
      reviewedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  },
)

insightSchema.index({ user: 1, createdAt: -1 })

const Insight = mongoose.model('Insight', insightSchema)

export default Insight
