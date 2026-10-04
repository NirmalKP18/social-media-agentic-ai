import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Plan from '../models/Plan.js'
import { config } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'

const signToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

export const registerUser = async ({ name, email, password, plan = 'Free', company = '', country = '', phone = '' }) => {
  const normalizedEmail = String(email).trim().toLowerCase()

  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    throw new HttpError('An account with this email already exists', 409)
  }

  // Look up plan details to assign appropriate pipeline allowance
  const normalizedPlanName = ['Free', 'Plus', 'Premium', 'Starter', 'Pro', 'Enterprise'].includes(plan) ? plan : 'Free'
  let planDoc = await Plan.findOne({ name: normalizedPlanName })
  const initialLimit = planDoc ? planDoc.pipelineLimit : (normalizedPlanName === 'Free' ? 20 : 100)

  let user
  try {
    user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      plan: normalizedPlanName,
      company: String(company || '').trim(),
      country: String(country || '').trim(),
      phone: String(phone || '').trim(),
      subscriptionStatus: normalizedPlanName === 'Free' ? 'active' : 'payment_pending',
      pipelineUsage: {
        limit: initialLimit,
        used: 0,
        remaining: initialLimit,
        lastReset: new Date(),
        nextReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      lastLoginAt: new Date(),
    })
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError('An account with this email already exists', 409)
    }
    throw error
  }

  logger.info(`Registered new user ${user.email} on ${user.plan} plan (${initialLimit} pipeline runs assigned)`)

  return {
    user: user.toSafeJSON(),
    token: signToken(user._id),
  }
}

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = String(email).trim().toLowerCase()

  const user = await User.findOne({ email: normalizedEmail }).select('+password')
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError('Invalid email or password', 401)
  }

  if (user.status === 'suspended') {
    const reasonText = user.suspensionReason ? ` Reason: "${user.suspensionReason}"` : ''
    throw new HttpError(`Your account has been suspended by an administrator.${reasonText}`, 403)
  }

  const lastLoginAt = new Date()
  user.lastLoginAt = lastLoginAt
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt } })

  return {
    user: user.toSafeJSON(),
    token: signToken(user._id),
  }
}

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)
  if (!user) {
    throw new HttpError('User not found', 404)
  }
  return user.toSafeJSON()
}