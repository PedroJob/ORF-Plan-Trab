import { Prisma } from "@prisma/client";
import { useEffect, useState } from "react";

export type SessionUser = Prisma.UserGetPayload<{
  include: {
    om: true;
  };
}>;

export interface UseSessionReturn {
  user: SessionUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error("Erro ao buscar sessão do usuário");
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return {
    user,
    isLoading,
    error,
    refetch: fetchSession,
  };
}
