import mongoose from 'mongoose'
import SocialPost from '../models/SocialPost.js'
import Analysis from '../models/Analysis.js'
import Retrieval from '../models/Retrieval.js'
import Insight from '../models/Insight.js'
import Alert from '../models/Alert.js'
import { HttpError } from '../utils/httpError.js'
import { extractPostFromScreenshot } from './screenshot.service.js'

const POST_NOT_FOUND_MESSAGE = 'Post not found'

const ensureValidId = (postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw new HttpError(POST_NOT_FOUND_MESSAGE, 404)
  }
}

export const createPost = async (userId, data) => {
  return SocialPost.create({ user: userId, ...data })
}

export const createPostFromScreenshot = async (userId, { imageDataUrl, comments = [] }) => {
  const extracted = await extractPostFromScreenshot(imageDataUrl)
  return SocialPost.create({ user: userId, ...extracted, comments, ingestionMethod: 'screenshot' })
}

export const listPosts = async (userId) => {
  return SocialPost.find({ user: userId }).sort({ createdAt: -1 })
}

export const getPost = async (userId, postId) => {
  ensureValidId(postId)

  const post = await SocialPost.findOne({ _id: postId, user: userId })
  if (!post) {
    throw new HttpError(POST_NOT_FOUND_MESSAGE, 404)
  }

  return post
}

export const updatePost = async (userId, postId, data) => {
  ensureValidId(postId)

  const post = await SocialPost.findOneAndUpdate({ _id: postId, user: userId }, data, {
    returnDocument: 'after',
    runValidators: true,
  })

  if (!post) {
    throw new HttpError(POST_NOT_FOUND_MESSAGE, 404)
  }

  return post
}

export const deletePost = async (userId, postId) => {
  ensureValidId(postId)

  const post = await SocialPost.findOneAndDelete({ _id: postId, user: userId })
  if (!post) {
    throw new HttpError(POST_NOT_FOUND_MESSAGE, 404)
  }

  await Promise.all([
    Analysis.deleteMany({ post: post._id }),
    Alert.deleteMany({ post: post._id }),
    Retrieval.updateMany({ user: userId }, { $pull: { results: { post: post._id } } }),
    Insight.updateMany(
      { user: userId },
      {
        $pull: {
          topPositivePosts: { post: post._id },
          topNegativePosts: { post: post._id },
        },
      },
    ),
  ])

  return post
}
