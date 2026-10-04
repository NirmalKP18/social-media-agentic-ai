import { useEffect, useMemo, useState } from 'react'
import { adminService } from '../../services/adminService.js'
import { SECURITY_ASSESSMENT_CASES } from '../../constants/securityAssessment.js'
import Icon from '../common/Icon.jsx'

const unpack = (payload, key) => payload?.data?.[key] ?? payload?.[key]
const formatExecutionTime = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not run yet'

export default function SecurityTestingPanel({ showToast }) {
  const [cases, setCases] = useState(SECURITY_ASSESSMENT_CASES)
  const [results, setResults] = useState({})
  const [selectedId, setSelectedId] = useState(SECURITY_ASSESSMENT_CASES[0].id)
  const [running, setRunning] = useState([])
  const [catalogueWarning, setCatalogueWarning] = useState('')

  useEffect(() => {
    adminService.getSecurityAssessmentCases()
      .then((payload) => {
        const serverCases = unpack(payload, 'cases')
        if (Array.isArray(serverCases) && serverCases.length) {
          setCases(serverCases)
          setCatalogueWarning('')
        } else setCatalogueWarning('The server returned no test cases. Restart the backend before running live tests.')
      })
      .catch(() => setCatalogueWarning('The test catalogue is available locally. Restart the backend before running live tests.'))
  }, [])

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedId) || cases[0], [cases, selectedId])
  const selectedResult = results[selectedCase?.id]
  const totals = Object.values(results).reduce((acc, result) => {
    acc[result.outcome === 'PASS' ? 'passed' : 'failed'] += 1
    return acc
  }, { passed: 0, failed: 0 })

  const runCase = async (caseId, quiet = false) => {
    setRunning((current) => current.includes(caseId) ? current : [...current, caseId])
    try {
      const payload = await adminService.runSecurityAssessment(caseId)
      const result = unpack(payload, 'result')
      if (!result?.checks) throw new Error('The backend returned an invalid security-test result')
      setResults((current) => ({ ...current, [caseId]: result }))
      setCatalogueWarning('')
      if (!quiet) showToast(`${caseId} completed: ${result.outcome}`, result.outcome !== 'PASS')
      return result
    } catch (error) {
      const message = error.message || `${caseId} failed to run`
      setCatalogueWarning(message.includes('Route not found') ? 'The live-test endpoint is not active. Restart the backend, then run the test again.' : message)
      if (!quiet) showToast(message, true)
      return null
    } finally {
      setRunning((current) => current.filter((id) => id !== caseId))
    }
  }

  const runAll = async () => {
    let failures = 0
    for (const test of cases) {
      setSelectedId(test.id)
      const result = await runCase(test.id, true)
      if (!result || result.outcome !== 'PASS') failures += 1
    }
    showToast(failures ? `Assessment complete with ${failures} failed case${failures === 1 ? '' : 's'}.` : 'All security assessment cases passed.', failures > 0)
  }

  return <section className="security-testing" aria-labelledby="security-testing-title">
    <div className="security-testing__toolbar">
      <div>
        <span className="security-testing__eyebrow"><Icon name="shield" size={14} /> Runtime security validation</span>
        <h2 id="security-testing-title">Prompt Injection Testing Panel</h2>
        <p>Execute controlled adversarial tests against the live agent pipeline. Temporary test data is removed after each run.</p>
      </div>
      <button type="button" className="btn btn--primary" onClick={runAll} disabled={running.length > 0}>
        <Icon name="bolt" size={15} /> {running.length ? `Running ${running[0]}...` : 'Run all tests'}
      </button>
    </div>

    {catalogueWarning && <div className="security-runtime-warning"><Icon name="alerts" size={16} /><span>{catalogueWarning}</span></div>}

    <div className="security-summary-grid">
      <div><small>Test suite</small><strong>{cases.length} controls</strong></div>
      <div><small>Executed</small><strong>{Object.keys(results).length} / {cases.length}</strong></div>
      <div className="security-summary--pass"><small>Passed</small><strong>{totals.passed}</strong></div>
      <div className="security-summary--fail"><small>Failed</small><strong>{totals.failed}</strong></div>
    </div>

    <nav className="security-case-list" aria-label="Security test cases">
      {cases.map((test) => {
        const result = results[test.id]
        return <button key={test.id} type="button" title={test.title} className={`security-case-row ${selectedCase?.id === test.id ? 'security-case-row--active' : ''}`} onClick={() => setSelectedId(test.id)}>
          <span className={`security-case-status security-case-status--${result?.outcome?.toLowerCase() || 'idle'}`}>{result?.outcome || test.id}</span>
          <span><strong>{test.title}</strong><small>{test.category}</small></span>
        </button>
      })}
    </nav>

    {selectedCase && <article className="security-evidence-card">
      <header className="security-evidence-head">
        <div>
          <span>SignalOS Security Assessment</span>
          <h3>{selectedCase.id} &mdash; {selectedCase.title}</h3>
          <p>{selectedCase.category} &middot; Live runtime evidence</p>
        </div>
        <span className={`security-outcome security-outcome--${selectedResult?.outcome?.toLowerCase() || 'ready'}`}>{selectedResult?.outcome || 'READY'}</span>
      </header>
      <div className="security-evidence-body">
        <div className="security-meta-grid">
          <div><small>Target</small><strong>{selectedResult?.target || (selectedCase.id === 'TC-13' ? 'Express API :5000' : 'Python agent pipeline :8000')}</strong></div>
          <div><small>HTTP status</small><strong>{selectedResult?.httpStatus ?? '-'}</strong></div>
          <div><small>Execution time</small><strong>{formatExecutionTime(selectedResult?.executedAt)}{selectedResult ? ` (${selectedResult.durationMs} ms)` : ''}</strong></div>
        </div>
        <section className="security-input-panel"><h4>Exact controlled input</h4><code>{selectedCase.input}</code></section>
        <section className="security-checks-panel">
          <h4>Security checks</h4>
          {selectedResult ? <div className="security-check-grid">{selectedResult.checks.map((check) => <div key={check.label} className={check.passed ? 'is-pass' : 'is-fail'}><b>{check.passed ? 'PASS' : 'FAIL'}</b><span>{check.label}</span></div>)}</div> : <p className="security-placeholder">Run this test to see verified control results.</p>}
        </section>
        <section className="security-response-panel">
          <h4>Observed response (redacted / selected fields)</h4>
          <pre>{selectedResult ? JSON.stringify(selectedResult.response, null, 2) : '// No response captured yet.'}</pre>
        </section>
        <footer className="security-evidence-footer">
          <span>Authentication tokens and configured secrets are intentionally excluded.</span>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => runCase(selectedCase.id)} disabled={running.length > 0}>
            <Icon name="bolt" size={14} /> {running.includes(selectedCase.id) ? 'Running...' : selectedResult ? 'Run again' : 'Run test'}
          </button>
        </footer>
      </div>
    </article>}
  </section>
}
