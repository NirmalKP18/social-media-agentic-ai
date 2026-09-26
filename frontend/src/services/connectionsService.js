import apiClient from './api.js'

export const connectionsService = {
  getConnections: () => apiClient.get('/connections').then((response) => response.data),
  testConnection: (platform) => apiClient.post(`/connections/${platform}/test`).then((response) => response.data),
  importPosts: (platform, data) => apiClient.post(`/connections/${platform}/import`, data).then((response) => response.data),
}
