import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import { useEffect, type ReactNode } from "react";
import {
  clearStoredSupabaseAccessToken,
  getStoredSupabaseAccessToken,
  getSupabaseClient,
  syncStoredSupabaseAccessToken,
} from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const token = getStoredSupabaseAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const supabase = getSupabaseClient();

    void syncStoredSupabaseAccessToken().finally(() => {
      void queryClient.invalidateQueries();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        window.localStorage.setItem("supabase_access_token", session.access_token);
      } else {
        clearStoredSupabaseAccessToken();
      }

      void queryClient.invalidateQueries();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
