"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface R2UploadWidgetProps {
  folder: string;
  value?: string;
  onSuccess: (url: string) => void;
  onRemove?: () => void;
  aspectRatio?: "cover" | "banner" | "page";
  label?: string;
  required?: boolean;
}

export default function R2UploadWidget({
  folder,
  value,
  onSuccess,
  onRemove,
  aspectRatio = "cover",
  label = "Upload Image",
  required = false,
}: R2UploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // Upload to R2
      const response = await fetch("/api/upload", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      console.log("Upload response:", data);
      console.log("Public URL:", data.publicUrl);
      console.log("URL length:", data.publicUrl.length);
      onSuccess(data.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "cover":
        return "w-48 h-72"; // ~2:3 ratio for manga covers
      case "banner":
        return "w-full h-48"; // ~16:9 ratio for banners
      case "page":
        return "w-full h-96"; // Taller for manga pages
      default:
        return "w-48 h-72";
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          {label} {required && "*"}
        </label>
      )}

      <input
        title="upload-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {value ? (
        <div className="relative">
          <div className={`relative ${getAspectRatioClass()} bg-zinc-800`}>
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                console.error("Image failed to load:", value);
                console.error("Error event:", e);
              }}
              onLoad={() => {
                console.log("Image loaded successfully:", value);
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-600 rounded-full hover:bg-red-700 transition"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-8 border-2 border-dashed border-zinc-700 rounded-lg hover:border-green-500 transition flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              <span className="text-zinc-400">Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-12 h-12 text-zinc-500" />
              <span className="text-zinc-400">Click to upload image</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
