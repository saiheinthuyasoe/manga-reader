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
  Languages,
  ChevronDown,
  Coins,
  History,
  ShoppingBag,
  BookPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, signOut, hasMembership, isAdmin, isTranslator } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

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
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setShowLangMenu(false);
      }
    };

    if (showUserMenu || showMobileMenu || showLangMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu, showLangMenu]);

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
              src="/logo_buutee.png"
              alt="BuuTee Logo"
              width={50}
              height={50}
              className="w-10 h-10"
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
                placeholder={t("search")}
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
              {t("browse")}
            </Link>
            {user && (
              <Link
                href="/bookmarks"
                className="text-zinc-300 hover:text-white transition"
              >
                {t("bookmarks")}
              </Link>
            )}

            {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                aria-label="Language selector"
              >
                <Languages className="w-4 h-4" />
                <span className="text-sm font-medium">{language}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-2">
                  <button
                    onClick={() => {
                      setLanguage("EN");
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left transition ${
                      language === "EN"
                        ? "bg-green-600 text-white"
                        : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("MM");
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left transition ${
                      language === "MM"
                        ? "bg-green-600 text-white"
                        : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    Myanmar
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                  aria-label="User menu"
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
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            hasMembership
                              ? "bg-green-500/20 text-green-500"
                              : "bg-zinc-700 text-zinc-400"
                          }`}
                        >
                          {hasMembership ? t("member") : t("freeAccount")}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-medium">
                          <Coins className="w-3 h-3" />
                          {user.coins || 0}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      {t("profile")}
                    </Link>

                    {!isAdmin && (
                      <>
                        <Link
                          href="/buy-membership"
                          className="flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-zinc-700 hover:text-white transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Crown className="w-4 h-4" />
                          Buy Membership
                        </Link>
                        <Link
                          href="/buy-coin"
                          className="flex items-center gap-2 px-4 py-2 text-green-400 hover:bg-zinc-700 hover:text-white transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Coins className="w-4 h-4" />
                          Buy Coin
                        </Link>

                        <Link
                          href="/transactions"
                          className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <History className="w-4 h-4" />
                          Transaction History
                        </Link>

                        <Link
                          href="/purchases"
                          className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Purchase History
                        </Link>

                        <Link
                          href="/request-manga"
                          className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookPlus className="w-4 h-4" />
                          Request Manga
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield className="w-4 h-4" />
                          {t("adminDashboard")}
                        </Link>
                        <Link
                          href="/admin/manga"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookOpen className="w-4 h-4" />
                          {t("manageManga")}
                        </Link>
                        <Link
                          href="/admin/users"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Users className="w-4 h-4" />
                          {t("manageUsers")}
                        </Link>
                        <Link
                          href="/admin/transactions"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <History className="w-4 h-4" />
                          Transactions
                        </Link>
                        <Link
                          href="/admin/purchases"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Purchases
                        </Link>
                        <Link
                          href="/admin/manga-requests"
                          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookPlus className="w-4 h-4" />
                          Manga Requests
                        </Link>
                      </>
                    )}

                    {isTranslator && !isAdmin && (
                      <>
                        <Link
                          href="/admin/manga"
                          className="flex items-center gap-2 px-4 py-2 text-green-400 hover:bg-zinc-700 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookOpen className="w-4 h-4" />
                          {t("manageManga")}
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-zinc-700 transition border-t border-zinc-800"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("signOut")}
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
                <span>{t("signIn")}</span>
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
            className="md:hidden border-t border-zinc-800 py-4 pb-32 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {/* Mobile Search */}
            <div className="px-4 mb-4">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search")}
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
                {t("browse")}
              </Link>
              {user && (
                <Link
                  href="/bookmarks"
                  className="block px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t("bookmarks")}
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
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          hasMembership
                            ? "bg-green-500/20 text-green-500"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {hasMembership ? t("member") : t("freeAccount")}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-medium">
                        <Coins className="w-3 h-3" />
                        {user.coins || 0}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    {t("profile")}
                  </Link>

                  {!isAdmin && (
                    <>
                      <Link
                        href="/buy-coin"
                        className="flex items-center gap-2 px-4 py-2 text-green-400 hover:bg-zinc-800 hover:text-white transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Coins className="w-4 h-4" />
                        Buy Coin
                      </Link>
                      <Link
                        href="/transactions"
                        className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <History className="w-4 h-4" />
                        Transaction History
                      </Link>

                      <Link
                        href="/purchases"
                        className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Purchase History
                      </Link>

                      <Link
                        href="/request-manga"
                        className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <BookPlus className="w-4 h-4" />
                        Request Manga
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Shield className="w-4 h-4" />
                        {t("adminDashboard")}
                      </Link>
                      <Link
                        href="/admin/manga"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <BookOpen className="w-4 h-4" />
                        {t("manageManga")}
                      </Link>
                      <Link
                        href="/admin/users"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Users className="w-4 h-4" />
                        {t("manageUsers")}
                      </Link>
                      <Link
                        href="/admin/transactions"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <History className="w-4 h-4" />
                        Transactions
                      </Link>
                      <Link
                        href="/admin/purchases"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Purchases
                      </Link>
                      <Link
                        href="/admin/manga-requests"
                        className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <BookPlus className="w-4 h-4" />
                        Manga Requests
                      </Link>
                    </>
                  )}

                  {isTranslator && !isAdmin && (
                    <>
                      <Link
                        href="/admin/manga"
                        className="flex items-center gap-2 px-4 py-2 text-green-400 hover:bg-zinc-800 transition"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <BookOpen className="w-4 h-4" />
                        {t("manageManga")}
                      </Link>
                    </>
                  )}

                  {/* Language Selector - Mobile */}
                  <div className="border-t border-zinc-800 pt-2 mt-2 px-4">
                    <p className="text-xs text-zinc-500 mb-2">
                      {t("language")}
                    </p>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => {
                          setLanguage("EN");
                          setShowMobileMenu(false);
                        }}
                        className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${
                          language === "EN"
                            ? "bg-green-600 text-white"
                            : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                        }`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => {
                          setLanguage("MM");
                          setShowMobileMenu(false);
                        }}
                        className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition ${
                          language === "MM"
                            ? "bg-green-600 text-white"
                            : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                        }`}
                      >
                        MM
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-zinc-800 transition mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("signOut")}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 mx-4 mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>{t("signIn")}</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
