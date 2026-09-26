import mongoose from 'mongoose'
import Retrieval from '../models/Retrieval.js'
import SocialPost from '../models/SocialPost.js'
import { rankPosts } from './retrievalEngine.js'
import { HttpError } from '../utils/httpError.js'

const NOT_FOUND_MESSAGE = 'Retrieval not found'
const POST_FIELDS = 'platform author content publishedAt createdAt'
const DEFAULT_LIMIT = 10
const MAX_RESULTS = 20

const ensureValidId = (retrievalId) => {
  if (!mongoose.isValidObjectId(retrievalId)) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }
}

export const performSearch = async (userId, { query, limit }) => {
  const trimmedQuery = query.trim()
  const resultLimit = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_RESULTS)

  const posts = await SocialPost.find({ user: userId }).select('_id content').lean()
  const ranked = rankPosts(posts, trimmedQuery, resultLimit)

  const retrieval = await Retrieval.create({
    user: userId,
    query: trimmedQuery,
    results: ranked.map(({ postId, score }) => ({ post: postId, score })),
  })

  return getRetrieval(userId, retrieval._id)
}

export const listRetrievals = async (userId) => {
  return Retrieval.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate({ path: 'results.post', select: POST_FIELDS })
}

export const getRetrieval = async (userId, retrievalId) => {
  ensureValidId(retrievalId)

  const retrieval = await Retrieval.findOne({ _id: retrievalId, user: userId }).populate({
    path: 'results.post',
    select: POST_FIELDS,
  })

  if (!retrieval) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }

  retrieval.results = (retrieval.results || []).filter(({ post }) => post)

  return retrieval
}

export const deleteRetrieval = async (userId, retrievalId) => {
  ensureValidId(retrievalId)

  const retrieval = await Retrieval.findOneAndDelete({ _id: retrievalId, user: userId })
  if (!retrieval) {
    throw new HttpError(NOT_FOUND_MESSAGE, 404)
  }

  return retrieval
}