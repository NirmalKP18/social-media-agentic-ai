import mongoose from 'mongoose'
import connectDB from '../src/config/db.js'
import User from '../src/models/User.js'
import SocialPost from '../src/models/SocialPost.js'
import KnowledgeDocument from '../src/models/KnowledgeDocument.js'
import { createDocument, deleteDocument } from '../src/services/knowledge.service.js'
import { logger } from '../src/utils/logger.js'

const KB_TITLE = 'Refund and returns policy'

const DEMO_USERS = [
  { name: 'Demo Admin', email: 'admin@example.com', password: 'Admin12345', role: 'admin' },
  { name: 'Demo Analyst', email: 'user@example.com', password: 'User12345', role: 'user' },
  { name: 'Demo Reviewer', email: 'reviewer@example.com', password: 'Reviewer12345', role: 'reviewer' },
]

const SAMPLE_POSTS = [
  {
    platform: 'twitter',
    author: '@frustrated_customer',
    content: 'Paid for express shipping five days ago and my order still has not arrived. This is unacceptable, I need a refund now.',
    engagement: { likes: 42, shares: 18, comments: 12 },
  },
  {
    platform: 'facebook',
    author: 'Maria Lopez',
    content: 'Your support team resolved my billing issue in under ten minutes. Genuinely impressed, thank you!',
    engagement: { likes: 130, shares: 24, comments: 9 },
  },
  {
    platform: 'reddit',
    author: 'u/ops_guy',
    content: 'Does the pro plan include SSO and audit logs? Trying to figure out if we can roll this out to 200 seats.',
    engagement: { likes: 15, shares: 2, comments: 21 },
  },
  {
    platform: 'instagram',
    author: 'techwithsam',
    content: 'Would love a dark mode and CSV export on the analytics dashboard. Small things but they would save me hours.',
    engagement: { likes: 88, shares: 6, comments: 4 },
  },
  {
    platform: 'linkedin',
    author: 'Priya Nair',
    content: 'We migrated to this platform last quarter and cut reporting time by 40%. Happy to share the rollout playbook with anyone evaluating it.',
    engagement: { likes: 240, shares: 61, comments: 17 },
  },
  {
    platform: 'youtube',
    author: 'ReviewByKen',
    content: 'The mobile app crashes every time I upload a photo over 5MB. Completely broken on Android 14.',
    engagement: { likes: 31, shares: 3, comments: 44 },
  },
  {
    platform: 'twitter',
    author: '@deal_hunter',
    content: 'CLAIM YOUR FREE CRYPTO REWARDS NOW at this link, limited spots!!!',
    engagement: { likes: 2, shares: 0, comments: 0 },
    comments: [{ author: '@bot_check', content: 'Reported as spam.' }],
  },
  {
    platform: 'other',
    author: 'Community Forum',
    content: 'The warranty covers manufacturing defects for twelve months but not accidental damage. Is the extended plan worth it?',
    engagement: { likes: 9, shares: 1, comments: 6 },
  },
]

const upsertUser = async (data) => {
  const existing = await User.findOne({ email: data.email })
  if (existing) {
    existing.name = data.name
    existing.role = data.role
    await existing.save()
    return existing
  }
  return User.create(data)
}

const seedPosts = async (user) => {
  const externalIds = SAMPLE_POSTS.map((_, index) => `seed-${index + 1}`)
  await SocialPost.deleteMany({ user: user._id, externalId: { $in: externalIds } })
  const posts = SAMPLE_POSTS.map((post, index) => ({
    user: user._id,
    externalId: `seed-${index + 1}`,
    ingestionMethod: 'manual',
    publishedAt: new Date(Date.now() - index * 3600 * 1000),
    ...post,
  }))
  return SocialPost.insertMany(posts)
}

const seedKnowledgeBase = async (adminId) => {
  try {
    const { startPythonService, stopPythonService } = await import('../src/services/pythonService.service.js')
    const ready = await startPythonService()
    if (!ready) {
      logger.warn('Python agent service unavailable - skipping knowledge base seeding')
      return false
    }

    const existing = await KnowledgeDocument.findOne({ title: KB_TITLE })
    if (existing) await deleteDocument(adminId, existing._id)

    await createDocument(adminId, {
      title: KB_TITLE,
      text: [
        'Customers may request a full refund within 30 days of delivery.',
        'Express shipping fees are refundable when delivery exceeds the 3 business day guarantee.',
        'Damaged or defective items are replaced at no cost within the 12 month warranty.',
        'Refund requests are processed within 5 business days of approval by the support team.',
      ].join(' '),
      source: 'https://example.com/policies/refunds',
      tags: ['policy', 'refunds', 'warranty'],
    })

    stopPythonService()
    return true
  } catch (error) {
    logger.warn(`Knowledge base seeding skipped: ${error.message}`)
    return false
  }
}

const run = async () => {
  try {
    await connectDB()

    const [admin, analyst, reviewer] = await Promise.all(DEMO_USERS.map(upsertUser))
    const posts = await seedPosts(analyst)
    const kbSeeded = await seedKnowledgeBase(admin._id)

    logger.info('Seed complete')
    logger.info(`  Admin login:     ${admin.email} / ${DEMO_USERS[0].password}`)
    logger.info(`  Analyst login:   ${analyst.email} / ${DEMO_USERS[1].password}`)
    logger.info(`  Reviewer login:  ${reviewer.email} / ${DEMO_USERS[2].password}`)
    logger.info(`  Sample posts:    ${posts.length}`)
    logger.info(`  Knowledge base:  ${kbSeeded ? 'seeded' : 'skipped'}`)
    logger.info('  Next: POST /api/workflow/run as the analyst to generate an insight draft for review.')
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

run()
