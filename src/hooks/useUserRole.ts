// src/hooks/useUserRole.ts
import { useState, useEffect } from 'react'
import { useUser } from '@/store/useStore'
import { useSession } from 'next-auth/react'

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const user = useUser()
  const { data: session } = useSession()

  useEffect(() => {
    const checkUserRole = async () => {
      const userId = (session?.user && 'id' in session.user ? session.user.id : null) || user?.id
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch('/api/me/role', { cache: 'no-store' })
        const json = await res.json()
        const role = json.role || 'user'
        setIsAdmin(role === 'admin')
        setIsSupervisor(role === 'supervisor')
      } catch (error) {
        console.error('Role check exception:', error)
        setIsAdmin(false)
        setIsSupervisor(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [session?.user, user?.id])

  return { isAdmin, isSupervisor, isLoading }
}