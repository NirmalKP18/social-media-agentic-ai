import mongoose from 'mongoose'
import Plan from '../models/Plan.js'
import User from '../models/User.js'
import Payment from '../models/Payment.js'
import BrandProfile from '../models/BrandProfile.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'

export const DEFAULT_PLANS = [
  {
    name: 'Free',
    displayName: 'Free Starter',
    tagline: 'Test and explore brand monitoring with 20 pipeline runs.',
    price: 0,
    billingCycle: 'forever',
    pipelineLimit: 20, // Exactly 20 pipeline runs for Free
    brandLimit: 1,
    features: [
      '20 Full Multi-Agent Pipeline Runs',
      '1 Tracked Brand / Keyword Profile',
      'Basic Social-Media Monitoring',
      'Continuous Sentiment Scoring',
      'Live Operations Dashboard',
      'Standard 14-Day Data History',
    ],
    historyDays: 14,
    reportAccess: 'basic',
    exportFormats: ['markdown'],
    active: true,
    isPopular: false,
  },
  {
    name: 'Plus',
    displayName: 'Plus Professional',
    tagline: 'For creators, agencies & growing brands requiring serious monitoring.',
    price: 29,
    billingCycle: 'monthly',
    pipelineLimit: 100,
    brandLimit: 5,
    features: [
      '100 Pipeline Runs / Month',
      'Up to 5 Tracked Brand & Keyword Profiles',
      'Multi-Platform Autonomous Social Monitoring',
      'Deep Emotion & Intent Classification (Agent 2)',
      'Vector RAG Knowledge Base Grounding (Agent 3)',
      'Automated PR Response Drafting (Agent 4)',
      'Executive PDF & Markdown Report Exports',
      'Priority Pipeline Execution Queue',
      '60-Day Historical Analytics',
    ],
    historyDays: 60,
    reportAccess: 'standard',
    exportFormats: ['markdown', 'pdf', 'json'],
    active: true,
    isPopular: true,
  },
  {
    name: 'Premium',
    displayName: 'Enterprise Premium',
    tagline: 'Uncapped intelligence, competitor tracking & custom RAG pipelines.',
    price: 79,
    billingCycle: 'monthly',
    pipelineLimit: 500,
    brandLimit: 20,
    features: [
      '500 Pipeline Runs / Month (High-Capacity)',
      'Up to 20 Tracked Brands & Competitor Profiles',
      'Full 4-Agent Autonomous Workflow Suite',
      'Competitor Benchmarking & Sentiment Shifts',
      'Custom Enterprise Vector Knowledge Base',
      'Human-in-the-Loop PR Crisis Authorization',
      'Unlimited White-Label PDF / JSON / MD Reports',
      'Real-Time Webhook & Telegram / Slack Alerts',
      'Dedicated 24/7 Priority Support & SLAs',
      'Unlimited Historical Archive Access',
    ],
    historyDays: 365,
    reportAccess: 'advanced',
    exportFormats: ['markdown', 'pdf', 'json', 'csv'],
    active: true,
    isPopular: false,
  },
]

export const initDefaultPlans = async () => {
  try {
    for (const def of DEFAULT_PLANS) {
      const existing = await Plan.findOne({ name: def.name })
      if (!existing) {
        await Plan.create(def)
        logger.info(`Initialized subscription plan: ${def.name}`)
      }
    }
  } catch (err) {
    logger.warn(`Could not seed default plans: ${err.message}`)
  }
}

export const getPublicPlans = async () => {
  let plans = await Plan.find({ active: true }).sort({ price: 1 })
  if (!plans || plans.length === 0) {
    await initDefaultPlans()
    plans = await Plan.find({ active: true }).sort({ price: 1 })
  }
  return plans
}

export const getUserSubscription = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new HttpError('User not found', 404)

  const planName = user.plan || 'Free'
  let plan = await Plan.findOne({ name: planName })
  if (!plan) {
    plan = await Plan.findOne({ name: 'Free' }) || DEFAULT_PLANS[0]
  }

  const brandCount = await BrandProfile.countDocuments({ user: userId })
  const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 }).limit(10)

  const usage = user.pipelineUsage || { limit: plan.pipelineLimit || 20, used: 0, remaining: plan.pipelineLimit || 20 }
  const limit = usage.limit ?? plan.pipelineLimit ?? 20
  const used = usage.used ?? 0
  const remaining = Math.max(0, limit - used)
  const isSubscriptionExempt = user.role === 'admin'

  return {
    user: user.toSafeJSON(),
    plan: {
      name: plan.name,
      displayName: plan.displayName || plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle,
      pipelineLimit: limit,
      brandLimit: plan.brandLimit,
      features: plan.features,
      historyDays: plan.historyDays,
      reportAccess: plan.reportAccess,
    },
    usage: {
      limit,
      used,
      remaining,
      percent: Math.min(100, Math.round((used / limit) * 100)),
      lastReset: usage.lastReset || user.createdAt,
      nextReset: usage.nextReset || null,
    },
    brandCount,
    payments,
    isSubscriptionExempt,
    isAtLimit: !isSubscriptionExempt && remaining <= 0,
  }
}

