export type AccountType = "free" | "membership";
export type UserRole = "user" | "translator" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  accountType: AccountType;
  role: UserRole;
  bookmarks: string[];
  readingHistory: ReadingHistory[];
  createdAt: Date;
  updatedAt: Date;
  membershipStartDate?: Date;
  membershipEndDate?: Date;
}

export interface ReadingHistory {
  mangaId: string;
  chapterId: string;
  pageNumber: number;
  lastRead: Date;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  hasMembership: boolean;
  isAdmin: boolean;
  isTranslator: boolean;
}
