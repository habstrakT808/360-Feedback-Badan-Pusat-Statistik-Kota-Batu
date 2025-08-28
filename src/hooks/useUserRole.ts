// src/hooks/useUserRole.ts
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
        
        // First try to get role from user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle() // Use maybeSingle instead of single to avoid error if no record

        console.log('🔍 Role check result:', { data, error })

        if (error) {
          console.error('Role check error:', error)
          // Fallback to database function
          try {
            const { data: functionData, error: functionError } = await supabase
              .rpc('get_current_user_role')
            
            if (functionError) {
              console.error('Function role check error:', functionError)
              setIsAdmin(false)
              setIsSupervisor(false)
            } else {
              const role = functionData || 'user'
              console.log('🔍 Function role result:', role)
              setIsAdmin(role === 'admin')
              setIsSupervisor(role === 'supervisor')
            }
          } catch (functionException) {
            console.error('Function role check exception:', functionException)
            setIsAdmin(false)
            setIsSupervisor(false)
          }
        } else {
          // If we got data from user_roles table
          const role = data?.role || 'user'
          console.log('🔍 Table role result:', role)
          setIsAdmin(role === 'admin')
          setIsSupervisor(role === 'supervisor')
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