import { registerUser, loginUser, getCurrentUser } from '../services/auth.service.js'
import User from '../models/User.js'
import { sendSuccess, sendError } from '../utils/apiResponse.js'
import { recordAudit } from '../services/audit.service.js'

export const register = async (req, res) => {
  const { user, token } = await registerUser(req.body)
  await recordAudit({ userId: user.id, action: 'auth.register', resource: 'user', resourceId: user.id })
  sendSuccess(res, { user, token }, 'User registered successfully', 201)
}

export const login = async (req, res) => {
  const { user, token } = await loginUser(req.body)
  await recordAudit({ userId: user.id, action: 'auth.login', resource: 'user', resourceId: user.id })
  sendSuccess(res, { user, token }, 'Login successful')
}

export const me = async (req, res) => {
  const user = await getCurrentUser(req.user.id)
  sendSuccess(res, { user }, 'Current user retrieved')
}

export const updateOnboarding = async (req, res) => {
  try {
    const userId = req.user.id
    const { hasSeenWelcome, dontShowAgain, checklist } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return sendError(res, 'User not found', 404)
    }

    user.onboardingPreferences = {
      ...user.onboardingPreferences,
      ...(hasSeenWelcome !== undefined && { hasSeenWelcome }),
      ...(dontShowAgain !== undefined && { dontShowAgain }),
      ...(checklist !== undefined && { checklist }),
    }

    await user.save()
    sendSuccess(res, { user: user.toSafeJSON() }, 'Onboarding preferences updated')
  } catch (error) {
    sendError(res, error.message || 'Failed to update onboarding preferences', 500)
  }
}
