import {
  performSearch,
  listRetrievals,
  getRetrieval,
  deleteRetrieval,
} from '../services/retrieval.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const search = async (req, res) => {
  const retrieval = await performSearch(req.user.id, req.body)
  sendSuccess(res, { retrieval }, 'Search completed successfully', 201)
}

export const getList = async (req, res) => {
  const retrievals = await listRetrievals(req.user.id)
  sendSuccess(res, { retrievals, count: retrievals.length }, 'Searches retrieved')
}

export const getOne = async (req, res) => {
  const retrieval = await getRetrieval(req.user.id, req.params.id)
  sendSuccess(res, { retrieval }, 'Search retrieved')
}

export const remove = async (req, res) => {
  await deleteRetrieval(req.user.id, req.params.id)
  sendSuccess(res, { deleted: true }, 'Search deleted successfully')
}