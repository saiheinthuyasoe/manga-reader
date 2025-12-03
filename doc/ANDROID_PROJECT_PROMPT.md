# Manga Reader Android App - Project Prompt

## Project Overview

Build a native Android manga reader application that integrates with the existing Firebase backend. The app should provide a seamless manga reading experience with authentication, bookmarks, reading history, and admin capabilities.

## Core Requirements

### 1. Technology Stack

- **Language**: Kotlin
- **Minimum SDK**: API 24 (Android 8.0)
- **Target SDK**: API 34 (Android 14)
- **Architecture**: MVVM (Model-View-ViewModel)
- **Backend**: Firebase (existing web app backend)
  - Firebase Authentication (Email/Password & Google Sign-In)
  - Cloud Firestore
  - Firebase Storage
- **Image Loading**: Coil or Glide
- **Dependency Injection**: Hilt
- **Networking**: Firebase SDK
- **Async**: Kotlin Coroutines + Flow
- **Navigation**: Jetpack Navigation Component

### 2. Firebase Integration

#### Firestore Database Structure

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
      - pages: string[] (Firebase Storage URLs)
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
    - bookmarks: string[] (manga IDs)
    - readingHistory: ReadingHistory[]
    - createdAt: timestamp
    - updatedAt: timestamp
    - membershipStartDate: timestamp (optional)
    - membershipEndDate: timestamp (optional)

ReadingHistory:
  - mangaId: string
  - chapterId: string
  - pageNumber: number
  - lastRead: timestamp
```

#### Firebase Configuration

Use the same Firebase project as the web app. Required environment variables:

- API Key
- Project ID
- Storage Bucket
- App ID
- Auth Domain

### 3. User Authentication

#### Sign In Methods

1. **Email/Password**

   - Registration with display name
   - Login
   - Password requirements: minimum 6 characters
   - Password change with re-authentication

2. **Google OAuth**
   - Google Sign-In integration
   - Account linking for existing email accounts
   - Auto-create user profile in Firestore

#### User Roles

1. **Free Account**

   - Browse all manga
   - View manga details
   - Search and filter
   - Cannot read chapters

2. **Membership Account**

   - All free features
   - Read all chapters
   - Bookmark manga
   - Track reading history

3. **Admin Account**
   - All membership features
   - Add/Edit/Delete manga
   - Manage chapters
   - Upload manga pages
   - Set chapter publish dates

### 4. Core Features

#### Home Screen

- Display sections:
  - Continue Reading (from reading history)
  - Trending Manga
  - Recently Updated
  - Popular Manga
- Bottom Navigation: Home, Browse, Bookmarks, Profile
- Search bar in toolbar

#### Browse Screen

- Search functionality
- Genre filters (multi-select chips)
- Status filter (ongoing, completed, hiatus)
- Sort options (title, rating, views, updated date)
- Grid/List view toggle
- Infinite scroll pagination

#### Manga Detail Screen

- Display:
  - Cover image and banner
  - Title, author, artist
  - Rating, views, status
  - Genres (chips)
  - Description
  - Chapter list (sorted by chapter number)
- Actions:
  - Bookmark button (heart icon)
  - Continue reading button
  - Share button
- Chapter list shows:
  - Chapter number and title
  - Published date
  - Read status indicator
  - Lock icon for free accounts

#### Reading Screen

- Image viewer features:
  - Vertical scroll or horizontal paging (user preference)
  - Pinch to zoom
  - Double-tap to zoom
  - Page indicator (e.g., "5/24")
  - Auto-save reading progress
- Top toolbar (auto-hide):
  - Back button
  - Manga title
  - Chapter title
- Bottom toolbar (auto-hide):
  - Previous chapter button
  - Page slider
  - Next chapter button
  - Settings button
- Reading settings:
  - Reading mode (vertical/horizontal)
  - Brightness control
  - Keep screen on toggle
- Save reading history on page change

#### Bookmarks Screen

- Grid view of bookmarked manga
- Sort options (recent, title, updated)
- Remove bookmark option
- Empty state message

#### Profile Screen

- Display user info:
  - Profile photo
  - Display name
  - Email
  - Account type badge
  - Role badge (if admin)
- Actions:
  - Edit profile (name, photo)
  - Change password
  - Link/Unlink Google account
  - Sign out
- Statistics (optional):
  - Total chapters read
  - Reading time
  - Bookmarks count

#### Admin Panel (Admin Only)

- Manga Management:
  - Add new manga (form with image upload)
  - Edit existing manga
  - Delete manga (with confirmation)
- Chapter Management:
  - Add new chapter
  - Upload chapter pages (multi-image picker)
  - Edit chapter details
  - Set publish date
  - Delete chapter

### 5. Data Models (Kotlin)

```kotlin
data class Manga(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val coverImage: String = "",
    val bannerImage: String? = null,
    val author: String = "",
    val artist: String? = null,
    val status: MangaStatus = MangaStatus.ONGOING,
    val genres: List<String> = emptyList(),
    val rating: Double = 0.0,
    val views: Long = 0,
    val chapters: Int = 0,
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)

