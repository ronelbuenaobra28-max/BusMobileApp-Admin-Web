import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "operator" | "passenger" | "driver" | "unknown";

export interface AdminProfile {
  user_id: string;
  role: UserRole;
  email?: string;
  first_name?: string;
  last_name?: string;
}

/** Signed in with a password, but the session still needs the emailed
 *  sign-in code before the API will accept it. */
export interface PendingLoginCode {
  emailHint: string | null;
}

interface AuthContextValue {
  profile: AdminProfile | null;
  loginCode: PendingLoginCode | null;
  initialized: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loginCode, setLoginCode] = useState<PendingLoginCode | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  // Who the cached API data belongs to. When the signed-in user changes (or
  // signs out), the cache is wiped so the next person never sees it.
  const cacheOwner = useRef<string | null>(null);
  // Only the latest /me request may set the profile; an older one that
  // resolves after a logout must not bring the previous user back.
  const refreshSeq = useRef(0);

  const resetCacheFor = (userId: string | null) => {
    if (cacheOwner.current !== userId) {
      queryClient.clear();
      cacheOwner.current = userId;
    }
  };

  const refreshProfile = async () => {
    const seq = ++refreshSeq.current;
    const isLatest = () => seq === refreshSeq.current;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!isLatest()) return;
      resetCacheFor(session?.user.id ?? null);
      if (!session) {
        setProfile(null);
        setLoginCode(null);
        return;
      }
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const response = await fetch(`${base}/api/auth/me`, { headers });
      if (!isLatest()) return;
      if (response.status === 403) {
        // Maybe only the emailed sign-in code is missing for this session.
        const codeStatus = await fetch(`${base}/api/auth/login-code/status`, { headers })
          .then((r) => (r.ok ? (r.json() as Promise<{ required: boolean; verified: boolean; email_hint?: string | null }>) : null))
          .catch(() => null);
        if (!isLatest()) return;
        setProfile(null);
        setLoginCode(
          codeStatus?.required && !codeStatus.verified ? { emailHint: codeStatus.email_hint ?? null } : null,
        );
        return;
      }
      if (!response.ok) {
        setProfile(null);
        setLoginCode(null);
        return;
      }
      const data = (await response.json()) as {
        id: string;
        role: string;
        email?: string;
        first_name?: string;
        last_name?: string;
      };
      if (!isLatest()) return;
      setLoginCode(null);
      setProfile({
        user_id: data.id,
        role: (data.role as UserRole) ?? "unknown",
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      });
    } catch {
      if (isLatest()) setProfile(null);
    } finally {
      if (isLatest()) {
        setLoading(false);
        setInitialized(true);
      }
    }
  };

  useEffect(() => {
    void refreshProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resetCacheFor(session?.user.id ?? null);
      void refreshProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
    // Subscribe once. The helpers only use refs, setters and the query client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    refreshSeq.current++; // drop any /me still in flight
    await supabase.auth.signOut();
    resetCacheFor(null);
    setProfile(null);
    setLoginCode(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ profile, loginCode, initialized, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
