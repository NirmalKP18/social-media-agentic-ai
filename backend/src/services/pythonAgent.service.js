import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'
import { resolvePythonCommand, runPipeline } from './pythonService.service.js'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const agentEntryPoint = path.resolve(currentDirectory, '../../../ai-services/main.py')
const timeoutMs = Number(process.env.PYTHON_AGENT_TIMEOUT_MS) || 120000

const serializePosts = (posts) => posts.map((post) => ({
  id: String(post._id),
  platform: post.platform,
  author: post.author,
  content: post.content,
  publishedAt: post.publishedAt,
  engagement: post.engagement,
}))

export { serializePosts }

const runPythonCli = ({ posts, query, limit }) => new Promise((resolve, reject) => {
  const pythonCommand = resolvePythonCommand()
  const child = spawn(pythonCommand, [agentEntryPoint], {
    cwd: path.dirname(agentEntryPoint),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let stdout = ''
  let stderr = ''
  let settled = false

  const finish = (callback, value) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    callback(value)
  }
  const timer = setTimeout(() => {
    child.kill()
    finish(reject, new HttpError('Python agent workflow timed out', 504))
  }, timeoutMs)

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { stdout += chunk })
  child.stderr.on('data', (chunk) => { stderr += chunk })
  child.on('error', () => finish(reject, new HttpError(`Unable to start Python agents with command "${pythonCommand}"`, 503)))
  child.on('close', (code) => {
    if (settled) return
    if (code !== 0) {
      let message = 'Python agent workflow failed'
      try { message = JSON.parse(stderr).error || message } catch { /* keep safe generic message */ }
      finish(reject, new HttpError(message, 400))
      return
    }
    try {
      const response = JSON.parse(stdout)
      finish(resolve, response.data)
    } catch {
      finish(reject, new HttpError('Python agent workflow returned invalid output', 502))
    }
  })

  child.stdin.end(JSON.stringify({ query, limit, posts: serializePosts(posts) }))
})

export const runPythonAgents = runPythonCli

/**
 * Runs the authoritative Python four-agent pipeline.
 *
 * Prefers the long-lived HTTP service so the sentence-transformer model is warm.
 * Falls back to a one-shot CLI process (still the same Python pipeline) and
 * finally returns null so the caller can use the Node-only degraded path.
 */
export const runAgentWorkflow = async ({ posts, query, limit }) => {
  const payload = { query, limit, posts: serializePosts(posts) }
  try {
    return await runPipeline(payload)
  } catch (error) {
    logger.error(`Python agent service unavailable (${error.message}); falling back to CLI pipeline`)
  }
  try {
    return await runPythonCli({ posts, query, limit })
  } catch (error) {
    logger.error(`Python CLI pipeline unavailable (${error.message}); using Node-only fallback`)
    return null
  }
}
