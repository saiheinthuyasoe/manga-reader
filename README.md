# Manga Reader

A modern manga reader web application built with Next.js 16 and Firebase, inspired by MangaReader.to.

## Features

- 📚 Browse thousands of manga titles
- 🔥 Trending and popular manga sections
- 🎨 Beautiful, responsive UI with dark theme
- 📖 Smooth reading experience with page navigation
- 🔖 Bookmark your favorite manga (coming soon)
- 👤 User authentication with Firebase (coming soon)
- 🔍 Search and filter manga by genres
- 📱 Mobile-friendly design

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
   - Enable Authentication (optional)
   - Enable Storage (for manga images)
   - Copy your Firebase config

4. Create a `.env.local` file in the root directory and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
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
    - chapters: Chapter[]
    - createdAt: timestamp
    - updatedAt: timestamp

users/
  {userId}/
    - email: string
    - displayName: string
    - photoURL: string (optional)
    - bookmarks: string[]
    - readingHistory: ReadingHistory[]
    - createdAt: timestamp
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
│   ├── manga/[id]/        # Manga detail page
│   ├── read/[mangaId]/[chapterId]/  # Reading page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── MangaCard.tsx      # Manga card component
│   ├── Navbar.tsx         # Navigation bar
│   ├── Footer.tsx         # Footer component
│   └── Loading.tsx        # Loading component
├── lib/
│   ├── firebase.ts        # Firebase configuration
│   └── db.ts              # Database helper functions
└── types/
    └── manga.ts           # TypeScript interfaces
```

## Features to Implement

- [ ] User authentication (Sign up, Sign in, Profile)
- [ ] Bookmark functionality
- [ ] Reading history tracking
- [ ] Comments and ratings
- [ ] Advanced search with filters
- [ ] Admin panel for managing manga
- [ ] Reading progress sync across devices
- [ ] Dark/Light theme toggle
- [ ] Multiple reading modes (single page, double page, continuous scroll)
- [ ] Keyboard shortcuts for navigation
- [ ] Offline reading support (PWA)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is for educational purposes only.

## Acknowledgments

- Inspired by [MangaReader.to](https://mangareader.to/)
- Built with [Next.js](https://nextjs.org/)
- Powered by [Firebase](https://firebase.google.com/)
