import { useCallback, useEffect, useState } from 'react'
import PageContainer from '../components/common/PageContainer.jsx'
import Loading from '../components/common/Loading.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Icon from '../components/common/Icon.jsx'
import { connectionsService } from '../services/connectionsService.js'

const PLATFORM_META = {
  youtube: { mark: '▶', tone: 'red', description: 'Monitor videos, channels, comments, and audience activity.', docs: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com' },
  reddit: { mark: 'r/', tone: 'orange', description: 'Track public communities, posts, comments, and emerging topics.', docs: 'https://www.reddit.com/prefs/apps' },
  meta: { mark: 'f', tone: 'blue', description: 'Connect managed Facebook Pages and Instagram Business accounts.', docs: 'https://developers.facebook.com/apps/' },
  x: { mark: '𝕏', tone: 'slate', description: 'Retrieve permitted public conversations and brand mentions.', docs: 'https://developer.x.com/en/portal/dashboard' },
  linkedin: { mark: 'in', tone: 'linkedin', description: 'Connect approved organization and professional content access.', docs: 'https://www.linkedin.com/developers/apps' },
}

function ConnectionsPage() {
  const [connections, setConnections] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importQuery, setImportQuery] = useState('')
  const [importLimit, setImportLimit] = useState(10)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { const response = await connectionsService.getConnections(); setConnections(response.data.connections) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const verify = async () => {
    setTesting(true); setError(null); setSuccess(null)
    try { const response = await connectionsService.testConnection(selected.id); setSuccess(`${response.data.connection.name} verified successfully.`); await load() }
    catch (err) { setError(err.message) } finally { setTesting(false) }
  }

  const importLiveData = async (event) => {
    event.preventDefault(); setImporting(true); setError(null); setSuccess(null)
    try {
      const response = await connectionsService.importPosts(selected.id, { query: importQuery.trim(), limit: Number(importLimit) })
      const result = response.data.import
      setSuccess(`Imported ${result.created} new posts and refreshed ${result.updated} existing posts.`)
    } catch (err) { setError(err.message) } finally { setImporting(false) }
  }

  return <PageContainer>
    <header className="connections-head"><div><span className="eyebrow"><i /> Data sources</span><h1>Connect your social world</h1><p>Bring approved platform data into one secure intelligence workspace.</p></div><span className="connections-count"><Icon name="connections" /> {connections.filter((item) => item.configured).length} configured</span></header>
    {loading && <Loading label="Checking platform configuration..." />}
    {!loading && error && !selected && <ErrorMessage message={error} onRetry={load} />}
    {!loading && <div className="connection-layout">
      <section><div className="connection-grid">{connections.map((connection) => { const meta = PLATFORM_META[connection.id]; return <button type="button" className={`connection-card ${selected?.id === connection.id ? 'connection-card--selected' : ''}`} key={connection.id} onClick={() => { setSelected(connection); setError(null); setSuccess(null) }}><span className={`platform-mark platform-mark--${meta.tone}`}>{meta.mark}</span><span className="connection-card__copy"><strong>{connection.name}</strong><small>{meta.description}</small></span><span className={`connection-status ${connection.configured ? 'connection-status--ready' : ''}`}><i />{connection.configured ? 'Configured' : 'Setup required'}</span><Icon name="arrow" size={16} /></button>})}</div></section>
      <aside className="connection-wizard card">{selected ? <>
        <div className="wizard-title"><span className={`platform-mark platform-mark--${PLATFORM_META[selected.id].tone}`}>{PLATFORM_META[selected.id].mark}</span><div><span className="eyebrow">Connection wizard</span><h2>{selected.name}</h2></div></div>
        <div className="wizard-steps"><div className="wizard-step wizard-step--done"><span>1</span><div><strong>Create developer access</strong><small>Use the platform&apos;s official developer console.</small></div></div><div className={`wizard-step ${selected.configured ? 'wizard-step--done' : 'wizard-step--active'}`}><span>2</span><div><strong>Configure backend credentials</strong><small>Add {selected.variables.join(', ')} to backend/.env.</small></div></div><div className={`wizard-step ${selected.configured ? 'wizard-step--active' : ''}`}><span>3</span><div><strong>Verify secure connection</strong><small>The server tests the official API without exposing credentials.</small></div></div></div>
        {error && <ErrorMessage message={error} />}{success && <p className="connection-success">✓ {success}</p>}
        <div className="wizard-actions"><a className="btn btn--ghost" href={PLATFORM_META[selected.id].docs} target="_blank" rel="noreferrer">Open developer console</a><button className="btn btn--primary" type="button" disabled={!selected.configured || testing} onClick={verify}>{testing ? 'Verifying…' : selected.configured ? 'Test connection' : 'Add credentials first'}</button></div>
        {selected.configured && <form className="platform-import" onSubmit={importLiveData}>
          <div><span className="eyebrow">Live collection</span><h3>Import platform data</h3></div>
          {['youtube', 'reddit', 'x'].includes(selected.id) && <><label className="form__label" htmlFor="import-query">{selected.id === 'reddit' ? 'Subreddit' : 'Search query'}</label><input id="import-query" className="form__input" value={importQuery} onChange={(event) => setImportQuery(event.target.value)} placeholder={selected.id === 'reddit' ? 'technology' : 'brand or topic'} maxLength="200" required /></>}
          <label className="form__label" htmlFor="import-limit">Maximum posts</label><select id="import-limit" className="form__input" value={importLimit} onChange={(event) => setImportLimit(event.target.value)}><option value="5">5 posts</option><option value="10">10 posts</option><option value="25">25 posts</option></select>
          <button className="form__submit" disabled={importing}>{importing ? 'Importing live data...' : 'Import live posts'}</button>
        </form>}
        <p className="wizard-security">Credentials remain server-side and are never returned to this browser.</p>
      </> : <div className="wizard-empty"><span><Icon name="connections" size={28} /></span><h2>Select a platform</h2><p>Choose a source to open its secure connection wizard.</p></div>}</aside>
    </div>}
  </PageContainer>
}
export default ConnectionsPage
