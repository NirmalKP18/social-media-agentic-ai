import apiClient from './api.js'

export const workflowService = {
  run: (data) => apiClient.post('/workflow/run', data, { timeout: 90000 }).then((response) => response.data),
  startRun: (data) => apiClient.post('/workflow/runs', data, { timeout: 30000 }).then((response) => response.data),
  getRun: (jobId) => apiClient.get(`/workflow/runs/${jobId}`, { timeout: 30000 }).then((response) => response.data),
  getJobs: (limit = 20) => apiClient.get('/workflow/jobs', { params: { limit } }).then((response) => response.data),
  getJob: (id) => apiClient.get(`/workflow/jobs/${id}`).then((response) => response.data),
}
