import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import SocialPost from '../models/SocialPost.js'
import Analysis from '../models/Analysis.js'
import Insight from '../models/Insight.js'
import Alert from '../models/Alert.js'
import Payment from '../models/Payment.js'
import Plan from '../models/Plan.js'
import BrandProfile from '../models/BrandProfile.js'
import PipelineRun from '../models/PipelineRun.js'
import { initDefaultPlans } from './subscription.service.js'
import { logger } from '../utils/logger.js'
import { HttpError } from '../utils/httpError.js'

export const ensureAdminAccount = async () => {
  try {
    // Initialize default plans first
    await initDefaultPlans()

    const adminEmail = 'admin@gmail.com'
    const adminPassword = 'admin@123'

    const existingAdmin = await User.findOne({ email: adminEmail }).select('+password')

    if (!existingAdmin) {
      logger.info('Creating default admin account (admin@gmail.com)...')
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        plan: 'Premium',
        subscriptionStatus: 'active',
        pipelineUsage: {
          limit: 9999,
          used: 0,
          remaining: 9999,
          lastReset: new Date(),
        },
        status: 'active',
      })
      logger.info('Admin account created successfully (admin@gmail.com / admin@123)')
    } else {
      existingAdmin.role = 'admin'
      existingAdmin.plan = 'Premium'
      existingAdmin.status = 'active'
      const matches = await bcrypt.compare(adminPassword, existingAdmin.password)
      if (!matches) {
        existingAdmin.password = adminPassword
      }
      await existingAdmin.save()
    }

    // Seed default demo transactions if none exist
    const paymentCount = await Payment.countDocuments()
    if (paymentCount === 0) {
      const adminUser = await User.findOne({ email: adminEmail })
      if (adminUser) {
        await seedDefaultPayments(adminUser._id)
      }
    }
  } catch (error) {
    logger.error(`Error ensuring admin account: ${error.message}`)
  }
}

const seedDefaultPayments = async (adminId) => {
  const samplePayments = [
    {
      user: adminId,
      customerName: 'Acme Global Corp',
      customerEmail: 'billing@acmecorp.com',
      amount: 79.00,
      currency: 'USD',
      plan: 'Premium',
      billingCycle: 'monthly',
      status: 'succeeded',
      gateway: 'stripe',
      paymentMethod: 'Stripe · Visa **** 4242',
      transactionId: 'txn_acme_001',
      invoiceId: 'INV-2026-0891',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      user: adminId,
      customerName: 'Starlight Tech Inc',
      customerEmail: 'finance@starlight.io',
      amount: 29.00,
      currency: 'USD',
      plan: 'Plus',
      billingCycle: 'monthly',
      status: 'succeeded',
      gateway: 'stripe',
      paymentMethod: 'Stripe · Mastercard **** 8821',
      transactionId: 'txn_starlight_002',
      invoiceId: 'INV-2026-0892',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
    {
      user: adminId,
      customerName: 'Apex Media Agency',
      customerEmail: 'admin@apexmedia.co',
      amount: 790.00,
      currency: 'USD',
      plan: 'Premium',
      billingCycle: 'annual',
      status: 'succeeded',
      gateway: 'stripe',
      paymentMethod: 'Wire Transfer / ACH',
      transactionId: 'txn_apex_003',
      invoiceId: 'INV-2026-0893',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    },
    {
      user: adminId,
      customerName: 'Nexus AI Labs',
      customerEmail: 'dev@nexuslabs.ai',
      amount: 29.00,
      currency: 'USD',
      plan: 'Plus',
      billingCycle: 'monthly',
      status: 'succeeded',
      gateway: 'stripe',
      paymentMethod: 'PayPal · dev@nexuslabs.ai',
      transactionId: 'txn_nexus_004',
      invoiceId: 'INV-2026-0894',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  ]

  for (const p of samplePayments) {
    await Payment.create(p)
  }
}

export const getAdminOverviewAnalytics = async () => {
  const [
    totalUsers,
    freeUsers,
    plusUsers,
    premiumUsers,
    activeSubs,
    totalPosts,
    totalAnalyses,
    totalInsights,
    totalAlerts,
    openAlerts,
    payments,
    pipelineRuns,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ plan: 'Free' }),
    User.countDocuments({ plan: 'Plus' }),
    User.countDocuments({ plan: { $in: ['Premium', 'Enterprise', 'Pro'] } }),
    User.countDocuments({ subscriptionStatus: 'active' }),
    SocialPost.countDocuments(),
    Analysis.countDocuments(),
    Insight.countDocuments(),
    Alert.countDocuments(),
    Alert.countDocuments({ status: 'open' }),
    Payment.find().sort({ createdAt: -1 }),
    PipelineRun.find().sort({ createdAt: -1 }),
  ])

  const totalRevenue = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const successfulRuns = pipelineRuns.filter((r) => r.status === 'completed').length
  const failedRuns = pipelineRuns.filter((r) => r.status === 'failed').length
  const runningRuns = pipelineRuns.filter((r) => r.status === 'processing').length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const runsToday = pipelineRuns.filter((r) => new Date(r.createdAt) >= today).length

  // Plan distribution for charts
  const planDistribution = [
    { name: 'Free Tier', count: freeUsers, percentage: totalUsers ? Math.round((freeUsers / totalUsers) * 100) : 0, color: '#64748b' },
    { name: 'Plus Plan', count: plusUsers, percentage: totalUsers ? Math.round((plusUsers / totalUsers) * 100) : 0, color: '#2563eb' },
    { name: 'Premium / Enterprise', count: premiumUsers, percentage: totalUsers ? Math.round((premiumUsers / totalUsers) * 100) : 0, color: '#9333ea' },
  ]

  return {
    users: {
      total: totalUsers,
      free: freeUsers,
      plus: plusUsers,
      premium: premiumUsers,
      activeSubscriptions: activeSubs,
    },
    pipeline: {
      totalRuns: pipelineRuns.length,
      runsToday,
      successful: successfulRuns,
      failed: failedRuns,
      running: runningRuns,
      successRate: pipelineRuns.length ? Math.round((successfulRuns / pipelineRuns.length) * 100) : 100,
    },
    revenue: {
      total: totalRevenue,
      formatted: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      transactionCount: payments.filter((p) => p.status === 'succeeded').length,
    },
    content: {
      totalPosts,
      totalAnalyses,
      totalInsights,
      totalAlerts,
      openAlerts,
    },
    planDistribution,
    recentPayments: payments.slice(0, 6),
    recentPipelineRuns: pipelineRuns.slice(0, 8),
  }
}

