import api from './api.js'

export const subscriptionService = {
  getPlans: () => api.get('/plans'),
  getSubscription: () => api.get('/subscription/me'),
  checkout: (data) => api.post('/subscription/checkout', data),
}
