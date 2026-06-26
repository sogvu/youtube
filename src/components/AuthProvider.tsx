"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  updateUserPlan: (plan: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await fetch("http://localhost:5000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            setUser({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              plan: data.plan,
            });
          } else if (res.status === 401 && storedRefreshToken) {
            // Attempt token refresh
            const refreshRes = await fetch("http://localhost:5000/api/auth/refresh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem("accessToken", refreshData.accessToken);
              localStorage.setItem("refreshToken", refreshData.refreshToken);
              setToken(refreshData.accessToken);

              // Re-fetch profile
              const retryRes = await fetch("http://localhost:5000/api/auth/me", {
                headers: {
                  Authorization: `Bearer ${refreshData.accessToken}`,
                },
              });
              if (retryRes.ok) {
                const retryData = await retryRes.json();
                setUser({
                  id: retryData.user.id,
                  email: retryData.user.email,
                  name: retryData.user.name,
                  role: retryData.user.role,
                  plan: retryData.plan,
                });
              } else {
                handleLogout();
              }
            } else {
              handleLogout();
            }
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname.startsWith("/auth");
      if (!user && !isAuthPage) {
        router.push("/auth/login");
      } else if (user && isAuthPage) {
        router.push("/");
      }
    }
  }, [user, loading, pathname]);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setToken(accessToken);
    setUser(userData);
    router.push("/");
  };

  const logout = () => {
    handleLogout();
    router.push("/auth/login");
  };

  const updateUserPlan = (plan: string) => {
    if (user) {
      setUser({ ...user, plan });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
