"use client";

import { ShieldCheck, FileText, User } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Your privacy is important to us. This page explains how we collect,
            use, and protect your information when you use MangaReader.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Data Collection */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <User className="w-6 h-6 text-green-500" />
              </div>
              <h2 className="font-semibold text-xl">What We Collect</h2>
            </div>
            <p className="text-zinc-400 text-sm">
              We collect basic information such as your name, email address, and
              profile details when you register. We also collect usage data to
              improve your experience.
            </p>
          </div>

          {/* Data Usage */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-500" />
              </div>
              <h2 className="font-semibold text-xl">How We Use Your Data</h2>
            </div>
            <p className="text-zinc-400 text-sm">
              Your data is used to personalize your experience, process
              transactions, and provide customer support. We do not sell your
              personal information to third parties.
            </p>
          </div>

          {/* Data Protection */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
              <h2 className="font-semibold text-xl">
                How We Protect Your Data
              </h2>
            </div>
            <p className="text-zinc-400 text-sm">
              We use industry-standard security measures to protect your data.
              Access to your information is restricted to authorized personnel
              only.
            </p>
          </div>

          {/* User Rights */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="font-semibold text-xl mb-3 text-green-500">
              Your Rights
            </h2>
            <ul className="list-disc pl-6 text-zinc-400 text-sm space-y-2">
              <li>
                You can view and update your profile information at any time.
              </li>
              <li>You may request deletion of your account and data.</li>
              <li>Contact us for any privacy-related concerns.</li>
            </ul>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-12 text-center text-zinc-500 text-xs">
          Last updated: December 9, 2025
        </div>
      </div>
    </div>
  );
}
