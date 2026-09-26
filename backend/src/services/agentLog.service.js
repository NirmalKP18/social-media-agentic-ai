import AgentLog from '../models/AgentLog.js'

/**
 * Records a per-agent activity entry (never secrets: no passwords, tokens, keys or prompts).
 */
export const logAgent = async ({
  userId,
  postId = null,
  pipelineRunId = null,
  agentName,
  action,
  status,
  inputSummary = '',
  outputSummary = '',
  errorMessage = '',
  startedAt = null,
  completedAt = null,
}) => {
  const row = {
    user: userId,
    post: postId || null,
    pipelineRun: pipelineRunId || null,
    agentName,
    action,
    status,
    inputSummary: String(inputSummary).slice(0, 2000),
    outputSummary: String(outputSummary).slice(0, 4000),
    errorMessage: String(errorMessage).slice(0, 2000),
    startedAt,
    completedAt,
  }
  if (startedAt && completedAt) {
    row.durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime())
  }
  return AgentLog.create(row)
}

export const listAgentLogs = async ({ userId = null, filters = {}, limit = 50 }) => {
  const query = {}
  if (userId) query.user = userId
  const { agent, status } = filters
  if (agent) query.agentName = agent
  if (status) query.status = status
  return AgentLog.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(100, Math.max(1, limit)))
    .populate('post', 'author content platform')
}

export const listAgentLogsForPipelineRun = async (userId, pipelineRunId) => {
  const query = { pipelineRun: pipelineRunId }
  if (userId) query.user = userId
  return AgentLog.find(query).sort({ startedAt: 1 })
}