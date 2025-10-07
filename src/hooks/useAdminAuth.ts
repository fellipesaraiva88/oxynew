import { useEffect, useState } from 'react'
import { type UserProfile } from '@/services/auth.service'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_admin: boolean
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAdminUser = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        if (!token) {
          setLoading(false)
          return
        }

        // Get admin user from token (JWT decode or API call)
        const response = await fetch('/api/internal/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to get admin profile')
        }

        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error('Failed to load admin profile:', error)
        localStorage.removeItem('admin_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadAdminUser()
  }, [])

  const signOut = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
    window.location.href = '/admin/login'
  }

  return { user, loading, signOut }
}
