import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type AuthUser = { username: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthPending: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to verify session");
  }
  const body = (await res.json()) as { user: AuthUser };
  return body.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isPending: isAuthPending } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: fetchSession,
    staleTime: 0,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      const text = await res.text();
      let body: { message?: string; user?: AuthUser };
      try {
        body = JSON.parse(text) as { message?: string; user?: AuthUser };
      } catch {
        const hint =
          res.headers.get("content-type")?.includes("text/html") &&
          text.includes("<!DOCTYPE")
            ? "Open the app on the same URL as the API (e.g. npm run dev), or run the API and use npm run dev:vite so /api is proxied."
            : text.slice(0, 200) || res.statusText;
        body = { message: hint };
      }
      if (!res.ok) {
        const msg =
          typeof body.message === "string" && body.message.length > 0
            ? body.message
            : `Sign in failed (${res.status})`;
        throw new Error(msg);
      }
      if (!body.user) {
        throw new Error(
          typeof body.message === "string" && body.message.length > 0
            ? body.message
            : "Unexpected response from server.",
        );
      }
      return body.user;
    },
    onSuccess: (loggedInUser) => {
      queryClient.setQueryData(["/api/auth/me"], loggedInUser);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSettled: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
    },
  });

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      await loginMutation.mutateAsync(credentials);
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value: AuthContextValue = {
    user: user ?? null,
    isAuthPending,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
