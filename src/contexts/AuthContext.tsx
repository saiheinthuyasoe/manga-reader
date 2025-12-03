"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
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
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log("Auth state changed:", firebaseUser?.uid || "No user");

        // Cleanup previous profile listener if exists
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (firebaseUser) {
          console.log("Firebase user found:", firebaseUser.uid);

          // First, try to get the profile once to check if it exists
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
          }

          // Set up real-time listener for user profile updates
          unsubscribeProfile = onSnapshot(
            doc(db, "users", firebaseUser.uid),
            (docSnapshot) => {
              if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const updatedProfile: UserProfile = {
                  uid: docSnapshot.id,
                  email: data.email,
                  displayName: data.displayName,
                  role: data.role || "user",
                  accountType: data.accountType || "free",
                  photoURL: data.photoURL,
                  coins: data.coins || 0,
                  purchasedChapters: data.purchasedChapters || [],
                  bookmarks: data.bookmarks || [],
                  readingHistory: data.readingHistory || [],
                  membershipStartDate: data.membershipStartDate?.toDate(),
                  membershipEndDate: data.membershipEndDate?.toDate(),
                  createdAt: data.createdAt?.toDate(),
                  updatedAt: data.updatedAt?.toDate(),
                };
                console.log(
                  "User profile updated in real-time:",
                  updatedProfile
                );
                setUser(updatedProfile);
              }
            },
            (error) => {
              console.error("Error listening to user profile:", error);
            }
          );

          setLoading(false);
        } else {
          console.log("No Firebase user");
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
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
