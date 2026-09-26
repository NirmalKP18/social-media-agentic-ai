const STOPWORDS = new Set([
  'about', 'after', 'again', 'against', 'also', 'and', 'are', 'because', 'been', 'before',
  'being', 'between', 'but', 'can', 'could', 'did', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'here',
  'how', 'into', 'its', 'just', 'more', 'most', 'much', 'must', 'now', 'off',
  'only', 'other', 'our', 'out', 'over', 'same', 'should', 'such', 'than', 'that',
  'the', 'their', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'too',
  'under', 'until', 'very', 'was', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'with', 'would', 'will', 'your', 'you', 'have', 'was', 'it', 'its',
])

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'none', 'nor', 'cannot', 'cant',
  'dont', 'doesnt', 'didnt', 'isnt', 'arent', 'wasnt', 'werent',
  'wont', 'wouldnt', 'shouldnt', 'aint',
])

const POSITIVE_WORDS = new Set([
  'love', 'great', 'amazing', 'good', 'excellent', 'happy', 'awesome', 'fantastic',
  'wonderful', 'best', 'enjoyed', 'enjoy', 'recommend', 'perfect', 'nice', 'thanks',
  'thank', 'agree', 'support', 'helpful', 'beautiful', 'brilliant', 'impressive',
  'success', 'successful', 'win', 'wins', 'won', 'improvement', 'better', 'upgrade',
  'quality', 'fast', 'easy', 'reliable', 'secure', 'clean', 'affordable', 'innovative',
  'powerful', 'satisfied', 'favorite', 'favourite', 'like', 'likes', 'liked',
  'appreciate', 'delighted', 'free', 'interesting', 'useful', 'valuable', 'inspiring',
  'excited', 'fun', 'amazing', 'perfect', 'strong', 'solid', 'smooth', 'quick',
  'smart', 'clear', 'help', 'works', 'working',
])

const NEGATIVE_WORDS = new Set([
  'hate', 'bad', 'terrible', 'awful', 'worst', 'disappointed', 'waste', 'useless',
  'broken', 'slow', 'poor', 'horrible', 'ugly', 'annoying', 'scam', 'fake', 'fail',
  'fails', 'failed', 'failure', 'problem', 'problems', 'issue', 'issues', 'bug',
  'bugs', 'crash', 'crashes', 'crashing', 'buggy', 'worse', 'boring', 'expensive',
  'difficult', 'hard', 'frustrating', 'frustrated', 'angry', 'refund', 'fraud',
  'error', 'errors', 'lag', 'spam', 'rude', 'greedy', 'worst', 'sucks', 'awful',
  'dislike', 'unacceptable', 'terrible', 'poorly', 'confusing', 'glitch', 'broken',
])

