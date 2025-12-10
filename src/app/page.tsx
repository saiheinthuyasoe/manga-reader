"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import HomeSections from "./HomeSections";

// Define BeforeInstallPromptEvent type if not available
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function Home() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Subscribe to display-mode changes and update state in the event handler
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const updateStandalone = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsStandalone(e.matches);
    };

    // Set initial value
    updateStandalone(mediaQuery);

    mediaQuery.addEventListener("change", updateStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      mediaQuery.removeEventListener("change", updateStandalone);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    // If already running as installed app, just reload to refresh
    if (isStandalone) {
      window.location.reload();
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Install prompt outcome: ${outcome}`);
    } else {
      // App is likely installed - show instructions to open it
      alert(
        "App is already installed!\n\n" +
          "To open the installed app:\n" +
          "• Find 'Manga Reader' on your home screen or app drawer\n" +
          "• Or go to chrome://apps and click on Manga Reader\n\n" +
          "If not installed yet:\n" +
          "Chrome/Edge: Click the ⋮ menu → Install app\n" +
          "Safari (iOS): Tap Share → Add to Home Screen\n" +
          "Firefox: Tap ⋮ menu → Install"
      );
    }
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&h=500&fit=crop"
          alt="Hero Banner"
          fill
          unoptimized
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6">
              {t("welcomeTitle")}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-300 mb-6 sm:mb-8">
              {t("welcomeSubtitle")}
            </p>
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm sm:text-base"
            >
              <Download className="w-5 h-5" />
              {isStandalone
                ? "Refresh App"
                : deferredPrompt
                ? t("install")
                : "Open App"}
            </button>
          </div>
        </div>
      </div>
      {/* Manga Sections */}
      <HomeSections />
    </div>
  );
}
