import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import RetrievalResults from '../components/retrieval/RetrievalResults.jsx'
import { retrievalService } from '../services/retrievalService.js'
import { getRetrievalDetailPath } from '../constants/routes.js'
import { formatDate } from '../utils/format.js'

const MAX_QUERY_LENGTH = 200
const LIMIT_OPTIONS = [5, 10, 20]

function RetrievalPage() {
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get('q')?.slice(0, MAX_QUERY_LENGTH) || ''

  const [query, setQuery] = useState(urlQuery)
  const [limit, setLimit] = useState(10)
  const [searching, setSearching] = useState(false)
  const [formError, setFormError] = useState(null)
  const [current, setCurrent] = useState(null)

  const [retrievals, setRetrievals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const lastAutoQuery = useRef(null)

  const performSearch = async (queryValue, limitValue) => {
    setFormError(null)

    if (!queryValue.trim()) {
      setFormError('Enter a search query')
      return
    }

    if (queryValue.trim().length > MAX_QUERY_LENGTH) {
      setFormError(`Search query must be ${MAX_QUERY_LENGTH} characters or fewer`)
      return
    }

    setSearching(true)

    try {
      const response = await retrievalService.search({ query: queryValue.trim(), limit: limitValue })
      setCurrent(response.data.retrieval)
      setRetrievals((prev) => [response.data.retrieval, ...prev])
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    performSearch(query, limit)
  }

  useEffect(() => {
    if (!urlQuery || urlQuery === lastAutoQuery.current) return
    lastAutoQuery.current = urlQuery
    setQuery(urlQuery)
    performSearch(urlQuery, limit)
  }, [urlQuery])

  const fetchHistory = () => {
    setLoading(true)
    setLoadError(null)

    retrievalService
      .getRetrievals()
      .then((response) => setRetrievals(response.data.retrievals))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleDelete = async (retrievalId) => {
    if (!window.confirm('Delete this search?')) return

    setDeletingId(retrievalId)

    try {
      await retrievalService.deleteRetrieval(retrievalId)
      setRetrievals((prev) => prev.filter((item) => item._id !== retrievalId))
      if (current?._id === retrievalId) setCurrent(null)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageContainer title="Retrieval & Search" subtitle="Find relevant posts across your collection">
      <form className="form form--wide" onSubmit={handleSearch} data-tour="retrieval-container">
        <h2 className="form__title">Search your collection</h2>

        <label className="form__label" htmlFor="query">
          Query
        </label>
        <input
          id="query"
          className="form__input"
          type="text"
          name="query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. battery life is terrible"
          maxLength={MAX_QUERY_LENGTH}
          required
        />

        <label className="form__label" htmlFor="limit">
          Results
        </label>
        <select
          id="limit"
          className="form__input"
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
        >
          {LIMIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {formError && <ErrorMessage message={formError} />}

        <button className="form__submit" type="submit" disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {current && (
        <section className="posts-section">
          <h2 className="posts-section__title">Results for &ldquo;{current.query}&rdquo;</h2>
          <RetrievalResults results={current.results} />
          <p className="analysis-date">Searched {formatDate(current.createdAt)}</p>
        </section>
      )}

      <section className="posts-section">
        <h2 className="posts-section__title">Search history</h2>

        {loading && <Loading label="Loading search history..." />}

        {!loading && loadError && <ErrorMessage message={loadError} onRetry={fetchHistory} />}

        {!loading && !loadError && retrievals.length === 0 && (
          <p className="empty-state">No searches yet. Run your first search above.</p>
        )}

        {!loading && !loadError && retrievals.length > 0 && (
          <div className="posts-list">
            {retrievals.map((item) => {
              const matchCount = (item.results || []).filter((result) => result?.post).length

              return (
                <article className="card post-card" key={item._id}>
                  <div className="post-card__head">
                    <span className="post-card__author">{item.query}</span>
                    <span className="post-card__date">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="post-card__meta">
                    <span>{matchCount} match{matchCount === 1 ? '' : 'es'}</span>
                  </div>
                  <div className="post-card__actions">
                    <Link className="btn" to={getRetrievalDetailPath(item._id)}>
                      Open
                    </Link>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => handleDelete(item._id)}
                      disabled={deletingId === item._id}
                    >
                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </PageContainer>
  )
}

export default RetrievalPage