import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://velxo.onrender.com/api/v1'

interface UseApiOptions<T = any> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, any>
  skip?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  dependencies?: any[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export function useApi<T = any>(
  path: string | null,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!options.skip)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (options.skip || !path || path === null) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await fetch(`${API_BASE}${path}`, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const result: ApiResponse<T> = await res.json()

        if (isMounted) {
          // Extract data from API response wrapper
          if (result.success && result.data !== undefined) {
            setData(result.data as T)
            options.onSuccess?.(result.data as T)
          } else if (!result.success) {
            throw new Error(result.message || result.error || 'API request failed')
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return

        const error = err instanceof Error ? err : new Error('Unknown error')
        if (isMounted) {
          setError(error)
          options.onError?.(error)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, options.method, options.body])

  return { data, loading, error, refetch: () => {} }
}

export async function apiCall<T = any>(
  path: string,
  options: Omit<UseApiOptions<T>, 'skip' | 'onSuccess' | 'onError' | 'dependencies'> = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  const result: ApiResponse<T> = await res.json()

  if (result.success && result.data) {
    return result.data as T
  } else {
    throw new Error(result.message || result.error || 'API request failed')
  }
}
