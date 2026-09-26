import { useEffect, useState } from 'react'
import PageContainer from '../components/common/PageContainer.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loading from '../components/common/Loading.jsx'
import { settingsService } from '../services/settingsService.js'

function StatusRow({ label, value, tone = 'ok' }) {
  return (
    <div className="settings-row">
      <span className="settings-row__key">{label}</span>
      <span className={`badge badge--${tone}`}>{value}</span>
    </div>
  )
}

function SettingsGroup({ title, children }) {
  return (
    <section className="card dashboard-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">System status</span>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    settingsService
      .get()
      .then((response) => setSettings(response.data.settings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const toneFor = (value, okValues) => (okValues.includes(value) ? 'ok' : 'warn')

  return (
    <PageContainer title="Settings" subtitle="Runtime configuration and service health for the agentic system">
      {loading && <Loading label="Loading settings..." />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && settings && (
        <div className="settings-grid">
          <SettingsGroup title="Application">
            <StatusRow label="Name" value={settings.app?.name} />
            <StatusRow label="Environment" value={settings.app?.environment} />
          </SettingsGroup>

          <SettingsGroup title="MongoDB">
            <StatusRow label="Database" value={settings.mongodb?.database} tone="ok" />
            <StatusRow label="Connection" value={settings.mongodb?.status} tone={toneFor(settings.mongodb?.status, ['connected'])} />
          </SettingsGroup>

          <SettingsGroup title="Vector store">
            <StatusRow label="Status" value={settings.vectorStore?.status} tone={toneFor(settings.vectorStore?.status, ['indexed', 'empty', 'indexing'])} />
            <StatusRow label="Documents" value={String(settings.vectorStore?.documents ?? 0)} />
            <StatusRow label="Chunks" value={String(settings.vectorStore?.chunks ?? 0)} />
            <StatusRow label="Embeddings" value={settings.vectorStore?.embeddingsLoaded ? 'loaded' : settings.vectorStore?.embeddingsInstalled ? 'installed' : 'off'} tone={settings.vectorStore?.embeddingsLoaded ? 'ok' : 'warn'} />
            <StatusRow label="Embedding model" value={settings.vectorStore?.embeddingsLoaded ? 'all-MiniLM-L6-v2' : '—'} />
          </SettingsGroup>

          <SettingsGroup title="Python agent service">
            <StatusRow label="URL" value={settings.pythonService?.url} />
            <StatusRow label="Reachable" value={settings.pythonService?.reachable ? 'yes' : 'no'} tone={settings.pythonService?.reachable ? 'ok' : 'warn'} />
          </SettingsGroup>

          <SettingsGroup title="Language model">
            <StatusRow label="Provider" value={settings.llm?.provider} tone={settings.llm?.configured ? 'ok' : 'warn'} />
            <StatusRow label="Model" value={settings.llm?.model} />
            <StatusRow label="Grounding" value={settings.llm?.configured ? 'api key set — grounded generations' : 'local fallback — final drafts not prepended with citations'} />
          </SettingsGroup>

          <SettingsGroup title="Agents">
            <StatusRow label="Engine" value={settings.agents?.engine} />
            <StatusRow label="Retrieval top-k" value={String(settings.agents?.topK ?? 3)} />
            <StatusRow label="Roles" value="user · reviewer · admin" />
          </SettingsGroup>
        </div>
      )}
      {!loading && !error && settings && (
        <section className="card dashboard-panel">
          <p className="analysis-date">
            These values are read-only and reflect the live backend. Secrets are never exposed through this screen.
          </p>
        </section>
      )}
    </PageContainer>
  )
}

export default SettingsPage