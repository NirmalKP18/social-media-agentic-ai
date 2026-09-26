import apiClient from './api.js'

export const retrievalService = {
  search: (data) => apiClient.post('/retrieval', data).then((response) => response.data),
  getRetrievals: () => apiClient.get('/retrieval').then((response) => response.data),
  getRetrieval: (id) => apiClient.get(`/retrieval/${id}`).then((response) => response.data),
  deleteRetrieval: (id) => apiClient.delete(`/retrieval/${id}`).then((response) => response.data),
}