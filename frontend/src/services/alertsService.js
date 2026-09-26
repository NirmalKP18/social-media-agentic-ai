import apiClient from './api.js'

export const alertsService = {
  getAlerts: () => apiClient.get('/alerts').then((response) => response.data),
  updateStatus: (id, status) => apiClient.patch(`/alerts/${id}`, { status }).then((response) => response.data),
}
