import { ReactNode, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui/Loading";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
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
