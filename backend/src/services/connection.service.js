import { config } from '../config/env.js'
import SocialPost from '../models/SocialPost.js'
import { HttpError } from '../utils/httpError.js'
import { recordAudit } from './audit.service.js'

const definitions = {
  youtube: { name: 'YouTube', variables: ['YOUTUBE_API_KEY'], configured: () => Boolean(config.platforms.youtube.apiKey) },
  reddit: { name: 'Reddit', variables: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'], configured: () => Boolean(config.platforms.reddit.clientId && config.platforms.reddit.clientSecret) },
  meta: { name: 'Facebook & Instagram', variables: ['META_ACCESS_TOKEN', 'META_PAGE_ID'], configured: () => Boolean(config.platforms.meta.accessToken && config.platforms.meta.pageId) },
  x: { name: 'X', variables: ['X_BEARER_TOKEN'], configured: () => Boolean(config.platforms.x.bearerToken) },
  linkedin: { name: 'LinkedIn', variables: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_ORGANIZATION_URN'], configured: () => Boolean(config.platforms.linkedin.accessToken && config.platforms.linkedin.organizationUrn) },
}

export const listConnections = () => Object.entries(definitions).map(([id, item]) => ({ id, name: item.name, configured: item.configured(), variables: item.variables }))

const requestJson = async (url, options = {}) => {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new HttpError(payload.error?.message || payload.detail || payload.message || `Platform returned ${response.status}`, response.status === 401 || response.status === 403 ? 401 : 502)
    return payload
  } catch (error) {
    if (error.name === 'AbortError') throw new HttpError('Platform request timed out', 504)
    throw error
  } finally { clearTimeout(timer) }
}

const redditToken = async () => {
  const basic = Buffer.from(`${config.platforms.reddit.clientId}:${config.platforms.reddit.clientSecret}`).toString('base64')
  const payload = await requestJson('https://www.reddit.com/api/v1/access_token', { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'SignalOS/1.0' }, body: 'grant_type=client_credentials' })
  return payload.access_token
}

export const testConnection = async (platform) => {
  const item = definitions[platform]
  if (!item) throw new HttpError('Unsupported platform', 404)
  if (!item.configured()) throw new HttpError(`${item.name} credentials are not configured`, 400)
  if (platform === 'youtube') await requestJson(`https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&key=${encodeURIComponent(config.platforms.youtube.apiKey)}`)
  if (platform === 'reddit') await redditToken()
  if (platform === 'meta') await requestJson(`https://graph.facebook.com/${config.platforms.meta.apiVersion}/me?access_token=${encodeURIComponent(config.platforms.meta.accessToken)}`)
  if (platform === 'x') await requestJson('https://api.x.com/2/tweets/search/recent?query=social&max_results=10', { headers: { Authorization: `Bearer ${config.platforms.x.bearerToken}` } })
  if (platform === 'linkedin') await requestJson('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${config.platforms.linkedin.accessToken}` } })
  return { id: platform, name: item.name, connected: true, checkedAt: new Date().toISOString() }
}

const fetchYouTube = async ({ query, limit }) => {
  const search = await requestJson(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${limit}&q=${encodeURIComponent(query)}&key=${encodeURIComponent(config.platforms.youtube.apiKey)}`)
  const ids = (search.items || []).map((item) => item.id.videoId).filter(Boolean)
  if (!ids.length) return []
  const detail = await requestJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${ids.join(',')}&key=${encodeURIComponent(config.platforms.youtube.apiKey)}`)
  return (detail.items || []).map((item) => ({ platform: 'youtube', externalId: item.id, author: item.snippet.channelTitle || 'YouTube', content: `${item.snippet.title}\n${item.snippet.description || ''}`.slice(0, 2000), sourceUrl: `https://www.youtube.com/watch?v=${item.id}`, publishedAt: item.snippet.publishedAt, engagement: { likes: Number(item.statistics.likeCount || 0), shares: 0, comments: Number(item.statistics.commentCount || 0) } }))
}

const fetchReddit = async ({ query, limit }) => {
  const token = await redditToken(); const subreddit = query.replace(/^r\//, '').trim()
  const payload = await requestJson(`https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/new?limit=${limit}`, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'SignalOS/1.0' } })
  return (payload.data?.children || []).map(({ data }) => ({ platform: 'reddit', externalId: data.name || data.id, author: data.author || 'deleted', content: `${data.title || ''}${data.selftext ? `\n${data.selftext}` : ''}`.slice(0, 2000), sourceUrl: `https://www.reddit.com${data.permalink}`, publishedAt: new Date(data.created_utc * 1000), engagement: { likes: Math.max(0, Number(data.score || 0)), shares: 0, comments: Number(data.num_comments || 0) } }))
}

