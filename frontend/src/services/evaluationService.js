import api from './api.js'

export const evaluationService = {
  getMetrics: () => api.get('/evaluation'),
  runBenchmark: () => api.post('/evaluation/run'),
}
