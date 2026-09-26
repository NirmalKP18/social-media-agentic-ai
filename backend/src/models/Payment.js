import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    plan: {
      type: String,
      enum: ['Free', 'Plus', 'Premium', 'Starter', 'Pro', 'Enterprise'],
      default: 'Plus',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'forever'],
      default: 'monthly',
    },
    status: {
      type: String,
      enum: ['succeeded', 'pending', 'failed', 'refunded', 'cancelled'],
      default: 'succeeded',
      index: true,
    },
    gateway: {
      type: String,
      default: 'stripe',
    },
    paymentMethod: {
      type: String,
      default: 'Visa **** 4242',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

paymentSchema.index({ user: 1, createdAt: -1 })

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
