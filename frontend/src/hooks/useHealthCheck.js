import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'

export function useHealthCheck() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkHealth = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await api.getHealth()
      setData(result)
    } catch (err) {
      setError(err.message || 'Unable to reach the backend')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  return { data, loading, error, retry: checkHealth }
}