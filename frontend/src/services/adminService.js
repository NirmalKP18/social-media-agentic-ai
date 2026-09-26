import api from './api.js'

export const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: () => api.get('/admin/users'),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  adjustUserUsage: (id, data) => api.post(`/admin/users/${id}/adjust-usage`, data),
  changeUserPlan: (id, data) => api.post(`/admin/users/${id}/change-plan`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPayments: () => api.get('/admin/payments'),
  createPayment: (data) => api.post('/admin/payments', data),
  getPlans: () => api.get('/admin/plans'),
  createPlan: (data) => api.post('/admin/plans', data),
  updatePlan: (id, data) => api.put(`/admin/plans/${id}`, data),
  getPipelineRuns: (params) => api.get('/admin/pipeline-runs', { params }),
}
