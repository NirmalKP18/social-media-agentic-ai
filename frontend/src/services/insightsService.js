import apiClient from './api.js'

export const insightsService = {
  createInsight: (data) =>
    apiClient.post('/insights', data, { timeout: 120000 }).then((response) => response.data),
  getInsights: () => apiClient.get('/insights').then((response) => response.data),
  getInsight: (id) => apiClient.get(`/insights/${id}`).then((response) => response.data),
  deleteInsight: (id) => apiClient.delete(`/insights/${id}`).then((response) => response.data),
  exportInsight: (id, format) =>
    apiClient.get(`/insights/${id}/export`, { params: { format } }).then((response) => response.data),
  downloadPdf: (id) => apiClient.get(`/insights/${id}/export`, { params: { format: 'pdf' }, responseType: 'blob', timeout: 30000 }),
  reviewInsight: (id, data) => apiClient.patch(`/insights/${id}/review`, data).then((response) => response.data),
}
