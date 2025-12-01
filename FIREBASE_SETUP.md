# Manga Reader - Firebase Data Structure

This document outlines how to structure your data in Firebase Firestore for the Manga Reader application.

## Sample Data Upload Script

You can use this Node.js script to populate your Firestore with sample data:

```javascript
// scripts/uploadSampleData.js
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// Your Firebase config
const firebaseConfig = {
  // ... your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleMangas = [
  {
    title: "One Piece",
    alternativeTitles: ["ワンピース"],
    description:
      "Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the king of all pirates.",
    coverImage: "https://example.com/onepiece-cover.jpg",
    bannerImage: "https://example.com/onepiece-banner.jpg",
    author: "Eiichiro Oda",
    artist: "Eiichiro Oda",
    status: "ongoing",
    genres: ["Action", "Adventure", "Comedy", "Fantasy", "Shounen"],
    rating: 9.2,
    views: 1500000,
    chapters: [
      {
        id: "1",
        number: 1095,
        title: "The Adventure Continues",
        pages: [
          "https://example.com/op-1095-page1.jpg",
          "https://example.com/op-1095-page2.jpg",
          // ... more pages
        ],
        publishedAt: new Date(),
        views: 50000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Add more manga objects
];

async function uploadSampleData() {
  try {
    for (const manga of sampleMangas) {
      await addDoc(collection(db, "mangas"), manga);
      console.log(`Added: ${manga.title}`);
    }
    console.log("Sample data uploaded successfully!");
  } catch (error) {
    console.error("Error uploading data:", error);
  }
}

uploadSampleData();
```

## Running the Upload Script

1. Create a `scripts` folder in your project root
2. Save the script as `uploadSampleData.js`
3. Install Firebase Admin SDK: `npm install firebase-admin`
4. Run: `node scripts/uploadSampleData.js`

## Manual Data Entry

You can also manually add data through the Firebase Console:

1. Go to Firebase Console > Firestore Database
2. Click "Start collection"
3. Collection ID: `mangas`
4. Add documents with the structure shown above

## Image Storage

For storing manga images:

1. Use Firebase Storage
2. Structure: `/manga-images/{mangaId}/cover.jpg`
3. Chapter pages: `/manga-images/{mangaId}/chapters/{chapterId}/page-{number}.jpg`

## Indexes

Create these composite indexes in Firestore for better query performance:

1. Collection: `mangas`
   - Fields: `views` (Descending), `__name__` (Descending)
2. Collection: `mangas`

   - Fields: `updatedAt` (Descending), `__name__` (Descending)

3. Collection: `mangas`
   - Fields: `rating` (Descending), `__name__` (Descending)

## Security Considerations

- Never expose your Firebase config publicly if you have write permissions enabled
- Use Firebase Security Rules to protect your data
- For production, implement proper authentication and authorization
