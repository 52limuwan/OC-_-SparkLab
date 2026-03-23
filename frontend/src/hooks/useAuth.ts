'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, isAuthenticated, logout as authLogout, User } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser()
        setUser(currentUser)
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const logout = () => {
    authLogout()
    setUser(null)
    router.push('/login')
  }

  const requireAuth = () => {
    if (!loading && !isAuthenticated()) {
      router.push('/login')
      return false
    }
    return true
  }

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    logout,
    requireAuth,
    setUser
  }
}
