"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/types/user";
import {
  Users,
  Crown,
  Calendar,
  X,
  UserCog,
  UserPlus,
  Trash2,
  Edit,
} from "lucide-react";

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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<UserProfile | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<
    "user" | "translator" | "admin"
  >("user");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

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

  const handleChangeRole = async (newRole: "user" | "translator" | "admin") => {
    if (!roleChangeUser) return;

    setProcessing(true);
    try {
      await updateDoc(doc(db, "users", roleChangeUser.uid), {
        role: newRole,
        updatedAt: new Date(),
      });

      setUsers(
        users.map((u) =>
          u.uid === roleChangeUser.uid ? { ...u, role: newRole } : u
        )
      );

      setShowRoleModal(false);
      setRoleChangeUser(null);
    } catch (error) {
      console.error("Error changing role:", error);
      alert("Failed to change role");
    } finally {
      setProcessing(false);
    }
  };

  const openRoleModal = (user: UserProfile) => {
    setRoleChangeUser(user);
    setShowRoleModal(true);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      alert("Please fill in all fields");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          displayName: newUserName,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      const newUser = await response.json();

      // Refresh users list
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

      setShowCreateModal(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("user");
      alert("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      setUsers(users.filter((u) => u.uid !== userId));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditUser(user);
    setEditName(user.displayName);
    setEditEmail(user.email);
    setShowEditModal(true);
  };

  const handleEditUser = async () => {
    if (!editUser || !editName || !editEmail) {
      alert("Please fill in all fields");
      return;
    }

    setProcessing(true);
    try {
      await updateDoc(doc(db, "users", editUser.uid), {
        displayName: editName,
        email: editEmail,
        updatedAt: new Date(),
      });

      setUsers(
        users.map((u) =>
          u.uid === editUser.uid
            ? { ...u, displayName: editName, email: editEmail }
            : u
        )
      );

      setShowEditModal(false);
      setEditUser(null);
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    } finally {
      setProcessing(false);
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold">Manage Users</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            <UserPlus className="w-5 h-5" />
            Create User
          </button>
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
                            : u.role === "translator"
                            ? "bg-green-500/20 text-green-500"
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
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRoleModal(u)}
                          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition"
                          title="Change role"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
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
                        {u.uid !== user?.uid && (
                          <button
                            onClick={() =>
                              handleDeleteUser(u.uid, u.displayName)
                            }
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Role Change Modal */}
      {showRoleModal && roleChangeUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Change User Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-zinc-400 mb-2">User:</p>
              <p className="font-semibold">{roleChangeUser.displayName}</p>
              <p className="text-sm text-zinc-500">{roleChangeUser.email}</p>
              <p className="text-sm text-zinc-400 mt-2">
                Current Role:{" "}
                <span className="text-white font-semibold">
                  {roleChangeUser.role.toUpperCase()}
                </span>
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-zinc-400 mb-3">Select new role:</p>

              <button
                onClick={() => handleChangeRole("user")}
                disabled={processing || roleChangeUser.role === "user"}
                className={`w-full p-4 rounded-lg text-left transition ${
                  roleChangeUser.role === "user"
                    ? "bg-zinc-800 cursor-not-allowed opacity-50"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                <div className="font-semibold mb-1">User</div>
                <div className="text-sm text-zinc-400">
                  Regular user with basic access
                </div>
              </button>

              <button
                onClick={() => handleChangeRole("translator")}
                disabled={processing || roleChangeUser.role === "translator"}
                className={`w-full p-4 rounded-lg text-left transition ${
                  roleChangeUser.role === "translator"
                    ? "bg-green-600/20 cursor-not-allowed opacity-50"
                    : "bg-green-600/20 hover:bg-green-600/30"
                }`}
              >
                <div className="font-semibold mb-1 text-green-500">
                  Translator
                </div>
                <div className="text-sm text-zinc-400">
                  Can create and edit manga/chapters, but cannot manage users
                </div>
              </button>

              <button
                onClick={() => handleChangeRole("admin")}
                disabled={processing || roleChangeUser.role === "admin"}
                className={`w-full p-4 rounded-lg text-left transition ${
                  roleChangeUser.role === "admin"
                    ? "bg-yellow-500/20 cursor-not-allowed opacity-50"
                    : "bg-yellow-500/20 hover:bg-yellow-500/30"
                }`}
              >
                <div className="font-semibold mb-1 text-yellow-500">Admin</div>
                <div className="text-sm text-zinc-400">
                  Full access to all features including user management
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditUser(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-sm text-zinc-400">
                  <span className="font-semibold text-white">User ID:</span>{" "}
                  {editUser.uid}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  <span className="font-semibold text-white">Role:</span>{" "}
                  {editUser.role.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditUser(null);
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {processing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUserEmail("");
                  setNewUserPassword("");
                  setNewUserName("");
                  setNewUserRole("user");
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(
                      e.target.value as "user" | "translator" | "admin"
                    )
                  }
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="user">User - Basic access</option>
                  <option value="translator">
                    Translator - Can manage manga/chapters
                  </option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUserEmail("");
                  setNewUserPassword("");
                  setNewUserName("");
                  setNewUserRole("user");
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {processing ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
