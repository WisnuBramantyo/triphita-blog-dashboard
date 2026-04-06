import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAuthPending } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthPending && !user) {
      setLocation("/login");
    }
  }, [isAuthPending, user, setLocation]);

  if (isAuthPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
