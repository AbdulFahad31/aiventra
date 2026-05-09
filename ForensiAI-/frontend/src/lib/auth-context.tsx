import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { auth, ensureAuthPersistence } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureAuthPersistence().catch(() => undefined);

    return onAuthStateChanged(auth, setUser, () => {
      setUser(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signInWithEmail: async (email: string, password: string) => {
      await ensureAuthPersistence();
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    signUpWithEmail: async (email: string, password: string, displayName?: string) => {
      await ensureAuthPersistence();
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profileName = displayName?.trim();
      if (profileName) {
        await updateProfile(credential.user, { displayName: profileName });
      }
    },
    logout: async () => {
      await signOut(auth);
    },
    getIdToken: async () => user?.getIdToken() ?? null
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
