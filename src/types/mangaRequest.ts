export interface MangaRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mangaTitle: string;
  author?: string;
  description?: string;
  genre?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
}
