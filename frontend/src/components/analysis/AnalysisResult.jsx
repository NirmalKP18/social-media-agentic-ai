import { useState } from 'react'
import Icon from '../common/Icon.jsx'

const EMOTION_EMOJIS = {
  joy: '😊',
  happiness: '😄',
  anger: '😠',
  frustration: '😤',
  sadness: '😢',
  fear: '😨',
  surprise: '😲',
  disgust: '🤢',
  neutral: '😐',
}

const INTENT_LABELS = {
  question: { label: 'Inquiry / Question', icon: 'help', color: 'blue' },
  complaint: { label: 'Complaint / Issue', icon: 'alerts', color: 'red' },
  praise: { label: 'Praise / Appreciation', icon: 'heart', color: 'green' },
  feedback: { label: 'Feedback / Suggestion', icon: 'sparkles', color: 'amber' },
  feature_request: { label: 'Feature Request', icon: 'sparkles', color: 'purple' },
  other: { label: 'General Discussion', icon: 'comments', color: 'slate' },
}

const ENTITY_COLORS = {
  ORGANIZATION: 'entity-badge--org',
  ORG: 'entity-badge--org',
  PERSON: 'entity-badge--person',
  PRODUCT: 'entity-badge--product',
  LOCATION: 'entity-badge--location',
  GPE: 'entity-badge--location',
  EVENT: 'entity-badge--event',
  DATE: 'entity-badge--date',
}

