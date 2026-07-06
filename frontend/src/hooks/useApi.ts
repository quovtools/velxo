import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, any>
  skip?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useApi<T = any>(
  path: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (options.skip) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_BASE}${path}`, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        })

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const result = await res.json()
        setData(result)
        options.onSuccess?.(result)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options.onError?.(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [path, options])

  return { data, loading, error }
}

export async function apiCall<T = any>(
  path: string,
  options: Omit<UseApiOptions, 'skip' | 'onSuccess' | 'onError'> = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  return res.json()
}
