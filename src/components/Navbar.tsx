"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Search,
  BookOpen,
  User,
  Menu,
  LogOut,
  Shield,
  Crown,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, signOut, hasMembership, isAdmin } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    };

    if (showUserMenu || showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu]);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowMobileMenu(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="BuuTee Logo"
              width={50}
              height={50}
              className="w-12 h-12"
            />
            <span className="text-xl font-bold text-white">BuuTee</span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search manga..."
                className="w-full bg-zinc-800 text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </form>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-zinc-300 hover:text-white transition"
            >
              Home
            </Link>
            <Link
              href="/browse"
              className="text-zinc-300 hover:text-white transition"
            >
              Browse
            </Link>
            {user && (
              <Link
                href="/bookmarks"
                className="text-zinc-300 hover:text-white transition"
              >
                Bookmarks
              </Link>
            )}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                >
                  <User className="w-4 h-4" />
                  <span>{user.displayName}</span>
                  {hasMembership && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-2">
                    <div className="px-4 py-3 border-b border-zinc-700">
                      <p className="text-white font-medium">
                        {user.displayName}
                      </p>
                      <p className="text-zinc-400 text-sm">{user.email}</p>
                      <div className="mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            hasMembership
                              ? "bg-green-500/20 text-green-500"
                              : "bg-zinc-700 text-zinc-400"
                          }`}
                        >
                          {hasMembership ? "Member" : "Free Account"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>

                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/admin/manga"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookOpen className="w-4 h-4" />
                          Manage Manga
                        </Link>
                        <Link
                          href="/admin/users"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Users className="w-4 h-4" />
                          Manage Users
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-zinc-700 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            aria-label="Menu"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-zinc-800 py-4"
          >
            {/* Mobile Search */}
            <div className="px-4 mb-4">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search manga..."
                  className="w-full bg-zinc-800 text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </form>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              <Link
                href="/"
                className="block px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              <Link
                href="/browse"
                className="block px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Browse
              </Link>
              {user && (
                <Link
                  href="/bookmarks"
                  className="block px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Bookmarks
                </Link>
              )}

              {user ? (
                <>
                  <div className="px-4 py-3 border-t border-zinc-800 mt-2">
                    <p className="text-white font-medium flex items-center gap-2">
                      {user.displayName}
                      {hasMembership && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </p>
                    <p className="text-zinc-400 text-sm">{user.email}</p>
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          hasMembership
                            ? "bg-green-500/20 text-green-500"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {hasMembership ? "Member" : "Free Account"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>

                  {isAdmin && (
                    <>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                      <Link
                        href="/admin/manga"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <BookOpen className="w-4 h-4" />
                        Manage Manga
                      </Link>
                      <Link
                        href="/admin/users"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Users className="w-4 h-4" />
                        Manage Users
                      </Link>
                    </>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-zinc-800 transition border-t border-zinc-800 mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 mx-4 mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
