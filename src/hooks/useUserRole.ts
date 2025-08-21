// src/hooks/useUserRole.ts (REPLACE COMPLETE FILE)
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/store/useStore'

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const user = useUser()

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        console.log('🔍 Checking role for user:', user.id)
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        console.log('🔍 Role check result:', { data, error })

        if (error) {
          console.error('Role check error:', error)
          setIsAdmin(false)
          setIsSupervisor(false)
        } else {
          setIsAdmin(data?.role === 'admin')
          setIsSupervisor(data?.role === 'supervisor')
        }
      } catch (error) {
        console.error('Role check exception:', error)
        setIsAdmin(false)
        setIsSupervisor(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [user?.id])

  return { isAdmin, isSupervisor, isLoading }
}