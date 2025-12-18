export interface MemberBuyRequest {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  price: number;
  duration: string;
  email: string;
  receiptUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}
