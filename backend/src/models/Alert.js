import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialPost', required: true },
  analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', required: true },
  type: { type: String, enum: ['negative_sentiment'], default: 'negative_sentiment' },
  severity: { type: String, enum: ['medium', 'high'], required: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
}, { timestamps: true })

alertSchema.index({ user: 1, status: 1, createdAt: -1 })
alertSchema.index({ user: 1, post: 1, type: 1 }, { unique: true })

export default mongoose.model('Alert', alertSchema)
