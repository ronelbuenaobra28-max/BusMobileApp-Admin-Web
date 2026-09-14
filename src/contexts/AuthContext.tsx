import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "passenger" | "driver" | "unknown";

export interface AdminProfile {
  user_id: string;
  role: UserRole;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextValue {
  profile: AdminProfile | null;
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
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setProfile(null);
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        setProfile(null);
        return;
      }
      const data = (await response.json()) as {
        id: string;
        role: string;
        email?: string;
        first_name?: string;
        last_name?: string;
      };
      setProfile({
        user_id: data.id,
        role: (data.role as UserRole) ?? "unknown",
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      });
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    void refreshProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
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
    await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ profile, initialized, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
