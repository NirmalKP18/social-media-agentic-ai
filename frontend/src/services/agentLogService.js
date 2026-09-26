import apiClient from './api.js'

export const agentLogService = {
  list: (params) => apiClient.get('/agent-logs', { params }).then((response) => response.data),
  byPipelineRun: (runId) => apiClient.get(`/agent-logs/pipeline/${runId}`).then((response) => response.data),
}