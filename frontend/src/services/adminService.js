import api from './api.js'

export const adminService = {
  getAnalytics: () => api.get('/admin/analytics').then((res) => res.data),
  getUsers: () => api.get('/admin/users').then((res) => res.data),
  getUserDetails: (id) => api.get(`/admin/users/${id}`).then((res) => res.data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data).then((res) => res.data),
  adjustUserUsage: (id, data) => api.post(`/admin/users/${id}/adjust-usage`, data).then((res) => res.data),
  changeUserPlan: (id, data) => api.post(`/admin/users/${id}/change-plan`, data).then((res) => res.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((res) => res.data),
  getPayments: () => api.get('/admin/payments').then((res) => res.data),
  createPayment: (data) => api.post('/admin/payments', data).then((res) => res.data),
  getPlans: () => api.get('/admin/plans').then((res) => res.data),
  createPlan: (data) => api.post('/admin/plans', data).then((res) => res.data),
  updatePlan: (id, data) => api.put(`/admin/plans/${id}`, data).then((res) => res.data),
  getPipelineRuns: (params) => api.get('/admin/pipeline-runs', { params }).then((res) => res.data),
  getSecurityAssessmentCases: () => api.get('/admin/security-assessment/cases').then((res) => res.data),
  runSecurityAssessment: (caseId) => api.post(`/admin/security-assessment/${caseId}/run`, null, { timeout: 90000 }).then((res) => res.data),
}
