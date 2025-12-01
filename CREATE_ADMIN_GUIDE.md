# How to Create Admin Account Manually

## **Method 1: Register First, Then Upgrade in Firestore (Recommended)**

### Step 1: Register a Normal Account

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/register`
3. Create an account with your details (this will be your admin account)
4. The account will be created with `accountType: 'free'` and `role: 'user'`

### Step 2: Upgrade to Admin in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left menu
4. Navigate to the `users` collection
5. Find your user document (it will have your email)
6. Click on the document to edit it
7. Update these two fields:
   - `role`: Change from `"user"` to `"admin"`
   - `accountType`: Change from `"free"` to `"membership"`
8. Click **Update**

### Step 3: Login

1. Go to `http://localhost:3000/login`
2. Login with your credentials
3. You should now see:
   - Crown icon next to your name in the navbar
   - "Admin Dashboard" link in the user menu
4. Click on your profile or go to `/admin` to access the admin dashboard

---

## **Method 2: Create Admin Directly via Firebase Console**

If you prefer to create the admin account directly in Firestore without registering:

### Step 1: Create User in Firebase Authentication

1. Go to Firebase Console → **Authentication**
2. Click **Add user**
3. Enter email and password
4. Copy the **User UID** (you'll need this)

### Step 2: Create User Document in Firestore

1. Go to **Firestore Database**
2. Click **Start collection** (if you don't have a `users` collection yet)
3. Collection ID: `users`
4. Document ID: Paste the **User UID** from Step 1
5. Add these fields:

```javascript
{
  uid: "paste-your-user-uid-here",
  email: "admin@example.com",
  displayName: "Admin User",
  accountType: "membership",
  role: "admin",
  bookmarks: [], // string array
  readingHistory: [], // map array
  createdAt: [Click "+" → Timestamp → Now],
  updatedAt: [Click "+" → Timestamp → Now]
}
```

6. Click **Save**

### Step 3: Login

- Go to your app and login with the email/password you set

---

## **Method 3: Quick Script (Advanced)**

Create a file `scripts/create-admin.js`:

```javascript
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

// Your Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "admin@example.com",
      "admin123456" // Change this!
    );

    // Create Firestore profile
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: "admin@example.com",
      displayName: "Admin User",
      accountType: "membership",
      role: "admin",
      bookmarks: [],
      readingHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Admin account created successfully!");
    console.log("Email: admin@example.com");
    console.log("Password: admin123456");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
```

Run: `node scripts/create-admin.js`

---

## **Verify Admin Access**

After creating your admin account, verify it works:

1. ✅ Login at `/login`
2. ✅ Check navbar - you should see a crown icon
3. ✅ Click your name - "Admin Dashboard" option should appear
4. ✅ Go to `/admin` - you should see the admin dashboard
5. ✅ Try upgrading a test user's account

---

## **Important Notes**

- **Security**: Always use strong passwords for admin accounts
- **Firestore Rules**: Make sure to set up proper security rules (see AUTH_SETUP.md)
- **First Admin**: You need to create the first admin manually using one of these methods
- **Additional Admins**: Once you have one admin, they can upgrade other users via the admin dashboard

**That's it!** Your admin account is ready to manage user memberships. 🎉