const ENTITY_PATTERN = /([@#][\w]{1,30})/g
const WORD_PATTERN = /[a-zA-Z]+/
const SENTENCE_SPLIT_PATTERN = /(?<=[.!?])\s+/g
const NEGATION_WINDOW = 3

const tokenizeWords = (content) => {
  return content
    .toLowerCase()
    .match(/[a-zA-Z']+/g)
    .filter(Boolean)
}

const extractEntities = (content) => {
  const found = content.match(ENTITY_PATTERN) || []
  const unique = [...new Set(found.map((entity) => entity.toLowerCase()))]
  return unique.slice(0, 10)
}

const extractTopics = (content) => {
  const wordCounts = new Map()

  for (const word of tokenizeWords(content)) {
    if (STOPWORDS.has(word)) continue
    if (NEGATION_WORDS.has(word)) continue
    if (word.length < 3) continue
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
  }

  return [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

const analyzeSentiment = (content) => {
  const words = tokenizeWords(content)
  let score = 0
  let magnitude = 0
  let negationRemaining = 0

  for (const word of words) {
    if (NEGATION_WORDS.has(word)) {
      negationRemaining = NEGATION_WINDOW
      continue
    }

    const sign = negationRemaining > 0 ? -1 : 1
    negationRemaining = Math.max(0, negationRemaining - 1)

    if (POSITIVE_WORDS.has(word)) {
      score += sign
      magnitude += 1
    } else if (NEGATIVE_WORDS.has(word)) {
      score -= sign
      magnitude += 1
    }
  }

  const normalized = magnitude === 0 ? 0 : score / (magnitude + 1)

  let label = 'neutral'
  if (normalized > 0.15) label = 'positive'
  else if (normalized < -0.15) label = 'negative'

  return {
    label,
    score: Math.max(-1, Math.min(1, Number(normalized.toFixed(3)))),
    confidence: Number(Math.min(1, 0.5 + Math.abs(normalized) / 2).toFixed(3)),
  }
}

const summarize = (content, topics) => {
  const sentences = content
    .replace(/\s+/g, ' ')
    .split(SENTENCE_SPLIT_PATTERN)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length === 0) return content.slice(0, 280)

  if (sentences.length <= 2 || content.length <= 120) {
    return sentences[0].slice(0, 280)
  }

  const topicSet = new Set(topics)
  const scored = sentences.slice(0, 5).map((sentence) => {
    const words = new Set(tokenizeWords(sentence))
    let hits = 0
    for (const topic of topicSet) {
      if (words.has(topic)) hits += 1
    }
    return { sentence, hits, length: sentence.length }
  })

  scored.sort((a, b) => b.hits - a.hits || a.length - b.length)
  const top = scored[0]

  return (top && top.hits > 0 ? top.sentence : sentences[0]).slice(0, 280)
}

const INTENT_QUESTION_WORDS = new Set([
  'what', 'why', 'how', 'when', 'where', 'who', 'which', 'whose', 'whom',
  'is', 'are', 'was', 'were', 'can', 'could', 'will', 'would', 'should',
  'do', 'does', 'did', 'have', 'has', 'any',
])

const COMPLAINT_WORDS = new Set([
  'broken', 'scam', 'refund', 'fix', 'issue', 'issues', 'bug', 'bugs', 'crash',
  'crashes', 'fail', 'failed', 'failure', 'worst', 'terrible', 'horrible', 'useless',
  'unusable', 'slow', 'lag', 'error', 'errors', 'waste', 'disappointed', 'unacceptable',
  'fraud', 'greedy', 'stole', 'stolen', 'ruined', 'charge', 'charged',
])

const PRAISE_WORDS = new Set([
  'love', 'great', 'awesome', 'best', 'amazing', 'congrats', 'congratulations',
  'thank', 'thanks', 'brilliant', 'excellent', 'fantastic', 'wonderful',
  'perfect', 'kudos', 'appreciate', 'helpful', 'clean', 'smooth',
])

const SUGGESTION_WORDS = new Set([
  'should', 'suggest', 'suggestion', 'idea', 'feature', 'request', 'add',
  'could', 'please', 'consider', 'hope', 'wish', 'support', 'improve',
])

const classifyIntent = (content) => {
  const text = content.trim().toLowerCase()
  const words = tokenizeWords(text)
  const isQuestion = text.includes('?') || (words.length > 0 && INTENT_QUESTION_WORDS.has(words[0]))

  if (isQuestion) return 'question'

  let complaintHits = 0
  let praiseHits = 0
  let suggestionHits = 0

  for (const word of words) {
    if (COMPLAINT_WORDS.has(word)) complaintHits += 1
    if (PRAISE_WORDS.has(word)) praiseHits += 1
    if (SUGGESTION_WORDS.has(word)) suggestionHits += 1
  }

  if (complaintHits > 0 && complaintHits >= praiseHits && complaintHits >= suggestionHits) {
    return 'complaint'
  }
  if (praiseHits > 0 && praiseHits >= complaintHits && praiseHits >= suggestionHits) {
    return 'praise'
  }
  if (suggestionHits > 0) {
    return 'suggestion'
  }
  if (text.includes('http') && (text.includes('bit.ly') || text.includes('t.me') || text.includes('crypto'))) {
    return 'spam'
  }

  return 'other'
}

const classifyEmotion = (content, sentiment) => {
  const words = tokenizeWords(content)
  const wordSet = new Set(words)

  if (wordSet.has('hate') || wordSet.has('furious') || wordSet.has('scam') || wordSet.has('unacceptable')) {
    return { label: 'anger', confidence: 0.85 }
  }
  if (wordSet.has('frustrating') || wordSet.has('annoying') || wordSet.has('useless') || wordSet.has('waste') || wordSet.has('disappointed') || wordSet.has('still')) {
    return { label: 'frustration', confidence: 0.8 }
  }
  if (wordSet.has('worried') || wordSet.has('security') || wordSet.has('risk') || wordSet.has('concern') || wordSet.has('danger') || wordSet.has('breach')) {
    return { label: 'concern', confidence: 0.8 }
  }
  if (wordSet.has('love') || wordSet.has('amazing') || wordSet.has('thrilled') || wordSet.has('fantastic') || wordSet.has('awesome')) {
    return { label: 'joy', confidence: 0.85 }
  }
  if (wordSet.has('thanks') || wordSet.has('thank') || wordSet.has('helpful') || wordSet.has('great') || wordSet.has('smooth')) {
    return { label: 'satisfaction', confidence: 0.8 }
  }
  if (content.includes('?') || wordSet.has('curious') || wordSet.has('wondering') || wordSet.has('interesting')) {
    return { label: 'curiosity', confidence: 0.75 }
  }

  if (sentiment.label === 'negative') return { label: 'frustration', confidence: 0.7 }
  if (sentiment.label === 'positive') return { label: 'satisfaction', confidence: 0.7 }
  return { label: 'neutral', confidence: 0.6 }
}

const computePriority = (content, sentiment, intent) => {
  let score = 20
  const factors = []
  const text = content.toLowerCase()

  if (sentiment.score <= -0.5) {
    score += 40
    factors.push('High negative sentiment polarity')
  } else if (sentiment.score < 0) {
    score += 20
    factors.push('Negative sentiment detected')
  }

  if (intent === 'complaint') {
    score += 25
    factors.push('Audience complaint requiring mitigation')
  } else if (intent === 'question') {
    score += 15
    factors.push('Public inquiry awaiting response')
  }

  if (text.includes('urgent') || text.includes('asap') || text.includes('emergency') || text.includes('hacked') || text.includes('legal') || text.includes('sue') || text.includes('data loss')) {
    score += 35
    factors.push('High-risk escalation keywords present')
  }

  score = Math.min(100, Math.max(0, score))
  let level = 'low'
  if (score >= 75) level = 'urgent'
  else if (score >= 50) level = 'high'
  else if (score >= 30) level = 'medium'

  return { level, score, factors }
}

export const analyzeText = (content) => {
  const entities = extractEntities(content)
  const topics = extractTopics(content)
  const sentiment = analyzeSentiment(content)
  const intent = classifyIntent(content)
  const emotion = classifyEmotion(content, sentiment)
  const priority = computePriority(content, sentiment, intent)

  return {
    sentiment,
    topics,
    entities,
    summary: summarize(content, topics),
    intent,
    emotion,
    priority,
  }
}

