import { listDocuments, getStats, createDocument, deleteDocument, reindex, uploadDocument } from '../services/knowledge.service.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const getList = async (req, res) => {
  const documents = await listDocuments()
  sendSuccess(res, { documents, count: documents.length }, 'Knowledge documents retrieved')
}

export const getStatistics = async (req, res) => {
  const stats = await getStats()
  sendSuccess(res, { stats }, 'Knowledge base statistics retrieved')
}

export const create = async (req, res) => {
  const document = await createDocument(req.user.id, req.body)
  sendSuccess(res, { document }, 'Knowledge document added and indexed', 201)
}

export const remove = async (req, res) => {
  await deleteDocument(req.user.id, req.params.id)
  sendSuccess(res, { deleted: true }, 'Knowledge document removed and re-indexed')
}

export const rebuildIndex = async (req, res) => {
  const stats = await reindex(req.user.id)
  sendSuccess(res, { stats }, 'Knowledge base re-indexed')
}

export const upload = async (req, res) => {
  const document = await uploadDocument(req.user.id, req.file, {
    title: req.body.title,
    source: req.body.source || `upload:${req.file?.originalname || 'document'}`,
    tags: (req.body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
  })
  sendSuccess(res, { document }, 'Knowledge document uploaded and indexed', 201)
}
