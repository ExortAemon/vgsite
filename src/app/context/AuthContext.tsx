import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, User } from "@/app/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  updateProfile: (payload: { name: string; email: string; phone: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const data = await apiRequest<{ user: User | null }>("/auth.php?action=me");
    setUser(data.user);
  };

  useEffect(() => {
    refreshUser()
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    login: async (login, password) => {
      const data = await apiRequest<{ user: User }>("/auth.php?action=login", {
        method: "POST",
        body: JSON.stringify({ login, password })
      });
      setUser(data.user);
    },
    register: async (payload) => {
      const data = await apiRequest<{ user: User }>("/auth.php?action=register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setUser(data.user);
    },
    updateProfile: async (payload) => {
      const data = await apiRequest<{ user: User }>("/auth.php?action=profile", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setUser(data.user);
    },
    logout: async () => {
      await apiRequest<{ success: boolean }>("/auth.php?action=logout", { method: "POST" });
      setUser(null);
    },
    refreshUser
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
