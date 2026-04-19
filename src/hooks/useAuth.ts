import { useEffect, useMemo, useState } from "react";
import { clearStoredSupabaseAccessToken, getSupabaseClient } from "@/lib/supabase";

export type UnifiedUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: "user" | "admin";
  authType: "supabase";
};

type AuthState = {
  user: UnifiedUser | null;
  isLoading: boolean;
};

function mapUser(rawUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): UnifiedUser {
  const metadata = rawUser.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : rawUser.email || "User";
  const avatar =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : null;

  return {
    id: rawUser.id,
    name: fullName,
    email: rawUser.email || "",
    avatar,
    role: "user",
    authType: "supabase",
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setState({
        user: session?.user ? mapUser(session.user) : null,
        isLoading: false,
      });
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ? mapUser(session.user) : null,
        isLoading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    clearStoredSupabaseAccessToken();
    window.location.assign(`${window.location.origin}/#/login`);
  };

  return useMemo(
    () => ({
      user: state.user,
      isAuthenticated: !!state.user,
      isAdmin: state.user?.role === "admin",
      isLoading: state.isLoading,
      logout,
    }),
    [state],
  );
}
