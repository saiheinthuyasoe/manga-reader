export interface CoinBuyRequest {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  coins: number;
  price: number;
  email: string;
  receiptUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}
