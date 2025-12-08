
"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null); // Clear previous

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Connection failed");
      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));

              if (data.status === "step1_start") {
                // Optional: Show status message
              } else if (data.status === "step1_progress" && data.image) {
                setGeneratedImage(data.image); // Show cartoon fading in
              } else if (data.status === "step1_complete" && data.image) {
                setGeneratedImage(data.image);
              } else if (data.status === "step2_start") {
                // Optional: status update
              } else if (data.status === "complete" && data.image) {
                setGeneratedImage(data.image);
              } else if (data.status === "error") {
                throw new Error(data.message);
              }
            } catch (e) {
              console.log("JSON Parse Error on chunk", line);
            }
          }
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Coloring Book Generator
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Turn any photo into a Disney-style coloring page.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          {/* Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload a Photo
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          </div>

          {/* Preview Section */}
          {selectedImage && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Original</h3>
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt="Original"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Result</h3>
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                  {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  ) : generatedImage ? (
                    <Image
                      src={generatedImage}
                      alt="Generated Line Art"
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">Waiting for generation...</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              Error: {error}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={!selectedImage || loading}
              className={`px-8 py-3 text-lg font-semibold rounded-full shadow-md text-white transition-all
                ${!selectedImage || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
            >
              {loading ? "Magic in progress..." : "Generate Coloring Page"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
