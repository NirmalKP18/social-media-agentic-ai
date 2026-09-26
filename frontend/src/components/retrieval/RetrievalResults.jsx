import { Link } from 'react-router-dom'
import { getPostDetailPath } from '../../constants/routes.js'
import { formatDate } from '../../utils/format.js'

function RetrievalResults({ results }) {
  if (results.length === 0) {
    return <p className="empty-state">No matching posts found for this query.</p>
  }

  return (
    <div className="posts-list">
      {results.map((result, index) => {
        const post = result.post
        if (!post) return null

        const scorePercent = Math.round((result.score || 0) * 100)

        return (
          <article className="card post-card" key={post._id}>
            <div className="post-card__head">
              <span className="score-badge">#{index + 1}</span>
              <span className="badge">{post.platform}</span>
              <span className="post-card__author">@{post.author}</span>
              <span className="post-card__date">{formatDate(post.createdAt)}</span>
            </div>
            <p className="post-card__content">{post.content}</p>
            <div className="post-card__meta">
              <span>
                Relevance score: <strong>{scorePercent}%</strong>
              </span>
            </div>
            <div className="post-card__actions">
              <Link className="btn" to={getPostDetailPath(post._id)}>
                View post
              </Link>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default RetrievalResults