import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/Loading";
import { useSession } from "next-auth/react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push("/login");
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      fallback || (
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memverifikasi autentikasi..." />
        </div>
      )
    );
  }

  if (!session?.user) {
    return (
      fallback || (
        <div className="flex justify-center items-center py-20">
          <Loading size="lg" text="Memverifikasi autentikasi..." />
        </div>
      )
    );
  }

  return <>{children}</>;
}
