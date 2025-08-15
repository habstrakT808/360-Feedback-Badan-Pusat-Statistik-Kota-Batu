import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/store/useStore'

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false)
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
        
        // Use service role client to bypass RLS
        const supabaseAdmin = supabase // Atau buat admin client jika perlu
        
        const { data, error } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        console.log('🔍 Role check result:', { data, error })

        if (error) {
          console.error('Role check error:', error)
          setIsAdmin(false)
        } else {
          setIsAdmin(data?.role === 'admin')
        }
      } catch (error) {
        console.error('Role check exception:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [user?.id])

  return { isAdmin, isLoading }
}
