import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiCall, ApiResponse } from './useApi'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'user' | 'seller' | 'admin'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })
  const router = useRouter()

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }

        const user = await apiCall<User>('/auth/me')
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          isLoading: false,
        }))
      } catch (error) {
        localStorage.removeItem('auth_token')
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Auth check failed',
          isLoading: false,
        }))
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await apiCall<{ user: User; session: { access_token: string } }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      if (response?.session?.access_token) {
        localStorage.setItem('auth_token', response.session.access_token)
        setState(prev => ({
          ...prev,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        }))
        return { success: true }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setState(prev => ({ ...prev, error: message, isLoading: false }))
      return { success: false, error: message }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await apiCall<{ user: User; session: { access_token: string } }>('/auth/register', {
        method: 'POST',
        body: { email, password, firstName, lastName },
      })

      if (response?.session?.access_token) {
        localStorage.setItem('auth_token', response.session.access_token)
        setState(prev => ({
          ...prev,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        }))
        return { success: true }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      setState(prev => ({ ...prev, error: message, isLoading: false }))
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('auth_token')
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    })
    router.push('/auth/login')
  }, [router])

  return {
    ...state,
    login,
    register,
    logout,
  }
}
