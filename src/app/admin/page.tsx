"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import {
  Shield,
  Users,
  Search,
  Crown,
  UserX,
  CheckCircle,
  BookOpen,
  History,
} from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateUserAccountType } from "@/lib/auth";
import { UserProfile } from "@/types/user";

export default function AdminPage() {
  const { user, loading, isAdmin, isTranslator } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isTranslator))) {
      router.push("/");
    }
  }, [user, loading, isAdmin, isTranslator, router]);

  useEffect(() => {
    if (user && (isAdmin || isTranslator)) {
      fetchUsers();
    }
  }, [user, isAdmin, isTranslator]);

  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const usersList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          uid: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          membershipStartDate: data.membershipStartDate?.toDate(),
          membershipEndDate: data.membershipEndDate?.toDate(),
        } as UserProfile;
      });

      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateAccountType = async (
    targetUserId: string,
    accountType: "free" | "membership"
  ) => {
    if (!user) return;

    setProcessingUser(targetUserId);
    try {
      // Update to membership with 365 days duration (1 year)
      await updateUserAccountType(
        user.uid,
        targetUserId,
        accountType,
        accountType === "membership" ? 365 : undefined
      );

      // Refresh users list
      await fetchUsers();

      alert(`Account updated to ${accountType} successfully!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to update account: ${message}`);
    } finally {
      setProcessingUser(null);
    }
  };

  if (loading || loadingUsers) {
    return <Loading />;
  }

  if (!user || (!isAdmin && !isTranslator)) {
    return null;
  }

  const stats = {
    total: users.length,
    members: users.filter((u) => u.accountType === "membership").length,
    free: users.filter((u) => u.accountType === "free").length,
  };

  return (
    <div className="min-h-screen bg-black pt-16 pb-28 md:pb-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Dashboard
            </h1>
          </div>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">
            Welcome back! Here&apos;s an overview of your platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs sm:text-sm">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">
                  {stats.total}
                </p>
              </div>
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs sm:text-sm">Members</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-500 mt-1 sm:mt-2">
                  {stats.members}
                </p>
              </div>
              <Crown className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs sm:text-sm">Free Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-zinc-400 mt-1 sm:mt-2">
                  {stats.free}
                </p>
              </div>
              <UserX className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-500" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        {isAdmin && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-800">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                Manage Users
              </h2>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-sm sm:text-base rounded-lg py-2 sm:py-3 pl-9 sm:pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Account Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredUsers
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((u) => (
                      <tr key={u.uid} className="hover:bg-zinc-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {u.displayName}
                              </p>
                              {u.role === "admin" && (
                                <span className="text-xs text-purple-400">
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">{u.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              u.accountType === "membership"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-zinc-700 text-zinc-400"
                            }`}
                          >
                            {u.accountType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {u.uid !== user.uid && (
                            <div className="flex gap-2">
                              {u.accountType === "free" ? (
                                <button
                                  onClick={() =>
                                    handleUpdateAccountType(u.uid, "membership")
                                  }
                                  disabled={processingUser === u.uid}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 text-white rounded text-sm font-medium transition flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Upgrade
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleUpdateAccountType(u.uid, "free")
                                  }
                                  disabled={processingUser === u.uid}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white rounded text-sm font-medium transition flex items-center gap-1"
                                >
                                  <UserX className="w-4 h-4" />
                                  Downgrade
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-zinc-800">
              {filteredUsers
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((u) => (
                  <div key={u.uid} className="p-4 hover:bg-zinc-800/50">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">
                            {u.displayName}
                          </p>
                          {u.role === "admin" && (
                            <span className="text-xs text-purple-400 flex-shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-sm truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.accountType === "membership"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {u.accountType}
                      </span>
                      <span className="text-zinc-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {u.uid !== user.uid && (
                      <div className="flex gap-2">
                        {u.accountType === "free" ? (
                          <button
                            onClick={() =>
                              handleUpdateAccountType(u.uid, "membership")
                            }
                            disabled={processingUser === u.uid}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 text-white rounded text-sm font-medium transition flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Upgrade
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleUpdateAccountType(u.uid, "free")
                            }
                            disabled={processingUser === u.uid}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white rounded text-sm font-medium transition flex items-center justify-center gap-1"
                          >
                            <UserX className="w-4 h-4" />
                            Downgrade
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredUsers.length}
            />

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
