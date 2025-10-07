import { useEffect, useState } from 'react'
import { authService, type UserProfile } from '@/services/auth.service'
import { socketManager } from '@/lib/socket'

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  console.log('🔧 useAuth hook initialized')

  useEffect(() => {
    console.log('🔧 useAuth useEffect running')
    // Check if authenticated and get user profile
    const loadUser = async () => {
      try {
        const isAuth = authService.isAuthenticated()
        console.log('🔧 Is authenticated?', isAuth)
        if (isAuth) {
          console.log('🔐 Loading user profile...')
          const profile = await authService.getProfile()
          console.log('✅ User profile loaded:', {
            email: profile.email,
            organization_id: profile.organization_id,
            role: profile.role
          })
          setUser(profile)

          // Connect socket and join organization (only for regular users with organization_id)
          const token = localStorage.getItem('auth_token')
          console.log('🔌 Preparing Socket.io connection:', {
            hasToken: !!token,
            hasOrgId: !!profile.organization_id,
            orgId: profile.organization_id
          })
          if (token && profile.organization_id) {
            console.log('🔌 Connecting to Socket.io with org:', profile.organization_id)
            socketManager.connect(token, profile.organization_id)
            socketManager.joinOrganization(profile.organization_id)
          } else {
            console.warn('⚠️ Cannot connect to Socket.io - missing token or organization_id')
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        authService.logout()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Listen for storage changes (when token is set/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        loadUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      socketManager.disconnect()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const signOut = async () => {
    authService.logout()
    socketManager.disconnect()
    setUser(null)
    window.location.href = '/'
  }

  return { user, loading, signOut }
}
