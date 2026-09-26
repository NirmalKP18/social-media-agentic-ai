export const round = (value, digits = 2) => Number(value.toFixed(digits))

export const computeSentimentDistribution = (analyses) => {
  const distribution = { positive: 0, negative: 0, neutral: 0 }
  let scoreSum = 0

  for (const analysis of analyses) {
    const label = analysis.sentiment.label
    if (label in distribution) distribution[label] += 1
    scoreSum += analysis.sentiment.score
  }

  const analyzedCount = analyses.length
  const percent = (count) => (analyzedCount === 0 ? 0 : round((count / analyzedCount) * 100, 1))

  return {
    distribution,
    averageScore: analyzedCount === 0 ? 0 : round(scoreSum / analyzedCount),
    positivePercent: percent(distribution.positive),
    negativePercent: percent(distribution.negative),
    neutralPercent: percent(distribution.neutral),
  }
}

export const aggregateTopItems = (items, field, limit) => {
  const counts = new Map()

  for (const item of items) {
    for (const entry of item[field] || []) {
      counts.set(entry, (counts.get(entry) || 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

export const getDominantLabel = (distribution) => {
  let dominant = 'neutral'
  let maxCount = 0
  for (const [label, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      dominant = label
      maxCount = count
    }
  }
  return dominant
}