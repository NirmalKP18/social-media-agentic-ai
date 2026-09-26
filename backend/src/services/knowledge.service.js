import KnowledgeDocument from '../models/KnowledgeDocument.js'
import {
  createKnowledgeDocument as createAgentDocument,
  deleteKnowledgeDocument as deleteAgentDocument,
  getKnowledgeStats as getAgentStats,
  reindexKnowledge as reindexAgentKnowledge,
} from './pythonService.service.js'
import { recordAudit } from './audit.service.js'
import { config } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

const NOT_FOUND_MESSAGE = 'Knowledge document not found'
const SUPPORTED_UPLOAD_EXTS = ['txt', 'md', 'json']

export const isSupportedUploadName = (filename) => {
  const extension = String(filename || '').split('.').pop()?.toLowerCase() || ''
  return SUPPORTED_UPLOAD_EXTS.includes(extension)
}

/**
 * Pure helper: validates an uploaded file and extracts document text.
 * Supported: .txt, .md (plain text) and .json ({title?, text|content} or array of strings).
 * Throws HttpError for unsupported formats or blank content.
 */
export const getUploadText = (file, maxBytes = config.uploads.maxUploadBytes) => {
  if (!file || Buffer.isBuffer(file.buffer) === false) {
    throw new HttpError('No file was uploaded', 400)
  }
  if (file.size > maxBytes) {
    throw new HttpError(`File is larger than the ${Math.round(maxBytes / 1024 / 1024)} MB upload limit`, 413)
  }
  if (!isSupportedUploadName(file.originalname)) {
    throw new HttpError('Unsupported file type. Upload .txt, .md or .json (or paste text directly)', 400)
  }

  const text = file.buffer.toString('utf8').trim()
  if (!text) throw new HttpError('The uploaded file is empty', 400)

  const extension = file.originalname.split('.').pop().toLowerCase()
  if (extension === 'json') {
    try {
      const parsed = JSON.parse(text)
      const extract = (value) => {
        if (typeof value === 'string' && value.trim()) return value.trim()
        if (typeof value?.text === 'string' && value.text.trim()) return value.text.trim()
        if (typeof value?.content === 'string' && value.content.trim()) return value.content.trim()
        if (Array.isArray(value)) return value.map(extract).filter(Boolean).join('\n\n')
        return ''
      }
      const extracted = extract(parsed)
      if (!extracted) throw new Error('no text found')
      return { text: extracted.slice(0, 20000) }
    } catch {
      throw new HttpError('JSON file contains no readable text (expected {title, text}, {content}, or a list of strings)', 400)
    }
  }

  return { text: text.slice(0, 20000) }
}

export const uploadDocument = async (userId, file, { title = '', source = '', tags = [] } = {}) => {
  const { text } = getUploadText(file)
  const resolvedTitle = String(title || file.originalname).trim().slice(0, 150)
  if (!resolvedTitle) throw new HttpError('A document title is required', 400)
  const document = await createDocument(userId, { title: resolvedTitle, text, source, tags })
  await recordAudit({ userId, action: 'knowledge.upload', resource: 'knowledge', resourceId: document._id, metadata: { title: document.title, chunks: document.chunks, filename: file.originalname } })
  return document
}

export const listDocuments = () => KnowledgeDocument.find().sort({ createdAt: -1 }).populate('user', 'name email')

export const getStats = async () => {
  const stats = await getAgentStats()
  return { ...stats, stored: await KnowledgeDocument.countDocuments() }
}

export const createDocument = async (userId, { title, text, source = '', tags = [] }) => {
  const result = await createAgentDocument({ title: title.trim(), text: text.trim(), source, tags })
  const document = await KnowledgeDocument.create({
    user: userId,
    title: title.trim(),
    text: text.trim(),
    source,
    tags,
    pythonId: result.document?.id || '',
    chunks: result.stats?.chunks || 0,
  })
  await recordAudit({ userId, action: 'knowledge.create', resource: 'knowledge', resourceId: document._id, metadata: { title: document.title, chunks: document.chunks } })
  return document
}

export const deleteDocument = async (userId, documentId) => {
  const document = await KnowledgeDocument.findById(documentId)
  if (!document) throw new HttpError(NOT_FOUND_MESSAGE, 404)

  if (document.pythonId) {
    try {
      await deleteAgentDocument(document.pythonId)
    } catch (error) {
      const alreadyGone = error instanceof HttpError && error.status === 502 && String(error.message).toLowerCase().includes('not found')
      if (!alreadyGone) throw error
    }
  }
  await document.deleteOne()
  await recordAudit({ userId, action: 'knowledge.delete', resource: 'knowledge', resourceId: document._id, metadata: { title: document.title } })
  return document
}

export const reindex = async (userId) => {
  const stats = await reindexAgentKnowledge()
  await recordAudit({ userId, action: 'knowledge.reindex', resource: 'knowledge', metadata: { chunks: stats.stats?.chunks || 0 } })
  return stats.stats
}
