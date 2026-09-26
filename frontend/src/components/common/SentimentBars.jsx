const SENTIMENT_LABELS = [
  { key: 'positive', label: 'Positive' },
  { key: 'negative', label: 'Negative' },
  { key: 'neutral', label: 'Neutral' },
]

function SentimentBars({ distribution }) {
  return (
    <div className="sentiment-bars">
      {SENTIMENT_LABELS.map(({ key, label }) => {
        const count = distribution[key] ?? 0
        const percent = Number(distribution[`${key}Percent`] ?? 0)

        return (
          <div className="sentiment-row" key={key}>
            <span className="sentiment-row__label">{label}</span>
            <span className="sentiment-row__count">{count}</span>
            <div className="sentiment-row__bar">
              <span
                className={`sentiment-row__fill sentiment-row__fill--${key}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="sentiment-row__percent">{percent}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default SentimentBars