"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface R2MultiUploadWidgetProps {
  folder: string;
  values: string[];
  onSuccess: (urls: string[]) => void;
  onRemove: (index: number) => void;
  label?: string;
  language?: "EN" | "MM";
}

export default function R2MultiUploadWidget({
  folder,
  values,
  onSuccess,
  onRemove,
  label = "Upload Images",
  language = "EN",
}: R2MultiUploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      setError("Please select only image files");
      return;
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError("All files must be less than 10MB");
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

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
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.publicUrl);

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      onSuccess(uploadedUrls);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload some images. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const colorClass = language === "MM" ? "purple" : "green";

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <span className="inline-flex items-center gap-2">
            {label} ({values.length} uploaded)
            <span className="text-xs text-zinc-500">Optional</span>
          </span>
        </label>
      )}

      <input
        title="upload-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`w-full p-6 border-2 border-dashed border-zinc-700 rounded-lg hover:border-${colorClass}-500 transition flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {uploading ? (
          <>
            <Loader2
              className={`w-10 h-10 text-${colorClass}-500 animate-spin`}
            />
            <span className="text-zinc-400">
              Uploading... {uploadProgress}%
            </span>
          </>
        ) : (
          <>
            <ImagePlus className={`w-10 h-10 text-${colorClass}-500`} />
            <span className="text-zinc-400">
              Click to upload {language === "MM" ? "Myanmar" : "English"} pages
            </span>
            <span className="text-zinc-600 text-sm">
              You can select multiple images at once
            </span>
          </>
        )}
      </button>

      {/* Preview Grid */}
      {values.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {values.map((page, index) => (
            <div key={index} className="relative group">
              <img
                src={page}
                alt={`${language} Page ${index + 1}`}
                className="w-full h-40 sm:h-48 object-cover rounded-lg"
              />
              <div
                className={`absolute top-2 left-2 px-2 py-1 bg-${colorClass}-600 rounded text-xs text-white font-semibold`}
              >
                {language} {index + 1}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-2 bg-red-600 rounded-full hover:bg-red-700 transition"
                aria-label={`Remove ${language} page ${index + 1}`}
                style={{ opacity: "1" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
