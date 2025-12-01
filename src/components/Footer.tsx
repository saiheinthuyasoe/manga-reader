import Link from "next/link";
import { BookOpen, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold text-white">MangaReader</span>
            </Link>
            <p className="text-zinc-400 text-sm mb-4">
              Your ultimate destination for reading manga online. Discover
              thousands of manga titles and enjoy reading them for free.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-zinc-400 hover:text-white transition">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-zinc-400 hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/browse"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Browse
                </Link>
              </li>
              <li>
                <Link
                  href="/popular"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Popular
                </Link>
              </li>
              <li>
                <Link
                  href="/latest"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Latest Updates
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-4">Help</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-zinc-400 hover:text-white transition text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-zinc-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} MangaReader. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