enum class MangaStatus {
    ONGOING, COMPLETED, HIATUS
}

data class Chapter(
    val id: String = "",
    val chapterNumber: Int = 0,
    val title: String = "",
    val pages: List<String> = emptyList(),
    val publishedAt: Timestamp? = null,
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now()
)

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String? = null,
    val accountType: AccountType = AccountType.FREE,
    val role: UserRole = UserRole.USER,
    val bookmarks: List<String> = emptyList(),
    val readingHistory: List<ReadingHistory> = emptyList(),
    val createdAt: Timestamp = Timestamp.now(),
    val updatedAt: Timestamp = Timestamp.now(),
    val membershipStartDate: Timestamp? = null,
    val membershipEndDate: Timestamp? = null
)

enum class AccountType {
    FREE, MEMBERSHIP
}

enum class UserRole {
    USER, ADMIN
}

data class ReadingHistory(
    val mangaId: String = "",
    val chapterId: String = "",
    val pageNumber: Int = 0,
    val lastRead: Timestamp = Timestamp.now()
)
```

### 6. Repository Pattern

```kotlin
interface MangaRepository {
    suspend fun getMangaList(limit: Int = 20, lastDoc: DocumentSnapshot? = null): Flow<List<Manga>>
    suspend fun getMangaById(mangaId: String): Flow<Manga?>
    suspend fun searchManga(query: String): Flow<List<Manga>>
    suspend fun filterManga(genres: List<String>, status: MangaStatus?): Flow<List<Manga>>
    suspend fun getTrendingManga(): Flow<List<Manga>>
    suspend fun getChapters(mangaId: String): Flow<List<Chapter>>
    suspend fun getChapterById(mangaId: String, chapterId: String): Flow<Chapter?>
}

interface UserRepository {
    suspend fun getUserProfile(uid: String): Flow<UserProfile?>
    suspend fun createUserProfile(user: UserProfile): Result<Unit>
    suspend fun updateUserProfile(uid: String, updates: Map<String, Any>): Result<Unit>
    suspend fun addBookmark(uid: String, mangaId: String): Result<Unit>
    suspend fun removeBookmark(uid: String, mangaId: String): Result<Unit>
    suspend fun updateReadingHistory(uid: String, history: ReadingHistory): Result<Unit>
}

