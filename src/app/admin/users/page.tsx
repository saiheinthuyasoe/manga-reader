"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/types/user";
import { Users, Crown, Calendar, X } from "lucide-react";

export default function ManageUsersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [membershipDays, setMembershipDays] = useState(30);
  const [isPermanent, setIsPermanent] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            membershipStartDate: data.membershipStartDate?.toDate(),
            membershipEndDate: data.membershipEndDate?.toDate(),
          } as UserProfile;
        });
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const openMembershipModal = (selectedUser: UserProfile) => {
    setSelectedUser(selectedUser);
    setShowModal(true);
    setMembershipDays(30);
    setIsPermanent(false);
  };

  const handleGrantMembership = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const updates: any = {
        accountType: "membership",
        membershipStartDate: new Date(),
        updatedAt: new Date(),
      };

      if (isPermanent) {
        updates.membershipEndDate = null;
      } else {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + membershipDays);
        updates.membershipEndDate = endDate;
      }

      await updateDoc(doc(db, "users", selectedUser.uid), updates);

      // Update local state
      setUsers(
        users.map((u) =>
          u.uid === selectedUser.uid
            ? {
                ...u,
                accountType: "membership",
                membershipStartDate: updates.membershipStartDate,
                membershipEndDate: updates.membershipEndDate,
              }
            : u
        )
      );

      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error granting membership:", error);
      alert("Failed to grant membership");
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeMembership = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke this membership?")) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        accountType: "free",
        membershipEndDate: null,
        membershipStartDate: null,
        updatedAt: new Date(),
      });

      setUsers(
        users.map((u) =>
          u.uid === userId
            ? {
                ...u,
                accountType: "free",
                membershipEndDate: undefined,
                membershipStartDate: undefined,
              }
            : u
        )
      );
    } catch (error) {
      console.error("Error revoking membership:", error);
      alert("Failed to revoke membership");
    }
  };

  const isExpired = (user: UserProfile) => {
    if (user.accountType !== "membership") return false;
    if (!user.membershipEndDate) return false;
    return new Date() > user.membershipEndDate;
  };

  const formatDate = (date?: Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate?: Date) => {
    if (!endDate) return "Permanent";
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return "Expired";
    return `${diff} days`;
  };

  if (loading || loadingUsers) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold">Manage Users</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Account Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Membership Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    End Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.displayName}
                        {u.role === "admin" && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.accountType === "membership"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {u.accountType === "membership" ? "MEMBER" : "FREE"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.accountType === "membership" ? (
                        <span
                          className={`text-sm ${
                            isExpired(u) ? "text-red-500" : "text-green-500"
                          }`}
                        >
                          {isExpired(u) ? "Expired" : "Active"}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {u.accountType === "membership" ? (
                        <div className="flex flex-col">
                          <span>{formatDate(u.membershipEndDate)}</span>
                          <span className="text-xs text-zinc-500">
                            {getDaysRemaining(u.membershipEndDate)}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {u.accountType === "membership" ? (
                          <button
                            onClick={() => handleRevokeMembership(u.uid)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => openMembershipModal(u)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
                          >
                            Grant
                          </button>
                        )}
                        {u.accountType === "membership" && (
                          <button
                            onClick={() => openMembershipModal(u)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
                          >
                            Extend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-sm text-zinc-400">
          <p>Total Users: {users.length}</p>
          <p>
            Members:{" "}
            {users.filter((u) => u.accountType === "membership").length}
          </p>
          <p>
            Free Accounts:{" "}
            {users.filter((u) => u.accountType === "free").length}
          </p>
        </div>
      </div>

      {/* Membership Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Grant Membership</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-zinc-400 mb-2">User:</p>
              <p className="font-semibold">{selectedUser.displayName}</p>
              <p className="text-sm text-zinc-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm">Permanent Membership</span>
                </label>
              </div>

              {!isPermanent && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Duration (days)
                  </label>
                  <div className="flex gap-2 mb-3">
                    {[7, 30, 90, 180, 365].map((days) => (
                      <button
                        key={days}
                        onClick={() => setMembershipDays(days)}
                        className={`px-3 py-2 rounded text-sm transition ${
                          membershipDays === days
                            ? "bg-green-600 text-white"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={membershipDays}
                    onChange={(e) => setMembershipDays(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Custom days"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Expires on:{" "}
                    {new Date(
                      Date.now() + membershipDays * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantMembership}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {processing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
