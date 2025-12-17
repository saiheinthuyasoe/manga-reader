"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { MangaRequest } from "@/types/mangaRequest";
import { BookPlus, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import Pagination from "@/components/Pagination";

export default function RequestMangaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mangaTitle, setMangaTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<MangaRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for user's requests
    const q = query(
      collection(db, "mangaRequests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as MangaRequest;
      });
      setMyRequests(requests);
      setLoadingRequests(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mangaTitle.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "mangaRequests"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        mangaTitle: mangaTitle.trim(),
        author: author.trim() || "",
        description: description.trim() || "",
        genre: genre.trim() || "",
        status: "pending",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Clear form
      setMangaTitle("");
      setAuthor("");
      setDescription("");
      setGenre("");

      alert("Request submitted successfully!");
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-500";
      case "rejected":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-yellow-500/20 text-yellow-500";
    }
  };

  if (loading || loadingRequests) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  // Pagination logic for My Requests
  const paginatedMyRequests = myRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <BookPlus className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            <h1 className="text-2xl sm:text-3xl font-bold">Request Manga</h1>
          </div>
          <p className="text-sm sm:text-base text-zinc-400">
            Can&apos;t find a manga you&apos;re looking for? Request it here!
          </p>
        </div>

        {/* Request Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
            Submit New Request
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Manga Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={mangaTitle}
                onChange={(e) => setMangaTitle(e.target.value)}
                placeholder="Enter manga title"
                required
                className="w-full px-4 py-2 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name (optional)"
                className="w-full px-4 py-2 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Action, Romance, Fantasy (optional)"
                className="w-full px-4 py-2 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Information
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional details about the manga (optional)"
                rows={4}
                className="w-full px-4 py-2 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm sm:text-base resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !mangaTitle.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
            >
              <Send className="w-5 h-5" />
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>

        {/* My Requests */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-zinc-800">
            <h2 className="text-lg sm:text-xl font-semibold">My Requests</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Track the status of your manga requests
            </p>
          </div>

          {myRequests.length > 0 ? (
            <>
              <div className="divide-y divide-zinc-800">
                {paginatedMyRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 sm:p-6 hover:bg-zinc-800/50"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg mb-1">
                          {request.mangaTitle}
                        </h3>
                        {request.author && (
                          <p className="text-sm text-zinc-400">
                            Author: {request.author}
                          </p>
                        )}
                        {request.genre && (
                          <p className="text-sm text-zinc-400">
                            Genre: {request.genre}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {request.description && (
                      <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                        {request.description}
                      </p>
                    )}

                    {request.adminNotes && (
                      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-zinc-400 mb-1">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-white">
                          {request.adminNotes}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-zinc-500">
                      Submitted: {request.createdAt.toLocaleDateString()} at{" "}
                      {request.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
              {/* Pagination for My Requests */}
              {myRequests.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(myRequests.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={myRequests.length}
                />
              )}
            </>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <BookPlus className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No requests yet</p>
              <p className="text-sm text-zinc-500 mt-1">
                Submit your first manga request above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
