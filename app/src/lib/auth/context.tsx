import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { setAuthToken } from "@/lib/api/client";
import * as authApi from "@/lib/api/auth";
import { clearToken, getStoredToken, storeToken } from "@/lib/auth/storage";
import { queryClient } from "@/lib/query";

type Status = "loading" | "authed" | "guest";

type AuthContextValue = {
  status: Status;
  user: authApi.User | null;
  token: string | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (payload: authApi.RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: authApi.User) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<authApi.User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const apply = useCallback(
    async (nextToken: string | null, nextUser: authApi.User | null) => {
      setAuthToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
      if (nextToken) {
        await storeToken(nextToken);
      } else {
        await clearToken();
      }
      setStatus(nextToken ? "authed" : "guest");
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const stored = await getStoredToken();
      if (!stored) {
        setStatus("guest");
        return;
      }
      setAuthToken(stored);
      try {
        const currentUser = await authApi.me();
        setToken(stored);
        setUser(currentUser);
        setStatus("authed");
      } catch {
        setAuthToken(null);
        await clearToken();
        setStatus("guest");
      }
    })();
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const res = await authApi.login(identifier, password);
      await apply(res.token, res.user);
    },
    [apply],
  );

  const signUp = useCallback(
    async (payload: authApi.RegisterPayload) => {
      const res = await authApi.register(payload);
      await apply(res.token, res.user);
    },
    [apply],
  );

  const signOut = useCallback(async () => {
    /**
     * Revoked in the background rather than awaited. apiRequest builds its
     * Authorization header synchronously, so the call keeps this token while
     * the UI drops to the sign-in screen immediately, instead of sitting on a
     * cold serverless round trip. Signing out locally is what matters; the
     * failure path already discarded the token regardless.
     */
    void authApi.logout().catch(() => {});

    queryClient.clear();
    await apply(null, null);
  }, [apply]);

  const updateUser = useCallback((nextUser: authApi.User) => {
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, user, token, signIn, signUp, signOut, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
