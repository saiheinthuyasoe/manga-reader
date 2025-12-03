# Authentication & Membership System - Setup Guide

## Overview

The manga reader now has a complete authentication system with membership-based access control.

## User Flow

### 1. Registration

- Users can register at `/register`
- New accounts are created with `accountType: 'free'` by default
- Free users can:
  - Browse all manga
  - View manga details
  - Bookmark manga (if implemented)
  - View their profile

### 2. Membership Requirement

- **Free users CANNOT read chapters**
- Only users with `accountType: 'membership'` can access the reader
- When free users try to read, they see a membership required screen

### 3. Admin Upgrade Process

- Admins can access the dashboard at `/admin`
- The dashboard shows all users with their account types
- Admins can:
  - Upgrade free users to membership (1 year duration by default)
  - Downgrade membership users back to free
  - Search and filter users

## Firestore Setup

### Create Initial Admin User

After a user registers, you need to manually set them as admin in Firestore:

1. Go to Firebase Console → Firestore Database
2. Find the user document in the `users` collection
3. Edit the document and set:
   ```json
   {
     "role": "admin",
     "accountType": "membership"
   }
   ```

### Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Manga - Read access for all, write for admins only
    match /mangas/{mangaId} {
      allow read: if true;
      allow write: if request.auth != null &&
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users - Users can read/update their own profile
    // Admins can read all profiles and update account types
    match /users/{userId} {
      allow read: if request.auth != null &&
                  (request.auth.uid == userId ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

      allow create: if request.auth != null && request.auth.uid == userId;

      allow update: if request.auth != null &&
                    (request.auth.uid == userId ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

## Features Implemented

### Authentication

- ✅ User registration with email/password
- ✅ User login
- ✅ User logout
- ✅ Protected routes
- ✅ Auth context with hooks

### Authorization

- ✅ Role-based access (user/admin)
- ✅ Membership-based reading access
- ✅ Admin dashboard for user management
- ✅ Account type management (free/membership)

### Pages

- ✅ `/register` - Registration page
- ✅ `/login` - Login page
- ✅ `/profile` - User profile page
- ✅ `/admin` - Admin dashboard (admin only)
- ✅ `/read/[mangaId]/[chapterId]` - Reader (membership required)

### Components

- ✅ Navbar with auth state
- ✅ User menu dropdown
- ✅ Membership badges
- ✅ Protected reader component

## Testing the System

1. **Register a new account**

   - Go to `/register`
   - Create an account
   - You'll have a free account

2. **Try to read (should be blocked)**

   - Browse to any manga detail page
   - Click "Read Now"
   - You'll see "Membership Required" screen

3. **Make yourself admin** (manually in Firestore)

   - Go to Firebase Console
   - Edit your user document
   - Set `role: "admin"` and `accountType: "membership"`

4. **Access admin dashboard**

   - Go to `/admin`
   - You'll see all registered users
   - You can now upgrade/downgrade user accounts

5. **Test membership features**
   - Create another test account
   - Use admin dashboard to upgrade it
   - Login with that account
   - You can now read chapters!

## Environment Variables

Make sure your `.env.local` has all Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## User Data Structure

```typescript
{
  uid: string;
  email: string;
  displayName: string;
  accountType: 'free' | 'membership';
  role: 'user' | 'admin';
  bookmarks: string[];
  readingHistory: ReadingHistory[];
  createdAt: Date;
  updatedAt: Date;
  membershipStartDate?: Date;
  membershipEndDate?: Date; // Optional, if not set = lifetime membership
}
```

## Next Steps

1. Set up Firebase Authentication in Firebase Console
2. Enable Email/Password authentication
3. Configure Firestore security rules
4. Create your first admin user
5. Test the complete flow!
