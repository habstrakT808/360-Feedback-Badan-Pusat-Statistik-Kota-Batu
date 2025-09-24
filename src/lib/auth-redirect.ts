// src/lib/auth-redirect.ts
import { Session } from 'next-auth'

export async function handleAuthRedirect(session: Session | null) {
  if (!session?.user) {
    return '/login'
  }

  // Check if user has admin role
  try {
    const response = await fetch('/api/me/role', { cache: 'no-store' })
    const json = await response.json()
    const role = json.role || 'user'

    // If user is admin and trying to access admin page, allow it
    if (role === 'admin' && window.location.pathname.startsWith('/admin')) {
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
