'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from './useApi'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'user' | 'seller' | 'admin'
  isVerified: boolean
  createdAt: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const userData = await apiCall<AuthUser>('/auth/me')
        setUser(userData)
        setIsAuthenticated(true)
      } catch (err) {
        localStorage.removeItem('token')
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
    router.push('/')
  }

  const login = async (email: string, password: string) => {
    const { token, user: userData } = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    localStorage.setItem('token', token)
    setUser(userData)
    setIsAuthenticated(true)
    return { token, user: userData }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const { token, user: userData } = await apiCall('/auth/register', {
      method: 'POST',
      body: { email, password, firstName, lastName },
    })
    localStorage.setItem('token', token)
    setUser(userData)
    setIsAuthenticated(true)
    return { token, user: userData }
  }

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    login,
    register,
  }
}
