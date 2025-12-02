"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  registerUser,
  signInUser,
  signOutUser,
  updateUserProfileData,
  hasActiveMembership,
  isUserAdmin,
  signInWithGoogle,
} from "@/lib/auth";
import { AuthContextType, UserProfile } from "@/types/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log("Auth state changed:", firebaseUser?.uid || "No user");

        if (firebaseUser) {
          console.log("Firebase user found:", firebaseUser.uid);
          let userProfile = await getUserProfile(firebaseUser.uid);

          // If user profile doesn't exist, create it
          if (!userProfile) {
            console.log("User profile not found, creating...");
            const { createUserProfile } = await import("@/lib/auth");
            userProfile = await createUserProfile(
              firebaseUser.uid,
              firebaseUser.email || "",
              firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "User"
            );
            console.log("User profile created:", userProfile);
          } else {
            console.log("User profile loaded:", userProfile);
          }

          setUser(userProfile);
        } else {
          console.log("No Firebase user");
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const userProfile = await registerUser(email, password, displayName);
    setUser(userProfile);
  };

  const signIn = async (email: string, password: string) => {
    const userProfile = await signInUser(email, password);
    setUser(userProfile);
  };

  const signInGoogle = async () => {
    const userProfile = await signInWithGoogle();
    setUser(userProfile);
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfileData(user.uid, updates);
    setUser({ ...user, ...updates });
  };

  const hasMembership = user ? hasActiveMembership(user) : false;
  const isAdmin = user ? isUserAdmin(user) : false;
  const isTranslator = user ? user.role === "translator" : false;

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInGoogle,
    signOut,
    updateUserProfile,
    hasMembership,
    isAdmin,
    isTranslator,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
