import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import RetrievalResults from '../components/retrieval/RetrievalResults.jsx'
import { retrievalService } from '../services/retrievalService.js'
import { ROUTES, getInsightsPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

function RetrievalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [retrieval, setRetrieval] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    retrievalService
      .getRetrieval(id)
      .then((response) => setRetrieval(response.data.retrieval))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this search?')) return

    setDeleting(true)

    try {
      await retrievalService.deleteRetrieval(id)
      navigate(ROUTES.retrieval)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <PageContainer title="Search detail">
        <Loading label="Loading search..." />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Search detail">
        <ErrorMessage message={error} />
        <p>
          <Link to={ROUTES.retrieval}>Back to retrieval</Link>
        </p>
      </PageContainer>
    )
  }

  if (!retrieval) {
    return (
      <PageContainer title="Search detail">
        <p>This search could not be found.</p>
        <p>
          <Link to={ROUTES.retrieval}>Back to retrieval</Link>
        </p>
      </PageContainer>
    )
  }

  const matchCount = (retrieval.results || []).filter((result) => result?.post).length

  return (
    <PageContainer title="Search detail" subtitle={`\u201C${retrieval.query}\u201D`}>
      <div className="card">
        <dl className="post-detail">
          <div>
            <dt>Query</dt>
            <dd>{retrieval.query}</dd>
          </div>
          <div>
            <dt>Matches</dt>
            <dd>{matchCount}</dd>
          </div>
          <div>
            <dt>Searched</dt>
            <dd>{formatDate(retrieval.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <section className="posts-section">
        <h2 className="posts-section__title">Ranked results</h2>
        <RetrievalResults results={retrieval.results} />
      </section>

      <div className="post-card__actions">
        <Link className="btn" to={getInsightsPath(id)}>
          Generate insight report from this search
        </Link>
        <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete search'}
        </button>
        <Link className="btn btn--ghost" to={ROUTES.retrieval}>
          Back to retrieval
        </Link>
      </div>
    </PageContainer>
  )
}

export default RetrievalDetailPage