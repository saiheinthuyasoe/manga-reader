import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, AccountType, UserRole } from "@/types/user";

// Create user profile in Firestore
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<UserProfile> {
  const userProfile: UserProfile = {
    uid,
    email,
    displayName,
    accountType: "free", // Default to free account
    role: "user", // Default to user role
    coins: 0, // Default coins
    bookmarks: [],
    readingHistory: [],
    purchasedChapters: [], // Default empty purchased chapters
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, "users", uid), userProfile);
  return userProfile;
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    uid, // Include the uid
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    membershipStartDate: data.membershipStartDate?.toDate(),
    membershipEndDate: data.membershipEndDate?.toDate(),
  } as UserProfile;
}

// Update user profile
export async function updateUserProfileData(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...updates,
    updatedAt: new Date(),
  });
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const userProfile = await createUserProfile(
    userCredential.user.uid,
    email,
    displayName
  );
  return userProfile;
}

// Sign in user
export async function signInUser(
  email: string,
  password: string
): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  let userProfile = await getUserProfile(userCredential.user.uid);

  // If user profile doesn't exist, create it
  if (!userProfile) {
    userProfile = await createUserProfile(
      userCredential.user.uid,
      userCredential.user.email || email,
      userCredential.user.displayName || email.split("@")[0]
    );
  }

  return userProfile;
}

// Sign out user
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user profile exists
    let userProfile = await getUserProfile(user.uid);

    if (!userProfile) {
      // Create new profile for Google user
      userProfile = await createUserProfile(
        user.uid,
        user.email || "",
        user.displayName || user.email?.split("@")[0] || "User"
      );
    }

    return userProfile;
  } catch (error: unknown) {
    // Handle account exists with different credential
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code ===
        "auth/account-exists-with-different-credential"
    ) {
      const email = (error as { customData?: { email?: string } }).customData
        ?.email;

      if (email) {
        // Get existing sign-in methods for this email
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods.includes("password")) {
          // Account exists with email/password
          // User needs to sign in with password first to link accounts
          throw new Error(
            "An account already exists with this email. Please sign in with your password first, then link your Google account in your profile settings."
          );
        }
      }
    }

    throw error;
  }
}

// Link Google account to existing account (call this when user is already signed in)
export async function linkGoogleAccount(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("No user is currently signed in");
  }

  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) {
      throw new Error("Failed to obtain Google credential.");
    }
    await linkWithCredential(auth.currentUser, credential);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "auth/credential-already-in-use"
    ) {
      throw new Error("This Google account is already linked to another user");
    }
    throw error;
  }
}

// Check if user has active membership
export function hasActiveMembership(user: UserProfile): boolean {
  if (user.accountType !== "membership") {
    return false;
  }

  // If no end date is set, membership is permanent
  if (!user.membershipEndDate) {
    return true;
  }

  // Check if membership hasn't expired
  return new Date() < user.membershipEndDate;
}

// Check if user is admin
export function isUserAdmin(user: UserProfile): boolean {
  return user.role === "admin";
}

// Admin: Update user account type
export async function updateUserAccountType(
  adminUid: string,
  targetUserId: string,
  accountType: AccountType,
  membershipDuration?: number // Duration in days, optional
): Promise<void> {
  // Verify admin permission
  const adminProfile = await getUserProfile(adminUid);
  if (!adminProfile || !isUserAdmin(adminProfile)) {
    throw new Error("Unauthorized: Admin access required");
  }

  const updates: Partial<UserProfile> = {
    accountType,
    updatedAt: new Date(),
  };

  if (accountType === "membership") {
    updates.membershipStartDate = new Date();

    if (membershipDuration) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + membershipDuration);
      updates.membershipEndDate = endDate;
    }
  }

  await updateDoc(doc(db, "users", targetUserId), updates);
}

// Admin: Update user role
export async function updateUserRole(
  adminUid: string,
  targetUserId: string,
  role: UserRole
): Promise<void> {
  // Verify admin permission
  const adminProfile = await getUserProfile(adminUid);
  if (!adminProfile || !isUserAdmin(adminProfile)) {
    throw new Error("Unauthorized: Admin access required");
  }

  await updateDoc(doc(db, "users", targetUserId), {
    role,
    updatedAt: new Date(),
  });
}