export const checkAndEnforcePipelineLimit = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new HttpError('User not found', 404)

  if (user.status === 'suspended') {
    throw new HttpError('Your account has been suspended. Please contact platform support.', 403)
  }

  // Administrators operate the platform itself and are not subscription customers.
  // Keep account suspension enforcement above, but bypass all plan quotas here.
  if (user.role === 'admin') {
    return { allowed: true, unlimited: true }
  }

  const planName = user.plan || 'Free'
  let plan = await Plan.findOne({ name: planName })
  const defaultLimit = plan ? plan.pipelineLimit : (planName === 'Free' ? 20 : 100)

  if (!user.pipelineUsage) {
    user.pipelineUsage = {
      limit: defaultLimit,
      used: 0,
      remaining: defaultLimit,
      lastReset: new Date(),
    }
    await user.save()
  }

  const currentLimit = user.pipelineUsage.limit ?? defaultLimit
  const currentUsed = user.pipelineUsage.used ?? 0
  const currentRemaining = Math.max(0, currentLimit - currentUsed)

  if (currentRemaining <= 0 || currentUsed >= currentLimit) {
    throw new HttpError(
      `You have reached your ${user.plan} plan pipeline limit (${currentUsed}/${currentLimit} runs used). Upgrade your plan to continue monitoring.`,
      403,
    )
  }

  return {
    allowed: true,
    limit: currentLimit,
    used: currentUsed,
    remaining: currentRemaining,
  }
}

export const chargePipelineRun = async (userId) => {
  const user = await User.findById(userId)
  if (!user) return

  if (user.role === 'admin') {
    logger.info(`Skipped pipeline charge for subscription-exempt admin ${user.email}.`)
    return user.pipelineUsage
  }

  if (!user.pipelineUsage) {
    user.pipelineUsage = { limit: 20, used: 0, remaining: 20 }
  }

  user.pipelineUsage.used = (user.pipelineUsage.used || 0) + 1
  user.pipelineUsage.remaining = Math.max(0, (user.pipelineUsage.limit || 20) - user.pipelineUsage.used)
  user.markModified('pipelineUsage')
  await user.save()

  logger.info(`Charged pipeline run for user ${user.email}. Used: ${user.pipelineUsage.used}/${user.pipelineUsage.limit} (Remaining: ${user.pipelineUsage.remaining})`)
  return user.pipelineUsage
}

export const processCheckout = async (userId, { planName, billingCycle = 'monthly', paymentMethod = 'Credit Card', transactionId }) => {
  const user = await User.findById(userId)
  if (!user) throw new HttpError('User not found', 404)

  const plan = await Plan.findOne({ name: planName, active: true })
  if (!plan) throw new HttpError(`Plan '${planName}' not found or inactive`, 404)

  // Determine amount
  const amount = plan.price

  // Generate unique transaction & invoice IDs if not provided
  const txnId = transactionId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const invoiceId = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`

  // Create payment record
  const payment = await Payment.create({
    user: user._id,
    customerName: user.name,
    customerEmail: user.email,
    amount,
    currency: 'USD',
    plan: plan.name,
    billingCycle,
    status: 'succeeded',
    gateway: 'stripe_modular',
    paymentMethod,
    transactionId: txnId,
    invoiceId,
    metadata: {
      previousPlan: user.plan,
      upgradedAt: new Date(),
    },
  })

  // Update user subscription & assign new pipeline allowance
  const newLimit = plan.pipelineLimit
  const currentUsed = user.pipelineUsage?.used || 0

  user.plan = plan.name
  user.subscriptionStatus = 'active'
  user.pipelineUsage = {
    limit: newLimit,
    used: currentUsed,
    remaining: Math.max(0, newLimit - currentUsed),
    lastReset: new Date(),
    nextReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }

  await user.save()
  logger.info(`User ${user.email} successfully upgraded to ${plan.name} plan. New limit: ${newLimit} runs.`)

  return {
    success: true,
    user: user.toSafeJSON(),
    payment,
    invoiceId,
  }
}

export const adminAdjustUsage = async (userId, { limit, used, resetAllowance }) => {
  const user = await User.findById(userId)
  if (!user) throw new HttpError('User not found', 404)

  if (resetAllowance) {
    const plan = await Plan.findOne({ name: user.plan })
    const baseLimit = plan ? plan.pipelineLimit : (user.plan === 'Free' ? 20 : 100)
    user.pipelineUsage = {
      limit: baseLimit,
      used: 0,
      remaining: baseLimit,
      lastReset: new Date(),
    }
  } else {
    if (!user.pipelineUsage) user.pipelineUsage = { limit: 20, used: 0, remaining: 20 }
    if (typeof limit === 'number' && limit >= 0) user.pipelineUsage.limit = limit
    if (typeof used === 'number' && used >= 0) user.pipelineUsage.used = used
    user.pipelineUsage.remaining = Math.max(0, (user.pipelineUsage.limit ?? 20) - (user.pipelineUsage.used ?? 0))
  }

  user.markModified('pipelineUsage')
  await user.save()
  return user.toSafeJSON()
}

export const adminChangeUserPlan = async (userId, { planName, status }) => {
  const user = await User.findById(userId)
  if (!user) throw new HttpError('User not found', 404)

  if (planName) {
    const plan = await Plan.findOne({ name: planName })
    const newLimit = plan ? plan.pipelineLimit : 20
    user.plan = planName
    user.pipelineUsage = {
      limit: newLimit,
      used: 0,
      remaining: newLimit,
      lastReset: new Date(),
    }
  }

  if (status) {
    user.status = status
  }

  await user.save()
  return user.toSafeJSON()
}
