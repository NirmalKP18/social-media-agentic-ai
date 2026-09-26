const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have',
  'he', 'her', 'his', 'how', 'i', 'if', 'in', 'is', 'it',
  'its', 'just', 'me', 'my', 'not', 'of', 'on', 'or', 'our', 'out',
  'over', 'she', 'so', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'to', 'too', 'up', 'us', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'who', 'will', 'with', 'would', 'you', 'your',
])

const TOKEN_PATTERN = /[a-z0-9']+/g

const tokenize = (text) => {
  return (text.toLowerCase().match(TOKEN_PATTERN) || []).filter((token) => !STOPWORDS.has(token))
}

const buildTermCounts = (tokens) => {
  const counts = new Map()
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1)
  }
  return counts
}

const termWeight = (count, idf) => (1 + Math.log(count)) * idf

export const rankPosts = (posts, query, limit) => {
  const queryTokens = tokenize(query)
  const queryCounts = buildTermCounts(queryTokens)

  if (queryCounts.size === 0) {
    return []
  }

  const docs = posts.map((post) => ({
    postId: post._id,
    counts: buildTermCounts(tokenize(post.content)),
  }))

  const docCount = docs.length
  const documentFrequency = new Map()

  for (const doc of docs) {
    for (const term of doc.counts.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1)
    }
  }

  const idf = (term) => Math.log(1 + docCount / (1 + (documentFrequency.get(term) || 0)))

  const queryVector = new Map()
  for (const [term, count] of queryCounts) {
    queryVector.set(term, termWeight(count, idf(term)))
  }

  const queryMagnitude = Math.sqrt(sumOfSquares(queryVector.values()))

  const scored = []

  for (const doc of docs) {
    let dotProduct = 0
    let docMagnitudeSquared = 0

    for (const [term, count] of doc.counts) {
      const weight = termWeight(count, idf(term))
      docMagnitudeSquared += weight * weight

      if (queryVector.has(term)) {
        dotProduct += weight * queryVector.get(term)
      }
    }

    if (dotProduct === 0 || docMagnitudeSquared === 0 || queryMagnitude === 0) {
      continue
    }

    const similarity = dotProduct / (Math.sqrt(docMagnitudeSquared) * queryMagnitude)

    if (similarity > 0) {
      scored.push({ postId: doc.postId, score: Number(similarity.toFixed(4)) })
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

const sumOfSquares = (values) => {
  let total = 0
  for (const value of values) {
    total += value * value
  }
  return total
}