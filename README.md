# Manga Reader

A modern manga reader web application built with Next.js 16 and Firebase, inspired by MangaReader.to.

## Features

- 📚 Browse thousands of manga titles with search and filters
- 🔥 Trending and popular manga sections
- 🎨 Beautiful, responsive UI with dark theme
- 📖 Smooth reading experience with custom zoom and scroll modes
- 🔖 Bookmark your favorite manga
- 👤 User authentication (Email/Password & Google OAuth)
- 🔍 Advanced search functionality
- 📱 Mobile-friendly design
- 📅 Reading history tracking with chapter progress
- 👨‍💼 Admin panel for manga and chapter management
- 🔐 Role-based access control (Free/Membership accounts)
- 🔑 Password management and Google account linking

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project set up

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd manga-reader
```

2. Install dependencies:

```bash
npm install
```

3. Set up Firebase:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication (Email/Password and Google providers)
   - Enable Storage (for manga images)
   - Copy your Firebase config

4. Create a `.env.local` file in the root directory and add your Firebase credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dou5xwcdi
NEXT_PUBLIC_CLOUDINARY_API_KEY=468266952986462
CLOUDINARY_API_KEY=468266952986462
CLOUDINARY_API_SECRET=exjJ_IraAlGlZDDLf7QftzOzzdA

```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

### Firestore Database Structure

```
mangas/
  {mangaId}/
    - title: string
    - description: string
    - coverImage: string
    - bannerImage: string (optional)
    - author: string
    - artist: string (optional)
    - status: 'ongoing' | 'completed' | 'hiatus'
    - genres: string[]
    - rating: number
    - views: number
    - chapters: number
    - createdAt: timestamp
    - updatedAt: timestamp

  {mangaId}/chapters/
    {chapterId}/
      - chapterNumber: number
      - title: string
      - pages: string[]
      - publishedAt: timestamp
      - createdAt: timestamp
      - updatedAt: timestamp

users/
  {userId}/
    - email: string
    - displayName: string
    - photoURL: string (optional)
    - accountType: 'free' | 'membership'
    - role: 'user' | 'admin'
    - bookmarks: string[]
    - readingHistory: ReadingHistory[]
    - createdAt: timestamp
    - updatedAt: timestamp
    - membershipStartDate: timestamp (optional)
    - membershipEndDate: timestamp (optional)
```

### Firestore Security Rules (Example)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all manga
    match /mangas/{mangaId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Project Structure

```
src/
├── app/
│   ├── admin/                    # Admin panel
│   │   └── manga/[id]/
│   │       ├── edit/            # Edit manga
│   │       └── chapters/        # Manage chapters
│   ├── browse/                  # Browse page with search & filters
│   ├── manga/[id]/              # Manga detail page
│   ├── read/[mangaId]/[chapterId]/  # Reading page with zoom/scroll modes
│   ├── profile/                 # User profile & password management
│   ├── login/                   # Login page (Email & Google OAuth)
│   ├── register/                # Registration page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── MangaCard.tsx            # Manga card component
│   ├── Navbar.tsx               # Navigation bar with search
│   ├── Footer.tsx               # Footer component
│   └── ProtectedRoute.tsx       # Authentication guard
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── lib/
│   ├── firebase.ts              # Firebase configuration
│   ├── auth.ts                  # Authentication helpers
│   └── db.ts                    # Database helper functions
└── types/
    ├── manga.ts                 # Manga TypeScript interfaces
    └── user.ts                  # User & Auth interfaces
```

## Authentication

### Email/Password Authentication

Users can create accounts using email and password. Password requirements:

- Minimum 6 characters
- Password change available in profile with re-authentication

### Google OAuth

Users can sign in with their Google account. Account linking features:

- If an email already exists with password authentication, users must sign in with password first
- Google accounts automatically create user profiles
- Seamless account linking for existing users

## User Roles & Permissions

### Free Account

- Browse all manga
- View manga details
- Search and filter manga
- Cannot read chapters

### Membership Account

- All free account features
- Read all manga chapters
- Bookmark manga
- Track reading history

### Admin Account

- All membership features
- Add/Edit/Delete manga
- Manage chapters
- Upload manga pages
- Set publish dates for chapters

## Features Implemented

- ✅ User authentication (Email/Password & Google OAuth)
- ✅ Bookmark functionality
- ✅ Reading history tracking with chapter progress
- ✅ Advanced search with URL parameters
- ✅ Admin panel for managing manga and chapters
- ✅ Role-based access control
- ✅ Password management
- ✅ Custom reading modes (zoom controls, page navigation)
- ✅ Firebase Timestamp handling across all pages
- ✅ Manual publish date setting for chapters

## Features to Implement

- [ ] Comments and ratings
- [ ] Dark/Light theme toggle
- [ ] Multiple reading modes (double page, continuous scroll)
- [ ] Keyboard shortcuts for navigation
- [ ] Offline reading support (PWA)
- [ ] Reading progress sync across devices
- [ ] Email notifications for new chapters
- [ ] User account linking/unlinking management in profile

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is for educational purposes only.

## Acknowledgments

- Inspired by [MangaReader.to](https://mangareader.to/)
- Built with [Next.js](https://nextjs.org/)
- Powered by [Firebase](https://firebase.google.com/)
