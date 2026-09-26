import { processMention, startMentionProcessing, listRuns, getRun } from '../services/pipeline.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const process = async (req, res) => {
  const run = await processMention(req.user.id, req.params.postId)
  sendSuccess(res, { run }, 'Mention pipeline completed', 201)
}

export const start = async (req, res) => {
  const run = await startMentionProcessing(req.user.id, req.params.postId)
  sendSuccess(res, { run }, 'Mention pipeline started', 202)
}

export const list = async (req, res) => {
  const { runs, count } = await listRuns(req.user.id, {
    post: req.query.post,
    status: req.query.status,
    limit: req.query.limit,
  })
  sendSuccess(res, { runs, count }, 'Pipeline runs retrieved')
}

export const get = async (req, res) => {
  const run = await getRun(req.user.id, req.params.id)
  sendSuccess(res, { run }, 'Pipeline run retrieved')
}
