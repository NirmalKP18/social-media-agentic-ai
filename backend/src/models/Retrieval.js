import mongoose from 'mongoose'

const MAX_QUERY_LENGTH = 200

const retrievalResultSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialPost',
      required: [true, 'Retrieved post is required'],
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
  { _id: false },
)

const retrievalSchema = new mongoose.Schema(
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
      index: true,
    },
    query: {
      type: String,
      required: [true, 'Query is required'],
      trim: true,
      maxlength: MAX_QUERY_LENGTH,
    },
    results: {
      type: [retrievalResultSchema],
      default: [],
    },
    knowledge: [{
      title: { type: String, default: '' },
      source: { type: String, default: '' },
      chunk: { type: String, default: '' },
      score: { type: Number, min: 0, max: 1, default: 0 },
      _id: false,
    }],
  },
  {
    timestamps: true,
  },
)

retrievalSchema.index({ user: 1, createdAt: -1 })

const Retrieval = mongoose.model('Retrieval', retrievalSchema)

export default Retrieval