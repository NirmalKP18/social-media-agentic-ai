import { createPost, createPostFromScreenshot, listPosts, getPost, updatePost, deletePost } from '../services/post.service.js'
import { analyzePost } from '../services/analysis.service.js'
import { importFacebookLink } from '../services/facebookLink.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const create = async (req, res) => {
  const post = await createPost(req.user.id, req.body)
  sendSuccess(res, { post }, 'Social media post collected successfully', 201)
}

export const createFromScreenshot = async (req, res) => {
  const post = await createPostFromScreenshot(req.user.id, req.body)
  const analysis = await analyzePost(req.user.id, post._id)
  sendSuccess(res, { post, analysis }, 'Screenshot extracted and conversation analyzed', 201)
}

export const createFromFacebookLink = async (req, res) => {
  const post = await importFacebookLink(req.user.id, req.body.url)
  const analysis = await analyzePost(req.user.id, post._id)
  sendSuccess(res, { post, analysis }, 'Facebook post imported and analyzed', 201)
}

export const getList = async (req, res) => {
  const posts = await listPosts(req.user.id)
  sendSuccess(res, { posts, count: posts.length }, 'Collected posts retrieved')
}

export const getOne = async (req, res) => {
  const post = await getPost(req.user.id, req.params.id)
  sendSuccess(res, { post }, 'Post retrieved')
}

export const update = async (req, res) => {
  const post = await updatePost(req.user.id, req.params.id, req.body)
  sendSuccess(res, { post }, 'Post updated successfully')
}

export const remove = async (req, res) => {
  await deletePost(req.user.id, req.params.id)
  sendSuccess(res, { deleted: true }, 'Post deleted successfully')
}