const fetchMeta = async ({ limit }) => {
  const fields = 'id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares'
  const payload = await requestJson(`https://graph.facebook.com/${config.platforms.meta.apiVersion}/${encodeURIComponent(config.platforms.meta.pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(config.platforms.meta.accessToken)}`)
  return (payload.data || []).filter((item) => item.message).map((item) => ({ platform: 'facebook', externalId: item.id, author: config.platforms.meta.pageId, content: item.message.slice(0, 2000), sourceUrl: item.permalink_url || '', publishedAt: item.created_time, engagement: { likes: item.likes?.summary?.total_count || 0, shares: item.shares?.count || 0, comments: item.comments?.summary?.total_count || 0 } }))
}

const fetchX = async ({ query, limit }) => {
  const fields = 'tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username'
  const payload = await requestJson(`https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.max(10, limit)}&${fields}`, { headers: { Authorization: `Bearer ${config.platforms.x.bearerToken}` } })
  const users = new Map((payload.includes?.users || []).map((user) => [user.id, user.username]))
  return (payload.data || []).slice(0, limit).map((item) => ({ platform: 'twitter', externalId: item.id, author: users.get(item.author_id) || item.author_id || 'X user', content: item.text.slice(0, 2000), sourceUrl: `https://x.com/i/web/status/${item.id}`, publishedAt: item.created_at, engagement: { likes: item.public_metrics?.like_count || 0, shares: item.public_metrics?.retweet_count || 0, comments: item.public_metrics?.reply_count || 0 } }))
}

const fetchLinkedIn = async ({ limit }) => {
  const headers = { Authorization: `Bearer ${config.platforms.linkedin.accessToken}`, 'LinkedIn-Version': config.platforms.linkedin.version, 'X-Restli-Protocol-Version': '2.0.0' }
  const payload = await requestJson(`https://api.linkedin.com/rest/posts?q=author&author=${encodeURIComponent(config.platforms.linkedin.organizationUrn)}&count=${limit}&sortBy=LAST_MODIFIED`, { headers })
  return (payload.elements || []).filter((item) => item.commentary).map((item) => ({ platform: 'linkedin', externalId: item.id, author: config.platforms.linkedin.organizationUrn, content: item.commentary.slice(0, 2000), sourceUrl: '', publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined, engagement: { likes: 0, shares: 0, comments: 0 } }))
}

const fetchers = { youtube: fetchYouTube, reddit: fetchReddit, meta: fetchMeta, x: fetchX, linkedin: fetchLinkedIn }

export const importFromPlatform = async (userId, platform, input) => {
  const item = definitions[platform]
  if (!item) throw new HttpError('Unsupported platform', 404)
  if (!item.configured()) throw new HttpError(`${item.name} credentials are not configured`, 400)
  const limit = Math.min(Math.max(Number(input.limit) || 10, 1), 25)
  const query = String(input.query || '').trim()
  if (['youtube', 'reddit', 'x'].includes(platform) && !query) throw new HttpError(platform === 'reddit' ? 'Subreddit is required' : 'Search query is required', 400)
  const normalized = await fetchers[platform]({ query, limit })
  let created = 0; let updated = 0
  for (const post of normalized) {
    const existing = await SocialPost.exists({ user: userId, platform: post.platform, externalId: post.externalId })
    await SocialPost.findOneAndUpdate({ user: userId, platform: post.platform, externalId: post.externalId }, { ...post, user: userId }, { upsert: true, runValidators: true, setDefaultsOnInsert: true })
    existing ? updated += 1 : created += 1
  }
  await recordAudit({ userId, action: 'platform.import', resource: 'social_post', metadata: { platform, query, received: normalized.length, created, updated } })
  return { platform, received: normalized.length, created, updated, importedAt: new Date().toISOString() }
}
