import { config } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const CANDIDATE_MODELS = [
  config.llm.model || 'gemini-3.6-flash',
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
]

const parseResult = (rawText) => {
  const clean = String(rawText || '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No valid JSON object detected in LLM response')
  
  const parsed = JSON.parse(jsonMatch[0])
  if (!parsed.content || typeof parsed.content !== 'string' || !parsed.content.trim()) {
    throw new Error('Post text was not detected')
  }

  const rawComments = Array.isArray(parsed.comments) ? parsed.comments : []
  const comments = rawComments
    .filter((c) => c && typeof c.content === 'string' && c.content.trim())
    .map((c) => ({
      author: String(c.author || 'User').replace(/^@/, '').slice(0, 100),
      content: String(c.content).trim().slice(0, 1000),
      publishedAt: c.publishedAt && !Number.isNaN(Date.parse(c.publishedAt)) ? new Date(c.publishedAt) : null,
    }))

  return {
    platform: String(parsed.platform || 'other').toLowerCase(),
    author: String(parsed.author || 'Unknown author').replace(/^@/, '').slice(0, 100),
    content: parsed.content.trim().slice(0, 2000),
    publishedAt: parsed.publishedAt && !Number.isNaN(Date.parse(parsed.publishedAt)) ? parsed.publishedAt : undefined,
    comments,
  }
}

export const extractPostFromScreenshot = async (imageDataUrl) => {
  if (!config.llm.apiKey) throw new HttpError('Gemini API is required for screenshot extraction', 503)
  const match = String(imageDataUrl || '').match(DATA_URL)
  if (!match) throw new HttpError('Screenshot must be a PNG, JPEG, or WebP image', 400)
  const bytes = Buffer.byteLength(match[2], 'base64')
  if (bytes > MAX_IMAGE_BYTES) throw new HttpError('Screenshot must be 5 MB or smaller', 413)

  // Deduplicate candidate models while preserving order
  const modelsToTry = [...new Set(CANDIDATE_MODELS.filter(Boolean))]
  let lastError = null

  for (const modelName of modelsToTry) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25000)

    try {
      const url = `${config.llm.baseUrl}/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(config.llm.apiKey)}`
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-goog-api-key': config.llm.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Extract the main social-media post and ALL visible user comments/replies from this screenshot image. Ignore browser chrome, ads, and sidebars. Return ONLY a valid JSON object with keys: platform (one of: twitter, facebook, instagram, linkedin, youtube, reddit, or other), author (username or display name without @), content (the full main post text body), publishedAt (ISO date string if visible, otherwise null), and comments (an array of visible user comment objects, each with author and content). Do not include commentary outside JSON.',
                },
                { inlineData: { mimeType: match[1], data: match[2] } },
              ],
            },
          ],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMsg = payload.error?.message || `HTTP ${response.status}`
        logger.warn(`Screenshot model ${modelName} returned ${response.status}: ${errorMsg}. Trying next candidate...`)
        lastError = new HttpError(errorMsg, response.status === 429 || response.status === 503 ? 503 : 502)
        continue
      }

      // Filter out thinking parts and collect text
      const parts = payload.candidates?.[0]?.content?.parts || []
      const text = parts
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('\n') || parts.map((p) => p.text || '').join('\n')

      if (!text.trim()) {
        logger.warn(`Model ${modelName} returned empty candidate text. Trying next...`)
        continue
      }

      try {
        const result = parseResult(text)
        logger.info(`Screenshot text extracted successfully using model ${modelName}`)
        return result
      } catch (parseErr) {
        logger.warn(`Failed to parse JSON from ${modelName}: ${parseErr.message}`)
        lastError = new HttpError('Could not reliably detect readable social post text in this screenshot', 422)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.warn(`Screenshot analysis with ${modelName} timed out. Trying next...`)
        lastError = new HttpError('Screenshot analysis timed out', 504)
      } else {
        lastError = err
      }
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError || new HttpError('Failed to extract text from screenshot across all available AI models', 502)
}

