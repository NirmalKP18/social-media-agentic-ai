import apiClient from './api.js'

export const knowledgeService = {
  getDocuments: () => apiClient.get('/knowledge').then((response) => response.data),
  getStats: () => apiClient.get('/knowledge/stats').then((response) => response.data),
  createDocument: (data) => apiClient.post('/knowledge', data, { timeout: 45000 }).then((response) => response.data),
  uploadDocument: (formData) =>
    apiClient
      .post('/knowledge/upload', formData, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => response.data),
  deleteDocument: (id) => apiClient.delete(`/knowledge/${id}`).then((response) => response.data),
  reindex: () => apiClient.post('/knowledge/reindex', {}, { timeout: 60000 }).then((response) => response.data),
}
