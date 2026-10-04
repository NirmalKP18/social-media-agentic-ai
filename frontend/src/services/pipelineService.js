import apiClient from './api.js'

export const pipelineService = {
  processMention: (postId) =>
    apiClient.post(`/pipeline/process/${postId}`, {}, { timeout: 180000 }).then((response) => response.data),
  startMention: (postId) => apiClient.post(`/pipeline/start/${postId}`).then((response) => response.data),
  listRuns: (params) => apiClient.get('/pipeline/runs', { params }).then((response) => response.data),
  getRun: (runId) => apiClient.get(`/pipeline/runs/${runId}`).then((response) => response.data),
  stopRun: (runId) => apiClient.post(`/pipeline/runs/${runId}/stop`).then((response) => response.data),
}
