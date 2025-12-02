"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Crown,
  LogOut,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { auth } from "@/lib/firebase";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

export default function ProfilePage() {
  const { user, loading, signOut, hasMembership, isAdmin } = useAuth();
  const router = useRouter();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (!auth.currentUser || !user?.email) {
      setPasswordError("No user logged in");
      return;
    }

    setChangingPassword(true);

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("New password is too weak");
      } else {
        setPasswordError(error.message || "Failed to change password");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-purple-600 p-6 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-400" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {user.displayName}
                </h1>
                <p className="text-sm sm:text-base text-green-100 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">
              Account Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Email</p>
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Member Since</p>
                    <p className="text-white">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-sm text-zinc-400">Account Type</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white capitalize">
                        {user.accountType}
                      </p>
                      {hasMembership ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-zinc-700 text-zinc-400 text-xs rounded-full">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {user.accountType === "membership" &&
                user.membershipStartDate && (
                  <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-400">
                          Membership Period
                        </p>
                        <p className="text-white">
                          {formatDate(user.membershipStartDate)}
                          {user.membershipEndDate
                            ? ` - ${formatDate(user.membershipEndDate)}`
                            : " - Lifetime"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {isAdmin && (
                <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-purple-400">Role</p>
                      <p className="text-white font-semibold">Administrator</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!hasMembership && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                <p className="text-green-400 text-sm">
                  <strong>Note:</strong> You currently have a free account. To
                  read manga chapters, please contact an administrator to
                  upgrade your account to membership.
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-zinc-800 rounded-lg text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {user.bookmarks?.length || 0}
                </p>
                <p className="text-xs sm:text-sm text-zinc-400">Bookmarks</p>
              </div>
              <div className="p-3 sm:p-4 bg-zinc-800 rounded-lg text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {user.readingHistory?.length || 0}
                </p>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Reading History
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {isAdmin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm sm:text-base"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="mt-8 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password & Security
              </h2>
            </div>

            {!showPasswordChange ? (
              <div className="space-y-4">
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-500 text-sm">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-green-500 text-sm">{passwordSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 text-white rounded-lg font-semibold transition"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordError("");
                      setPasswordSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-zinc-500">
                  Note: After changing your password, you&apos;ll remain logged
                  in.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
