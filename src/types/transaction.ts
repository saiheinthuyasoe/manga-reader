export type TransactionType =
  | "purchase"
  | "gift"
  | "refund"
  | "admin_add"
  | "admin_deduct";

export interface CoinTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // Positive for credits, negative for debits
  balance: number; // Balance after transaction
  description: string;
  chapterId?: string; // If it's a chapter purchase
  mangaId?: string; // Related manga
  adminId?: string; // Admin who performed the transaction
  createdAt: Date;
}

export interface PurchaseHistory {
  id: string;
  userId: string;
  chapterId: string;
  mangaId: string;
  mangaTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  coinPrice: number;
  purchasedAt: Date;
}
