import { listAgentLogs, listAgentLogsForPipelineRun } from '../services/agentLog.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const list = async (req, res) => {
  const logs = await listAgentLogs({
    userId: req.user.role === 'admin' ? null : req.user.id,
    filters: {
      agent: req.query.agent,
      status: req.query.status,
    },
    limit: req.query.limit,
  })
  sendSuccess(res, { logs, count: logs.length }, 'Agent logs retrieved')
}

export const listByPipelineRun = async (req, res) => {
  const logs = await listAgentLogsForPipelineRun(req.user.role === 'admin' ? null : req.user.id, req.params.runId)
  sendSuccess(res, { logs, count: logs.length }, 'Pipeline run logs retrieved')
}