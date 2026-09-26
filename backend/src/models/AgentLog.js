import mongoose from 'mongoose'

const agentLogSchema = new mongoose.Schema(
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
      default: null,
    },
    pipelineRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PipelineRun',
      default: null,
    },
    agentName: {
      type: String,
      required: [true, 'Agent is required'],
      enum: ['collection', 'nlp', 'retrieval', 'insight'],
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    inputSummary: { type: String, default: '', maxlength: 2000 },
    outputSummary: { type: String, default: '', maxlength: 4000 },
    errorMessage: { type: String, default: '', maxlength: 2000 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

agentLogSchema.index({ user: 1, createdAt: -1 })
agentLogSchema.index({ pipelineRun: 1 })
agentLogSchema.index({ agentName: 1, status: 1 })

const AgentLog = mongoose.model('AgentLog', agentLogSchema)

export default AgentLog