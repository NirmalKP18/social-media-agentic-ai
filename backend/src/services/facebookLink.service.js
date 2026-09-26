import crypto from 'node:crypto'
import { config } from '../config/env.js'
import SocialPost from '../models/SocialPost.js'
import { HttpError } from '../utils/httpError.js'

const ALLOWED_HOSTS = new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'fb.watch', 'www.fb.watch'])

const decodeHtml = (value) => value
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim()

const validateFacebookUrl = (rawUrl) => {
  let parsed
  try { parsed = new URL(rawUrl) } catch { throw new HttpError('Enter a valid Facebook post URL', 400) }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) throw new HttpError('Only official Facebook or fb.watch HTTPS links are allowed', 400)
  return parsed.toString()
}

export const importFacebookLink = async (userId, rawUrl) => {
  if (!config.platforms.meta.accessToken) throw new HttpError('META_ACCESS_TOKEN is required to import Facebook links', 400)
  const sourceUrl = validateFacebookUrl(rawUrl)
  const endpoint = `https://graph.facebook.com/${config.platforms.meta.apiVersion}/oembed_post?url=${encodeURIComponent(sourceUrl)}&access_token=${encodeURIComponent(config.platforms.meta.accessToken)}`
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(endpoint, { signal: controller.signal })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new HttpError(payload.error?.message || 'Facebook could not access this post', response.status === 401 || response.status === 403 ? 401 : 502)
    const content = decodeHtml(payload.html || payload.title || '')
    if (!content) throw new HttpError('Facebook returned no readable post content. Confirm the post is public and accessible to the configured app.', 422)
    const externalId = `fburl_${crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 32)}`
    const post = await SocialPost.findOneAndUpdate(
      { user: userId, platform: 'facebook', externalId },
      { user: userId, platform: 'facebook', externalId, sourceUrl, author: String(payload.author_name || 'Facebook').slice(0, 100), content: content.slice(0, 2000), ingestionMethod: 'platform_api' },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    )
    return post
  } catch (error) {
    if (error.name === 'AbortError') throw new HttpError('Facebook link import timed out', 504)
    throw error
  } finally { clearTimeout(timer) }
}
