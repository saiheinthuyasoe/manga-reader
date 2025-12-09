# Firestore Indexes Setup

## Required Indexes

The transaction, purchase history, and manga request features require composite indexes in Firestore.

### Method 1: Automatic Creation (Recommended)

1. Try to access the transaction history page at `/transactions`
2. Open the browser console - you'll see an error with a link to create the index
3. Click the link to automatically create the index in Firebase Console
4. Repeat for purchase history at `/purchases`
5. Repeat for manga requests at `/request-manga`
6. Wait 1-2 minutes for indexes to build

### Method 2: Manual Creation via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** > **Indexes** tab
4. Click **Create Index**

#### Index 1: Coin Transactions (User View)

- Collection ID: `coinTransactions`
- Fields to index:
  - `userId` - Ascending
  - `createdAt` - Descending
- Query scope: Collection

#### Index 2: Coin Transactions (Admin View)

- Collection ID: `coinTransactions`
- Fields to index:
  - `createdAt` - Descending
- Query scope: Collection
- Note: This is a single-field index for admin to view all transactions

#### Index 3: Purchase History

- Collection ID: `purchaseHistory`
- Fields to index:
  - `userId` - Ascending
  - `purchasedAt` - Descending
- Query scope: Collection

#### Index 4: Manga Requests (User View)

- Collection ID: `mangaRequests`
- Fields to index:
  - `userId` - Ascending
  - `createdAt` - Descending
- Query scope: Collection

#### Index 5: Manga Requests (Admin View)

- Collection ID: `mangaRequests`
- Fields to index:
  - `createdAt` - Descending
- Query scope: Collection

### Method 3: Deploy via Firebase CLI

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:indexes
```

This will deploy the indexes defined in `firestore.indexes.json`.

## Verification

Once indexes are created and built (status: Enabled), the following features will work:

- User transaction history (`/transactions`)
- User purchase history (`/purchases`)
- User manga requests (`/request-manga`)
- Admin transaction history (`/admin/transactions`)
- Admin manga requests (`/admin/manga-requests`)

## Troubleshooting

**Error: "The query requires an index"**

- Follow Method 1 above - the error message contains a direct link to create the index

**Indexes stuck in "Building" state**

- This is normal for new indexes
- Wait 1-2 minutes for small datasets
- Larger datasets may take longer

**Still not working after creating indexes**

- Clear browser cache and reload
- Check Firebase Console to ensure index status is "Enabled"
- Verify the field names match exactly (case-sensitive)
