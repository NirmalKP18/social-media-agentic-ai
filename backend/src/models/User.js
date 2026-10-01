import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'reviewer', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['Free', 'Plus', 'Premium', 'Starter', 'Pro', 'Enterprise'],
      default: 'Free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'payment_pending', 'suspended', 'cancelled', 'expired', 'not_required'],
      default: 'active',
    },
    pipelineUsage: {
      limit: { type: Number, default: 20 }, // Free plan receives exactly 20 runs
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 20 },
      lastReset: { type: Date, default: Date.now },
      nextReset: { type: Date, default: null },
    },
    company: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    country: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 30,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    onboardingPreferences: {
      hasSeenWelcome: { type: Boolean, default: false },
      dontShowAgain: { type: Boolean, default: false },
      completedOnboarding: { type: Boolean, default: false },
      checklist: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
  },
  {
    timestamps: true,
  },
)

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return

  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const usage = this.pipelineUsage || { limit: 20, used: 0, remaining: 20 }
  const remainingCalculated = Math.max(0, (usage.limit ?? 20) - (usage.used ?? 0))

  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    plan: this.plan || 'Free',
    subscriptionStatus: this.subscriptionStatus || 'active',
    pipelineUsage: {
      limit: usage.limit ?? 20,
      used: usage.used ?? 0,
      remaining: remainingCalculated,
      lastReset: usage.lastReset || this.createdAt,
      nextReset: usage.nextReset || null,
    },
    company: this.company || '',
    country: this.country || '',
    phone: this.phone || '',
    status: this.status || 'active',
    lastLoginAt: this.lastLoginAt || null,
    onboardingPreferences: this.onboardingPreferences || {
      hasSeenWelcome: false,
      dontShowAgain: false,
      completedOnboarding: false,
      checklist: {},
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

const User = mongoose.model('User', userSchema)

export default User