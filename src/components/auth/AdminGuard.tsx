import { ReactNode } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { Loading } from '@/components/ui/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/store/useStore'

interface AdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAdmin, isLoading } = useUserRole()
  const user = useUser()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're sure user is not admin and not loading
    if (!isLoading && !isAdmin && user) {
      console.log('AdminGuard: User is not admin, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isAdmin, isLoading, router, user])

  // Show loading while checking user role
  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading size="lg" text="Memverifikasi akses admin..." />
      </div>
    )
  }

  // Show fallback if user is not admin
  if (!isAdmin) {
    return fallback || (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 mb-6">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
