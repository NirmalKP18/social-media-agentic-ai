const getTimestamp = () => new Date().toISOString()

export const logger = {
  info: (message) => console.log(`[INFO] ${getTimestamp()} ${message}`),
  warn: (message) => console.warn(`[WARN] ${getTimestamp()} ${message}`),
  error: (message) => console.error(`[ERROR] ${getTimestamp()} ${message}`),
  agent: (step, name, status, details = '') => {
    const icon = status === 'success' ? '✔' : status === 'running' ? '▶' : status === 'failed' ? '✖' : 'ℹ'
    const statusText = status.toUpperCase()
    const detailStr = details ? ` - ${details}` : ''
    console.log(`\x1b[36m[AGENT ${step}: ${name}]\x1b[0m ${icon} ${statusText}${detailStr}`)
  },
  banner: (title) => {
    console.log(`\n\x1b[35m${'='.repeat(60)}\x1b[0m`)
    console.log(`\x1b[1m\x1b[33m${title}\x1b[0m`)
    console.log(`\x1b[35m${'='.repeat(60)}\x1b[0m\n`)
  },
}