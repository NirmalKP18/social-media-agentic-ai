import {
  getAdminOverviewAnalytics,
  getAllUsersAdmin,
  getUserDetailsAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  getAllPaymentsAdmin,
  createPaymentAdmin,
  getAdminPlans,
  updateAdminPlan,
  createAdminPlan,
  getAdminPipelineRuns,
} from '../services/admin.service.js'
import { adminAdjustUsage, adminChangeUserPlan } from '../services/subscription.service.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { listSecurityAssessmentCases, runSecurityAssessmentCase } from '../services/securityAssessment.service.js'

export const getAnalytics = async (req, res) => {
  const analytics = await getAdminOverviewAnalytics()
  sendSuccess(res, { analytics }, 'Admin analytics retrieved successfully')
}

export const getUsers = async (req, res) => {
  const users = await getAllUsersAdmin()
  sendSuccess(res, { users, count: users.length }, 'Admin users retrieved successfully')
}

export const getUserDetails = async (req, res) => {
  const details = await getUserDetailsAdmin(req.params.id)
  sendSuccess(res, details, 'User details retrieved successfully')
}

export const updateUser = async (req, res) => {
  const user = await updateUserAdmin(req.params.id, req.body)
  sendSuccess(res, { user }, 'User updated successfully')
}

export const adjustUserUsage = async (req, res) => {
  const user = await adminAdjustUsage(req.params.id, req.body)
  sendSuccess(res, { user }, 'User pipeline usage adjusted successfully')
}

export const changeUserPlan = async (req, res) => {
  const user = await adminChangeUserPlan(req.params.id, req.body)
  sendSuccess(res, { user }, 'User plan changed successfully')
}

export const deleteUser = async (req, res) => {
  const result = await deleteUserAdmin(req.params.id)
  sendSuccess(res, result, 'User deleted successfully')
}

export const getPayments = async (req, res) => {
  const payments = await getAllPaymentsAdmin()
  sendSuccess(res, { payments, count: payments.length }, 'Admin payments retrieved successfully')
}

export const createPayment = async (req, res) => {
  const payment = await createPaymentAdmin(req.body)
  sendSuccess(res, { payment }, 'Payment recorded successfully', 201)
}

export const getPlans = async (req, res) => {
  const plans = await getAdminPlans()
  sendSuccess(res, { plans }, 'Admin plans retrieved successfully')
}

export const updatePlan = async (req, res) => {
  const plan = await updateAdminPlan(req.params.id, req.body)
  sendSuccess(res, { plan }, 'Plan updated successfully')
}

export const createPlan = async (req, res) => {
  const plan = await createAdminPlan(req.body)
  sendSuccess(res, { plan }, 'Plan created successfully', 201)
}

export const getPipelineRuns = async (req, res) => {
  const runs = await getAdminPipelineRuns({
    status: req.query.status,
    limit: req.query.limit,
  })
  sendSuccess(res, { runs, count: runs.length }, 'Admin pipeline runs retrieved successfully')
}

export const getSecurityAssessmentCases = async (req, res) => {
  sendSuccess(res, { cases: listSecurityAssessmentCases() }, 'Security assessment cases retrieved successfully')
}

export const runSecurityAssessment = async (req, res) => {
  const result = await runSecurityAssessmentCase(req.params.caseId)
  sendSuccess(res, { result }, `${result.id} completed with outcome ${result.outcome}`)
}
