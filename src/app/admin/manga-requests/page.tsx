"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { MangaRequest } from "@/types/mangaRequest";
import {
  BookPlus,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Edit,
} from "lucide-react";

export default function AdminMangaRequestsPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MangaRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<MangaRequest | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    // Real-time listener for all manga requests
    const q = query(
      collection(db, "mangaRequests"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as MangaRequest;
      });
      setRequests(requestsData);
      setLoadingRequests(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.mangaTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.author?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: "approved" | "rejected",
    notes?: string
  ) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, "mangaRequests", requestId), {
        status: newStatus,
        adminNotes: notes || "",
        updatedAt: Timestamp.now(),
      });
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (requestId: string, title: string) => {
    if (!confirm(`Delete request for "${title}"?`)) return;

    try {
      await deleteDoc(doc(db, "mangaRequests", requestId));
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request");
    }
  };

  const openModal = (request: MangaRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setShowModal(true);
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

  if (!user || !isAdmin) {
    return null;
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <BookPlus className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            <h1 className="text-2xl sm:text-3xl font-bold">Manga Requests</h1>
          </div>
          <p className="text-sm sm:text-base text-zinc-400">
            Manage user manga requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-zinc-400 mb-1">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-zinc-400 mb-1">Pending</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-500">
              {stats.pending}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-zinc-400 mb-1">Approved</p>
            <p className="text-xl sm:text-2xl font-bold text-green-500">
              {stats.approved}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-zinc-400 mb-1">Rejected</p>
            <p className="text-xl sm:text-2xl font-bold text-red-500">
              {stats.rejected}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by manga, user, or author..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm sm:text-base"
              />
            </div>
            <div>
              <select
                title="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 sm:py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                    Manga Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                    Author/Genre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredRequests
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((request) => (
                    <tr key={request.id} className="hover:bg-zinc-800/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">
                          {request.mangaTitle}
                        </p>
                        {request.description && (
                          <p className="text-sm text-zinc-400 line-clamp-1 mt-1">
                            {request.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{request.userName}</p>
                        <p className="text-sm text-zinc-400">
                          {request.userEmail}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {request.author && (
                          <p className="text-sm">Author: {request.author}</p>
                        )}
                        {request.genre && (
                          <p className="text-sm">Genre: {request.genre}</p>
                        )}
                        {!request.author && !request.genre && (
                          <p className="text-sm text-zinc-500">-</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {request.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(request)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                            title="Edit/Update"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(request.id, "approved")
                                }
                                className="p-2 bg-green-600 hover:bg-green-700 rounded transition"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(request.id, "rejected")
                                }
                                className="p-2 bg-red-600 hover:bg-red-700 rounded transition"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              handleDelete(request.id, request.mangaTitle)
                            }
                            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-zinc-800">
            {filteredRequests
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((request) => (
                <div key={request.id} className="p-4 hover:bg-zinc-800/50">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1">
                        {request.mangaTitle}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {request.userName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {request.userEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>

                  {(request.author || request.genre) && (
                    <div className="text-sm text-zinc-400 mb-2">
                      {request.author && <p>Author: {request.author}</p>}
                      {request.genre && <p>Genre: {request.genre}</p>}
                    </div>
                  )}

                  {request.description && (
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                      {request.description}
                    </p>
                  )}

                  <p className="text-xs text-zinc-500 mb-3">
                    {request.createdAt.toLocaleDateString()}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openModal(request)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs transition flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    {request.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(request.id, "approved")
                          }
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(request.id, "rejected")
                          }
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs transition flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() =>
                        handleDelete(request.id, request.mangaTitle)
                      }
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="p-8 sm:p-12 text-center">
              <BookPlus className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No requests found</p>
            </div>
          )}

          {filteredRequests.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredRequests.length}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Update Request</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-zinc-400">Manga Title:</p>
                <p className="font-semibold">{selectedRequest.mangaTitle}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Requested by:</p>
                <p className="font-semibold">{selectedRequest.userName}</p>
                <p className="text-sm text-zinc-500">
                  {selectedRequest.userEmail}
                </p>
              </div>
              {selectedRequest.author && (
                <div>
                  <p className="text-sm text-zinc-400">Author:</p>
                  <p>{selectedRequest.author}</p>
                </div>
              )}
              {selectedRequest.genre && (
                <div>
                  <p className="text-sm text-zinc-400">Genre:</p>
                  <p>{selectedRequest.genre}</p>
                </div>
              )}
              {selectedRequest.description && (
                <div>
                  <p className="text-sm text-zinc-400">Description:</p>
                  <p className="text-zinc-300">{selectedRequest.description}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for the user (optional)"
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  handleUpdateStatus(selectedRequest.id, "approved", adminNotes)
                }
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() =>
                  handleUpdateStatus(selectedRequest.id, "rejected", adminNotes)
                }
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setAdminNotes("");
                }}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
