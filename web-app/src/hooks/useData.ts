import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api.service'

export function useData<T>(endpoint: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get(endpoint)
      setData(response.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [endpoint])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...deps])

  return { data, loading, error, refetch: fetchData }
}

export function useMutation<T, R = void>(fn: (data: T) => Promise<R>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (data: T) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fn(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}
