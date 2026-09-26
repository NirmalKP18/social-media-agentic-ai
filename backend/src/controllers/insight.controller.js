import {
  generateInsight,
  listInsights,
  getInsight,
  deleteInsight,
  exportInsight,
  reviewInsight,
} from '../services/insight.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const create = async (req, res) => {
  const insight = await generateInsight(req.user.id, req.body)
  sendSuccess(res, { insight }, 'Insight report generated successfully', 201)
}

export const getList = async (req, res) => {
  const insights = await listInsights(req.user.id)
  sendSuccess(res, { insights, count: insights.length }, 'Insight reports retrieved')
}

export const getOne = async (req, res) => {
  const insight = await getInsight(req.user.id, req.params.id)
  sendSuccess(res, { insight }, 'Insight report retrieved')
}

export const remove = async (req, res) => {
  await deleteInsight(req.user.id, req.params.id)
  sendSuccess(res, { deleted: true }, 'Insight report deleted successfully')
}

export const exportReport = async (req, res) => {
  const exported = await exportInsight(req.user.id, req.params.id, req.query.format)
  if (exported.format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`)
    res.setHeader('Content-Length', exported.content.length)
    return res.status(200).send(exported.content)
  }
  sendSuccess(res, exported, `Insight report exported as ${exported.format}`)
}

export const review = async (req, res) => {
  const insight = await reviewInsight(req.user.id, req.params.id, req.body)
  sendSuccess(res, { insight }, `Draft ${req.body.status}`)
}
