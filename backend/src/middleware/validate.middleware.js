import { HttpError } from '../utils/httpError.js'
import { SOCIAL_PLATFORMS } from '../constants/social.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_CONTENT_LENGTH = 2000
const MAX_AUTHOR_LENGTH = 100
const MAX_EXTERNAL_ID_LENGTH = 200
const ENGAGEMENT_FIELDS = ['likes', 'shares', 'comments']

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body ?? {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new HttpError('Name is required', 400)
  }

  if (name.trim().length > 100) {
    throw new HttpError('Name must be 100 characters or fewer', 400)
  }

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    throw new HttpError('A valid email address is required', 400)
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new HttpError('Password must be at least 8 characters', 400)
  }

  next()
}

const validateContent = (content) => {
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new HttpError('Post content is required', 400)
  }
  if (content.trim().length > MAX_CONTENT_LENGTH) {
    throw new HttpError(`Post content must be ${MAX_CONTENT_LENGTH} characters or fewer`, 400)
  }
}

const validateAuthor = (author) => {
  if (!author || typeof author !== 'string' || !author.trim()) {
    throw new HttpError('Author is required', 400)
  }
  if (author.trim().length > MAX_AUTHOR_LENGTH) {
    throw new HttpError(`Author must be ${MAX_AUTHOR_LENGTH} characters or fewer`, 400)
  }
}

const validatePlatform = (platform) => {
  if (typeof platform !== 'string' || !SOCIAL_PLATFORMS.includes(platform)) {
    throw new HttpError(`Platform must be one of: ${SOCIAL_PLATFORMS.join(', ')}`, 400)
  }
}

const validateExternalId = (externalId) => {
  if (externalId === undefined || externalId === null) return
  if (typeof externalId !== 'string' || externalId.length > MAX_EXTERNAL_ID_LENGTH) {
    throw new HttpError(`External ID must be ${MAX_EXTERNAL_ID_LENGTH} characters or fewer`, 400)
  }
}

const validatePublishedAt = (publishedAt) => {
  if (publishedAt === undefined || publishedAt === null || publishedAt === '') return
  if (Number.isNaN(Date.parse(publishedAt))) {
    throw new HttpError('Published date must be a valid date', 400)
  }
}

const validateEngagement = (engagement) => {
  if (engagement === undefined || engagement === null) return
  if (typeof engagement !== 'object' || Array.isArray(engagement)) {
    throw new HttpError('Engagement must be an object', 400)
  }

  for (const field of ENGAGEMENT_FIELDS) {
    const value = engagement[field]
    if (value === undefined || value === null || value === '') continue
    const numberValue = Number(value)
    if (!Number.isInteger(numberValue) || numberValue < 0) {
      throw new HttpError(
        `${field.charAt(0).toUpperCase() + field.slice(1)} must be a non-negative whole number`,
        400,
      )
    }
  }
}

const validatePostFields = (body, { partial = false } = {}) => {
  const { platform, author, content, externalId, publishedAt, engagement } = body ?? {}

  const presentFields = {
    platform,
    author,
    content,
    externalId,
    publishedAt,
    engagement,
  }

  if (partial && Object.values(presentFields).every((value) => value === undefined)) {
    throw new HttpError('Nothing to update', 400)
  }

  if (platform !== undefined) validatePlatform(platform)
  if (author !== undefined) validateAuthor(author)
  if (content !== undefined) validateContent(content)
  if (externalId !== undefined) validateExternalId(externalId)
  if (publishedAt !== undefined) validatePublishedAt(publishedAt)
  if (engagement !== undefined) validateEngagement(engagement)

  if (!partial) {
    if (platform === undefined) validatePlatform(undefined)
    if (author === undefined) validateAuthor(undefined)
    if (content === undefined) validateContent(undefined)
  }
}

export const validateCreatePost = (req, res, next) => {
  validatePostFields(req.body)
  next()
}

