import mongoose from 'mongoose'

const MAX_TITLE_LENGTH = 200
const MAX_TEXT_LENGTH = 20000
const MAX_SOURCE_LENGTH = 500

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: MAX_TITLE_LENGTH,
    },
    text: {
      type: String,
      required: [true, 'Document text is required'],
      trim: true,
      maxlength: MAX_TEXT_LENGTH,
    },
    source: {
      type: String,
      trim: true,
      maxlength: MAX_SOURCE_LENGTH,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    pythonId: {
      type: String,
      default: '',
    },
    chunks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

knowledgeDocumentSchema.index({ user: 1, createdAt: -1 })

const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema)

export default KnowledgeDocument
