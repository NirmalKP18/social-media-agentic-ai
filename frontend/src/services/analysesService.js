import apiClient from './api.js'

export const analysesService = {
  analyzePost: (postId) => apiClient.post(`/analyses/posts/${postId}`).then((response) => response.data),
  getAnalysisForPost: (postId) => apiClient.get(`/analyses/posts/${postId}`).then((response) => response.data),
  getAnalyses: () => apiClient.get('/analyses').then((response) => response.data),
  deleteAnalysis: (id) => apiClient.delete(`/analyses/${id}`).then((response) => response.data),
}