"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and sync to cookies
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) {
        syncSessionToCookie(session);
      }
    });

    // Listen for auth changes and sync to cookies
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        syncSessionToCookie(session);
      } else {
        // Clear the auth cookie on logout
        document.cookie = "auth-session=; path=/; max-age=0";
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Sync Supabase session to a cookie that the server proxy can read
 */
function syncSessionToCookie(session: Session) {
  try {
    if (!session) return;
    
    // Create a simple JSON object with the essential auth data
    const authData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user_id: session.user?.id,
      expires_at: session.expires_at,
    };
    
    // Set as an httpOnly-style cookie (server will see it)
    const encoded = btoa(JSON.stringify(authData));
    document.cookie = `auth-session=${encoded}; path=/; max-age=2592000; SameSite=Lax`;
  } catch (error) {
    console.error("Failed to sync session to cookie:", error);
  }
}

export function useAuth() {
  return useContext(AuthContext);
}