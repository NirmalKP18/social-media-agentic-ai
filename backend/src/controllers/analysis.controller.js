import {
  analyzePost,
  getAnalysisForPost,
  listAnalyses,
  getAnalysis,
  deleteAnalysis,
} from '../services/analysis.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const analyze = async (req, res) => {
  const analysis = await analyzePost(req.user.id, req.params.postId)
  sendSuccess(res, { analysis }, 'Post analyzed successfully')
}

export const getForPost = async (req, res) => {
  const analysis = await getAnalysisForPost(req.user.id, req.params.postId)
  sendSuccess(res, { analysis }, 'Analysis retrieved')
}

export const getList = async (req, res) => {
  const analyses = await listAnalyses(req.user.id)
  sendSuccess(res, { analyses, count: analyses.length }, 'Analyses retrieved')
}

export const getOne = async (req, res) => {
  const analysis = await getAnalysis(req.user.id, req.params.id)
  sendSuccess(res, { analysis }, 'Analysis retrieved')
}

export const remove = async (req, res) => {
  await deleteAnalysis(req.user.id, req.params.id)
  sendSuccess(res, { deleted: true }, 'Analysis deleted successfully')
}