export const getAllUsersAdmin = async () => {
  const users = await User.find().sort({ createdAt: -1 })
  return users.map((u) => u.toSafeJSON())
}

export const getUserDetailsAdmin = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new HttpError('User not found', 404)

  const brands = await BrandProfile.find({ user: userId }).sort({ createdAt: -1 })
  const pipelineRuns = await PipelineRun.find({ user: userId }).populate('post').sort({ createdAt: -1 }).limit(20)
  const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 })

  return {
    user: user.toSafeJSON(),
    brands,
    pipelineRuns,
    payments,
  }
}

export const updateUserAdmin = async (userId, data) => {
  const user = await User.findById(userId)
  if (!user) throw new HttpError('User not found', 404)

  const allowedFields = ['name', 'role', 'plan', 'status', 'subscriptionStatus', 'suspensionReason', 'company', 'country', 'phone']
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      user[field] = data[field]
    }
  }

  if (data.status === 'active' && data.suspensionReason === undefined) {
    user.suspensionReason = ''
  }

  if (data.pipelineUsage) {
    if (!user.pipelineUsage) user.pipelineUsage = { limit: 20, used: 0, remaining: 20 }
    if (typeof data.pipelineUsage.limit === 'number') user.pipelineUsage.limit = data.pipelineUsage.limit
    if (typeof data.pipelineUsage.used === 'number') user.pipelineUsage.used = data.pipelineUsage.used
    user.pipelineUsage.remaining = Math.max(0, (user.pipelineUsage.limit ?? 20) - (user.pipelineUsage.used ?? 0))
    user.markModified('pipelineUsage')
  }

  await user.save()
  return user.toSafeJSON()
}

export const deleteUserAdmin = async (userId) => {
  const user = await User.findByIdAndDelete(userId)
  if (!user) throw new HttpError('User not found', 404)
  await Promise.all([
    BrandProfile.deleteMany({ user: userId }),
    SocialPost.deleteMany({ user: userId }),
    PipelineRun.deleteMany({ user: userId }),
  ])
  return { success: true, message: `User ${user.email} and associated resources deleted.` }
}

export const getAllPaymentsAdmin = async () => {
  const payments = await Payment.find().populate('user', 'name email').sort({ createdAt: -1 })
  return payments
}

export const createPaymentAdmin = async (data) => {
  const { customerName, customerEmail, amount, plan = 'Plus', billingCycle = 'monthly', status = 'succeeded', paymentMethod = 'Stripe' } = data
  const user = await User.findOne({ email: customerEmail.toLowerCase().trim() })

  const invoiceId = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`
  const txnId = `txn_manual_${Date.now()}`

  const payment = await Payment.create({
    user: user?._id || null,
    customerName,
    customerEmail,
    amount: Number(amount) || 0,
    currency: 'USD',
    plan,
    billingCycle,
    status,
    gateway: 'manual_admin',
    paymentMethod,
    transactionId: txnId,
    invoiceId,
  })

  return payment
}

// Admin Plans Management
export const getAdminPlans = async () => {
  let plans = await Plan.find().sort({ price: 1 })
  if (!plans || plans.length === 0) {
    await initDefaultPlans()
    plans = await Plan.find().sort({ price: 1 })
  }
  return plans
}

export const updateAdminPlan = async (planId, data) => {
  const plan = await Plan.findById(planId)
  if (!plan) throw new HttpError('Plan not found', 404)

  const allowed = ['displayName', 'tagline', 'price', 'billingCycle', 'pipelineLimit', 'brandLimit', 'features', 'historyDays', 'reportAccess', 'exportFormats', 'active', 'isPopular']
  for (const k of allowed) {
    if (data[k] !== undefined) plan[k] = data[k]
  }

  await plan.save()
  return plan
}

export const createAdminPlan = async (data) => {
  const plan = await Plan.create(data)
  return plan
}

export const getAdminPipelineRuns = async ({ status, limit = 50 } = {}) => {
  const query = {}
  if (status) query.status = status
  const runs = await PipelineRun.find(query)
    .populate('user', 'name email plan')
    .populate('post', 'author content platform')
    .sort({ createdAt: -1 })
    .limit(Math.min(200, Math.max(1, Number(limit) || 50)))
  return runs
}
