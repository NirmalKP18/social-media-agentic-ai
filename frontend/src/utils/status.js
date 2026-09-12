export function getStatusText({ loading, error, data }) {
  if (loading) return 'Connecting to backend...'
  if (error) return 'Backend unavailable'
  if (data?.success) return 'Backend connected'
  return 'No response'
}