interface AuthRepository {
    suspend fun signInWithEmail(email: String, password: String): Result<UserProfile>
    suspend fun signUpWithEmail(email: String, password: String, displayName: String): Result<UserProfile>
    suspend fun signInWithGoogle(): Result<UserProfile>
    suspend fun changePassword(currentPassword: String, newPassword: String): Result<Unit>
    suspend fun signOut()
    fun getCurrentUser(): Flow<UserProfile?>
}
```

### 7. UI/UX Requirements

#### Design System

- **Theme**: Dark theme (primary), with option for light theme
- **Colors**:
  - Primary: Blue (#3B82F6)
  - Background: Black (#000000) / Dark Gray (#18181B)
  - Surface: Dark Gray (#27272A)
  - Text: White / Gray shades
  - Error: Red (#EF4444)
- **Typography**: Material Design type scale
- **Icons**: Material Icons
- **Components**: Material Design 3 components

#### Screen Layouts

- Material Design 3 guidelines
- Responsive layouts for different screen sizes
- Support for tablets (dual-pane layouts)
- Bottom sheets for filters and settings
- Snackbar for success/error messages
- Progress indicators for loading states
- Shimmer effect for content loading

### 8. Offline Support

- Cache manga lists using Room database
- Cache manga covers for offline browsing
- Store reading history locally and sync when online
- Download chapters for offline reading (optional feature)
- Show offline indicator when no network

### 9. Performance Optimization

- Image loading:
  - Use Coil/Glide with memory and disk caching
  - Load appropriate image sizes
  - Lazy loading for lists
- Pagination for large lists
- Debounce search queries
- Use ViewBinding or Compose for efficient UI updates
- Minimize Firestore reads with proper queries and caching

### 10. Security & Permissions

#### Required Permissions

- INTERNET (required)
- READ_MEDIA_IMAGES (for profile photo upload)
- WRITE_EXTERNAL_STORAGE (API < 29, for downloads)

#### Security Rules

- Validate user roles before showing admin features
- Check membership status before allowing chapter reading
- Secure Firebase Storage rules (same as web app)
- Implement proper Firestore security rules

### 11. Testing Requirements

- Unit tests for ViewModels and Repositories
- Integration tests for Firebase operations
- UI tests for critical user flows:
  - Sign in/Sign up
  - Browse and search manga
  - Read chapter
  - Bookmark manga
- Espresso for UI testing
- MockK for mocking dependencies

### 12. Build Configuration

```gradle
// App-level build.gradle.kts
android {
    namespace = "com.yourname.mangareader"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.yourname.mangareader"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(...)
        }
    }

    buildFeatures {
        viewBinding = true
        // Or use Compose:
        // compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-storage-ktx")
    implementation("com.google.android.gms:play-services-auth:20.7.0")

    // Jetpack
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.6")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.6")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-compiler:2.48")

    // Image Loading
    implementation("io.coil-kt:coil:2.5.0")

    // Material Design
    implementation("com.google.android.material:material:1.11.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Room (for offline caching)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
}
```

### 13. Firebase Setup Steps

1. Go to Firebase Console
2. Add Android app to existing project
3. Register package name: `com.yourname.mangareader`
4. Download `google-services.json`
5. Place in `app/` directory
6. Enable Google Sign-In in Authentication settings
7. Add SHA-1 fingerprint for Google Sign-In:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

### 14. App Architecture

```
app/
├── data/
│   ├── model/          # Data classes
│   ├── repository/     # Repository implementations
│   ├── remote/         # Firebase data sources
│   └── local/          # Room database
├── di/                 # Hilt modules
├── ui/
│   ├── home/          # Home screen
│   ├── browse/        # Browse screen
│   ├── detail/        # Manga detail
│   ├── reader/        # Reading screen
│   ├── bookmarks/     # Bookmarks screen
│   ├── profile/       # Profile screen
│   ├── auth/          # Login/Register
│   └── admin/         # Admin panel
├── util/              # Utility classes
└── MangaReaderApp.kt  # Application class
```

### 15. Additional Features (Optional)

- Push notifications for new chapters
- In-app manga recommendations
- Reading statistics and achievements
- Multiple language support
- Share manga/chapter links
- Report issues/feedback
- Chapter comments (if implemented on backend)
- Dark/Light/Auto theme toggle
- Custom color themes
- Widget for continue reading

### 16. Release Checklist

- [ ] ProGuard rules configured
- [ ] App signing configured
- [ ] Privacy policy added
- [ ] Play Store listing prepared
- [ ] Screenshots for all screen sizes
- [ ] App icon and feature graphic
- [ ] Beta testing completed
- [ ] Crashlytics integrated
- [ ] Analytics integrated (Firebase Analytics)
- [ ] App size optimized
- [ ] Performance tested on low-end devices

## Development Phases

### Phase 1: Foundation (Week 1-2)

- Project setup with Hilt
- Firebase integration
- Authentication (Email/Password & Google)
- User profile management
- Basic navigation structure

### Phase 2: Core Features (Week 3-4)

- Home screen with manga lists
- Browse/Search functionality
- Manga detail screen
- Bookmark system
- Reading history

### Phase 3: Reading Experience (Week 5)

- Reading screen with image viewer
- Reading modes (vertical/horizontal)
- Zoom controls
- Reading progress tracking
- Chapter navigation

### Phase 4: Admin Features (Week 6)

- Admin panel layout
- Add/Edit manga
- Chapter management
- Image upload to Firebase Storage

### Phase 5: Polish & Optimization (Week 7-8)

- Offline caching with Room
- Performance optimization
- UI/UX refinements
- Error handling
- Testing
- Bug fixes

### Phase 6: Release (Week 9)

- Beta testing
- Final testing
- Play Store submission
- Documentation

## Success Criteria

- App successfully connects to existing Firebase backend
- Users can sign in with email/password and Google
- Free users can browse but not read chapters
- Membership users can read all chapters
- Admin users can manage manga and chapters
- Reading progress is saved and synced
- Bookmarks work correctly
- App works offline for browsing cached content
- Smooth reading experience with zoom controls
- App passes Google Play Store requirements

## Notes

- Reuse existing Firebase project from web app
- Maintain data consistency between web and mobile apps
- Follow Android best practices and Material Design guidelines
- Ensure backward compatibility with older Android versions
- Optimize for battery usage and data consumption
- Consider using Jetpack Compose for modern UI (optional)
