import { runIntelligenceWorkflow, startAgentRun, pollAgentRun } from '../services/workflow.service.js'
import { listJobs, getJob } from '../services/pythonService.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const run = async (req, res) => {
  const workflow = await runIntelligenceWorkflow(req.user.id, req.body)
  sendSuccess(res, { workflow }, 'Agent workflow completed', 201)
}

export const start = async (req, res) => {
  const result = await startAgentRun(req.user.id, req.body)
  if (result.mode === 'sync') {
    sendSuccess(res, { mode: 'sync', workflow: result.workflow }, 'Agent workflow completed', 201)
    return
  }
  sendSuccess(res, { mode: 'async', jobId: result.job.id, job: result.job }, 'Agent workflow started', 202)
}

export const poll = async (req, res) => {
  const result = await pollAgentRun(req.user.id, req.params.jobId)
  sendSuccess(res, result, result.workflow ? 'Agent workflow completed' : 'Agent workflow running')
}

export const getJobs = async (req, res) => {
  const payload = await listJobs(Number(req.query.limit) || 20)
  sendSuccess(res, { jobs: payload.jobs, count: payload.jobs.length }, 'Agent jobs retrieved')
}

export const getJobById = async (req, res) => {
  const payload = await getJob(req.params.id)
  sendSuccess(res, { job: payload.job, result: payload.result || null }, 'Agent job retrieved')
}
