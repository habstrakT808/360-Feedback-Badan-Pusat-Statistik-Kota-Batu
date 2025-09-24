// app/providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSetUser } from "@/store/useStore";
import { useSession } from "next-auth/react";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useSetUser();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user && 'id' in session.user) {
      setUser({ id: session.user.id, email: session.user.email || "" } as any);
    } else {
      setUser(null);
    }
  }, [session?.user?.email, setUser]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
