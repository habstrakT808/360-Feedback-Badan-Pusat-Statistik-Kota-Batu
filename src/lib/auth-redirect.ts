// src/lib/auth-redirect.ts
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function handleAuthRedirect(user: User | null) {
  if (!user) {
    return '/login'
  }

  // Check if user has admin role
  try {
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    // If user is admin and trying to access admin page, allow it
    if (userRole?.role === 'admin' && window.location.pathname.startsWith('/admin')) {
      return '/admin'
    }

    // Default redirect to dashboard
    return '/dashboard'
  } catch (error) {
    console.error('Error checking user role:', error)
    // Default to dashboard if error
    return '/dashboard'
  }
}

export function getDefaultRedirectPath() {
  return '/dashboard'
}