function AnalysisResult({ analysis }) {
  const [showComments, setShowComments] = useState(false)

  if (!analysis) return null

  const sentiment = analysis.sentiment || { label: 'neutral', score: 0, confidence: 0.5 }
  const score = Number((sentiment.score ?? 0).toFixed(2))
  const confidence = Math.round((sentiment.confidence ?? 0.5) * 100)
  const priority = analysis.priority || { level: 'low', score: 0, factors: [] }
  const emotion = analysis.emotion || { label: 'neutral' }
  const intent = analysis.intent || 'other'
  const topics = Array.isArray(analysis.topics) ? analysis.topics : []
  const entities = Array.isArray(analysis.entities) ? analysis.entities : []
  const namedEntities = Array.isArray(analysis.namedEntities) ? analysis.namedEntities : []
  const conversation = analysis.conversation || null
  const commentAnalyses = Array.isArray(analysis.commentAnalyses) ? analysis.commentAnalyses : []

  const primaryEmotionEmoji = EMOTION_EMOJIS[emotion.label?.toLowerCase()] || '⚡'
  const intentInfo = INTENT_LABELS[intent.toLowerCase()] || { label: intent, icon: 'comments', color: 'slate' }

  // Normalized score bar percentage (score between -1 and +1 -> 0% to 100%)
  const scorePercentage = Math.round(((score + 1) / 2) * 100)

  return (
    <div className="nlp-intel-card">
      {/* Top Metrics Grid: Sentiment, Emotion, Intent, Priority */}
      <div className="nlp-metrics-row">
        {/* 1. Sentiment Gauge */}
        <div className={`nlp-metric-cell nlp-metric-cell--${sentiment.label}`}>
          <div className="nlp-metric-cell__header">
            <span className="nlp-metric-cell__label">Sentiment Polarity</span>
            <span className="nlp-metric-cell__conf">{confidence}% Conf</span>
          </div>
          <div className="nlp-metric-cell__body">
            <span className={`nlp-sentiment-tag nlp-sentiment-tag--${sentiment.label}`}>
              {sentiment.label.toUpperCase()}
            </span>
            <span className="nlp-metric-score">
              {score > 0 ? `+${score}` : score}
            </span>
          </div>
          {/* Visual Polarity Gauge Bar */}
          <div className="nlp-polarity-track" title={`Polarity score: ${score} (-1.0 to +1.0)`}>
            <div
              className={`nlp-polarity-indicator nlp-polarity-indicator--${sentiment.label}`}
              style={{ left: `${Math.max(4, Math.min(96, scorePercentage))}%` }}
            />
          </div>
        </div>

        {/* 2. Emotion Vector */}
        <div className="nlp-metric-cell">
          <div className="nlp-metric-cell__header">
            <span className="nlp-metric-cell__label">Emotion Tone</span>
            <span className="nlp-metric-cell__pill">Fine-Grained</span>
          </div>
          <div className="nlp-metric-cell__body">
            <span className="nlp-emotion-badge">
              <span className="nlp-emotion-emoji">{primaryEmotionEmoji}</span>
              <span className="nlp-emotion-name">{emotion.label || 'Neutral'}</span>
            </span>
          </div>
          {emotion.scores && typeof emotion.scores === 'object' && (
            <div className="nlp-secondary-emotions">
              {Object.entries(emotion.scores)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(([name, val]) => (
                  <span key={name} className="nlp-sub-emotion-tag">
                    {name}: {Math.round(Number(val) * 100)}%
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* 3. Intent Classification */}
        <div className="nlp-metric-cell">
          <div className="nlp-metric-cell__header">
            <span className="nlp-metric-cell__label">Classified Intent</span>
            <Icon name={intentInfo.icon} size={14} />
          </div>
          <div className="nlp-metric-cell__body">
            <span className={`nlp-intent-badge nlp-intent-badge--${intentInfo.color}`}>
              {intentInfo.label}
            </span>
          </div>
          <div className="nlp-meta-caption">Parsed by Agent 2 NLP Suite</div>
        </div>

        {/* 4. Priority & Risk */}
        <div className={`nlp-metric-cell nlp-metric-cell--priority-${priority.level}`}>
          <div className="nlp-metric-cell__header">
            <span className="nlp-metric-cell__label">Escalation Priority</span>
            <span className="nlp-priority-num">{Math.round(priority.score ?? 0)}/100</span>
          </div>
          <div className="nlp-metric-cell__body">
            <span className={`nlp-priority-badge nlp-priority-badge--${priority.level}`}>
              {priority.level?.toUpperCase() || 'LOW'}
            </span>
          </div>
          <div className="nlp-meta-caption">
            {priority.factors?.length > 0 ? priority.factors.slice(0, 2).join(' · ') : 'Standard queue'}
          </div>
        </div>
      </div>

      {/* AI Synthesized Executive Summary */}
      {analysis.summary && (
        <div className="nlp-summary-block">
          <div className="nlp-summary-block__title">
            <Icon name="sparkles" size={14} className="nlp-sparkle-icon" />
            <span>AI Narrative Summary</span>
          </div>
          <p className="nlp-summary-block__text">{analysis.summary}</p>
        </div>
      )}

      {/* Semantic Topics & Named Entities Tags */}
      <div className="nlp-tags-row">
        {/* Topics */}
        <div className="nlp-tag-group">
          <span className="nlp-tag-group__label">Extracted Topics:</span>
          <div className="nlp-tag-group__chips">
            {topics.length > 0 ? (
              topics.map((t) => (
                <span key={t} className="nlp-topic-chip">
                  <span className="nlp-topic-hash">#</span>
                  {t}
                </span>
              ))
            ) : (
              <span className="nlp-empty-tag">No distinct topics detected</span>
            )}
          </div>
        </div>

        {/* Named Entities */}
        <div className="nlp-tag-group">
          <span className="nlp-tag-group__label">Recognized Entities:</span>
          <div className="nlp-tag-group__chips">
            {namedEntities.length > 0 ? (
              namedEntities.map((ne, idx) => {
                const colorClass = ENTITY_COLORS[ne.type?.toUpperCase()] || 'entity-badge--generic'
                return (
                  <span key={`${ne.text}-${idx}`} className={`nlp-entity-chip ${colorClass}`}>
                    <strong>{ne.text}</strong>
                    {ne.type && <span className="nlp-entity-type">{ne.type}</span>}
                  </span>
                )
              })
            ) : entities.length > 0 ? (
              entities.map((e) => (
                <span key={e} className="nlp-entity-chip entity-badge--generic">
                  {e}
                </span>
              ))
            ) : (
              <span className="nlp-empty-tag">None identified</span>
            )}
          </div>
        </div>
      </div>

      {/* Audience Comments Deep NLP Breakdown */}
      {conversation && conversation.totalComments > 0 && (
        <div className="nlp-conversation-section">
          <button
            type="button"
            className="nlp-conversation-toggle-btn"
            onClick={() => setShowComments(!showComments)}
          >
            <div className="nlp-conversation-meta">
              <Icon name="comments" size={15} />
              <span className="nlp-conversation-count">
                <strong>{conversation.totalComments}</strong> Audience Comments Parsed
              </span>
              <span className="nlp-conversation-breakdown">
                ({conversation.positive} pos · {conversation.neutral} neu · {conversation.negative} neg)
              </span>
            </div>
            <span className="nlp-toggle-indicator">{showComments ? 'Hide Comments ▲' : 'Inspect Breakdown ▼'}</span>
          </button>

          {showComments && (
            <div className="nlp-comments-list">
              {commentAnalyses.map((comment, index) => (
                <div className="nlp-comment-item" key={`${comment.author}-${index}`}>
                  <div className="nlp-comment-item__head">
                    <span className="nlp-comment-author">@{comment.author || 'User'}</span>
                    <div className="nlp-comment-badges">
                      <span className={`nlp-comment-sentiment nlp-comment-sentiment--${comment.sentiment?.label || 'neutral'}`}>
                        {comment.sentiment?.label || 'neutral'}
                      </span>
                      {comment.emotion?.label && (
                        <span className="nlp-comment-emotion">
                          {EMOTION_EMOJIS[comment.emotion.label.toLowerCase()] || ''} {comment.emotion.label}
                        </span>
                      )}
                      {comment.intent && (
                        <span className="nlp-comment-intent">
                          {comment.intent}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="nlp-comment-text">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AnalysisResult
