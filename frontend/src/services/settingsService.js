import apiClient from './api.js'

export const settingsService = {
  get: () => apiClient.get('/settings').then((response) => response.data),
}