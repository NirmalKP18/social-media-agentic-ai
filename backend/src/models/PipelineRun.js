import mongoose from 'mongoose'

const pipelineRunSchema = new mongoose.Schema(
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
      required: [true, 'Mention is required'],
      index: true,
    },
    jobId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'cancelled'],
      default: 'processing',
    },
    stages: {
      collection: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
      analysis: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
      retrieval: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
      generation: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    },
    events: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    failedStage: { type: String, default: '' },
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
    analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', default: null },
    retrieval: { type: mongoose.Schema.Types.ObjectId, ref: 'Retrieval', default: null },
    insight: { type: mongoose.Schema.Types.ObjectId, ref: 'Insight', default: null },
    error: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

pipelineRunSchema.index({ user: 1, post: 1, createdAt: -1 })
pipelineRunSchema.index({ status: 1, createdAt: -1 })

const PipelineRun = mongoose.model('PipelineRun', pipelineRunSchema)

export default PipelineRun
