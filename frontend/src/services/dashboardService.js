import apiClient from './api.js'

export const dashboardService = {
  getDashboard: () => apiClient.get('/dashboard').then((response) => response.data),
}