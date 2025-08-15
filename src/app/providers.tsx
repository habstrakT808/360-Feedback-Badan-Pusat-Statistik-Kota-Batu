// app/providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSetUser } from "@/store/useStore";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useSetUser();

  useEffect(() => {
    // Initialize user state
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
