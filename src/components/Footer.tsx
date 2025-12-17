import Link from "next/link";
import { BookOpen, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-16 pt-10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <BookOpen className="w-6 h-6 text-green-500" />
              <span className="text-xl font-bold text-white">BuuTee</span>
            </Link>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-zinc-400 hover:text-white transition"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-zinc-400 hover:text-white transition"
                title="Twitter"
              >
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
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-4">Help</h3>
            <ul className="space-y-2">
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
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-zinc-400 text-sm">
          <p>&copy; {new Date().getFullYear()} BuuTee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