export const validateScreenshotPost = (req, res, next) => {
  const { imageDataUrl, comments = [] } = req.body ?? {}
  if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) throw new HttpError('A screenshot image is required', 400)
  if (!Array.isArray(comments) || comments.length > 50) throw new HttpError('Comments must be an array of at most 50 items', 400)
  for (const comment of comments) {
    if (!comment || typeof comment.author !== 'string' || !comment.author.trim() || comment.author.trim().length > 100) throw new HttpError('Each comment needs a valid author', 400)
    if (typeof comment.content !== 'string' || !comment.content.trim() || comment.content.trim().length > 1000) throw new HttpError('Each comment must contain 1 to 1000 characters', 400)
  }
  next()
}

export const validateFacebookLink = (req, res, next) => {
  if (typeof req.body?.url !== 'string' || req.body.url.length > 2000) throw new HttpError('A valid Facebook post URL is required', 400)
  next()
}

export const validateUpdatePost = (req, res, next) => {
  validatePostFields(req.body, { partial: true })
  next()
}

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    throw new HttpError('Email and password are required', 400)
  }

  next()
}

const MAX_QUERY_LENGTH = 200
const MAX_RESULTS_LIMIT = 20

export const validateRetrievalSearch = (req, res, next) => {
  const { query, limit } = req.body ?? {}

  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new HttpError('Search query is required', 400)
  }

  if (query.trim().length > MAX_QUERY_LENGTH) {
    throw new HttpError(`Search query must be ${MAX_QUERY_LENGTH} characters or fewer`, 400)
  }

  if (limit !== undefined) {
    const parsedLimit = Number(limit)
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_RESULTS_LIMIT) {
      throw new HttpError(`Limit must be a whole number between 1 and ${MAX_RESULTS_LIMIT}`, 400)
    }
  }

  next()
}

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/

export const validateCreateInsight = (req, res, next) => {
  const { retrievalId } = req.body ?? {}

  if (retrievalId !== undefined && retrievalId !== null && retrievalId !== '') {
    if (typeof retrievalId !== 'string' || !OBJECT_ID_PATTERN.test(retrievalId)) {
      throw new HttpError('A valid retrieval ID is required', 400)
    }
  }

  next()
}

export const validateInsightReview = (req, res, next) => {
  const { status, editedDraft = '', note = '' } = req.body ?? {}
  if (!['approved', 'rejected'].includes(status)) throw new HttpError('Status must be approved or rejected', 400)
  if (typeof editedDraft !== 'string' || editedDraft.length > 2000) throw new HttpError('Edited draft must be 2000 characters or fewer', 400)
  if (typeof note !== 'string' || note.length > 500) throw new HttpError('Review note must be 500 characters or fewer', 400)
  next()
}

export const validateAlertStatus = (req, res, next) => {
  if (!['open', 'acknowledged', 'resolved'].includes(req.body?.status)) {
    throw new HttpError('Status must be open, acknowledged, or resolved', 400)
  }
  next()
}

const MAX_KB_TITLE_LENGTH = 200
const MAX_KB_TEXT_LENGTH = 20000
const MAX_KB_SOURCE_LENGTH = 500
const MAX_KB_TAGS = 20

export const validateKnowledgeDocument = (req, res, next) => {
  const { title, text, source, tags } = req.body ?? {}

  if (!title || typeof title !== 'string' || !title.trim()) throw new HttpError('Document title is required', 400)
  if (title.trim().length > MAX_KB_TITLE_LENGTH) throw new HttpError(`Document title must be ${MAX_KB_TITLE_LENGTH} characters or fewer`, 400)

  if (!text || typeof text !== 'string' || !text.trim()) throw new HttpError('Document text is required', 400)
  if (text.trim().length > MAX_KB_TEXT_LENGTH) throw new HttpError(`Document text must be ${MAX_KB_TEXT_LENGTH} characters or fewer`, 400)

  if (source !== undefined && source !== null) {
    if (typeof source !== 'string' || source.length > MAX_KB_SOURCE_LENGTH) {
      throw new HttpError(`Document source must be ${MAX_KB_SOURCE_LENGTH} characters or fewer`, 400)
    }
  }

  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags) || tags.length > MAX_KB_TAGS || tags.some((tag) => typeof tag !== 'string' || tag.length > 50)) {
      throw new HttpError(`Tags must be an array of at most ${MAX_KB_TAGS} short strings`, 400)
    }
  }

  next()
}
