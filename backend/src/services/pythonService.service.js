import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { HttpError } from '../utils/httpError.js'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
export const aiServicesDirectory = path.resolve(currentDirectory, '../../../ai-services')

const isWindows = process.platform === 'win32'
const venvPython = path.join(aiServicesDirectory, '.venv', ...(isWindows ? ['Scripts', 'python.exe'] : ['bin', 'python']))

let child = null

export const resolvePythonCommand = () => {
  if (fs.existsSync(venvPython)) return venvPython
  if (config.pythonService.command) return config.pythonService.command
  return isWindows ? 'python' : 'python3'
}

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

const request = async (pathname, { method = 'GET', body, timeoutMs } = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs || config.pythonService.timeoutMs)
  try {
    const response = await fetch(`${config.pythonService.url}${pathname}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    const text = await response.text()
    let payload = null
    try { payload = text ? JSON.parse(text) : null } catch { payload = null }
    if (!response.ok) {
      const detail = payload?.detail || `Python agent service responded with ${response.status}`
      throw new HttpError(detail, response.status === 503 ? 503 : 502)
    }
    return payload
  } finally {
    clearTimeout(timer)
  }
}

export const isPythonServiceHealthy = async () => {
  try {
    await request('/health', { timeoutMs: 3000 })
    return true
  } catch {
    return false
  }
}

export const startPythonService = async () => {
  if (await isPythonServiceHealthy()) return true
  if (child) return isPythonServiceHealthy()

  const pythonCommand = resolvePythonCommand()
  child = spawn(
    pythonCommand,
    ['-m', 'uvicorn', 'service:app', '--host', config.pythonService.host, '--port', String(config.pythonService.port)],
    { cwd: aiServicesDirectory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  let spawnFailed = false
  child.stdout.on('data', (chunk) => logger.info(`[python] ${String(chunk).trim()}`))
  child.stderr.on('data', (chunk) => logger.info(`[python] ${String(chunk).trim()}`))
  child.on('error', (error) => {
    spawnFailed = true
    logger.error(`Python agent service failed to start: ${error.message}`)
  })
  child.on('exit', (code) => {
    logger.info(`Python agent service exited with code ${code}`)
    child = null
  })

  const deadline = Date.now() + config.pythonService.startTimeoutMs
  while (Date.now() < deadline) {
    await delay(1000)
    if (spawnFailed) return false
    if (await isPythonServiceHealthy()) {
      logger.info(`Python agent service ready at ${config.pythonService.url}`)
      return true
    }
  }
  logger.error('Python agent service did not become ready before the timeout')
  return false
}

export const stopPythonService = () => {
  if (!child) return
  child.kill()
  child = null
}

export const runPipeline = (payload) => request('/run', { method: 'POST', body: payload, timeoutMs: config.pythonService.pipelineTimeoutMs })
export const startPipeline = (payload) => request('/run/async', { method: 'POST', body: payload, timeoutMs: 20000 })
export const getServiceHealth = () => request('/health', { timeoutMs: 3000 })
export const getKnowledgeStats = () => request('/knowledge/stats')
export const listKnowledgeDocuments = () => request('/knowledge/documents')
export const createKnowledgeDocument = (document) => request('/knowledge/documents', { method: 'POST', body: document, timeoutMs: 45000 })
export const deleteKnowledgeDocument = (documentId) => request(`/knowledge/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE', timeoutMs: 45000 })
export const reindexKnowledge = () => request('/knowledge/reindex', { method: 'POST', timeoutMs: 120000 })
export const searchKnowledge = (query, topK = 5) => request(`/knowledge/search?query=${encodeURIComponent(query)}&topK=${topK}`)
export const listJobs = (limit = 20) => request(`/jobs?limit=${limit}`)
export const getJob = (jobId) => request(`/jobs/${encodeURIComponent(jobId)}`)
