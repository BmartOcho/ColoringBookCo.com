
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { StoryboardSection } from "./components/StoryboardSection";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStoryboard, setShowStoryboard] = useState(false);

  const storyboardRef = useRef<HTMLDivElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
      setShowStoryboard(false);
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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

        if (done) {
          // Flush remaining buffer
          if (buffer.trim()) {
            const lines = buffer.split("\n");
            for (const line of lines) processLine(line);
          }
          break;
        }

        const lines = buffer.split("\n");
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop() || "";

        for (const line of lines) {
          processLine(line);
        }
      }

      function processLine(line: string) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.replace("data: ", ""));

            if (data.status === "step1_start") {
              // Start
            } else if (data.status === "step1_progress" && data.image) {
              setGeneratedImage(data.image);
            } else if (data.status === "step1_complete" && data.image) {
              setGeneratedImage(data.image);
            } else if (data.status === "step2_start") {
              // Step 2 start
            } else if (data.status === "complete" && data.image) {
              setGeneratedImage(data.image);
            } else if (data.status === "error") {
              throw new Error(data.message);
            }
          } catch (e) {
            console.warn("Parse Error", e);
          }
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'coloring-page.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateBook = () => {
    setShowStoryboard(true);
    // Smooth scroll to storyboard section
    setTimeout(() => {
      storyboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleTryAnother = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setGeneratedImage(null);
    setShowStoryboard(false);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            ✨ Coloring Book Generator
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Turn any photo into a Disney-style coloring page, then create a full personalized story!
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          {/* Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Step 1: Upload a Photo of Your Character
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-purple-300 transition-all"
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
                <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
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
                <h3 className="text-lg font-medium text-gray-800 mb-2">Your Character</h3>
                <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                  {loading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-3"></div>
                      <p className="text-purple-600 font-medium">Creating magic...</p>
                    </div>
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

          {/* Generate Button */}
          {!generatedImage && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleGenerate}
                disabled={!selectedImage || loading}
                className={`px-8 py-3 text-lg font-semibold rounded-full shadow-md text-white transition-all
                  ${!selectedImage || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5"
                  }`}
              >
                {loading ? "Magic in progress..." : "Generate Coloring Page"}
              </button>
            </div>
          )}

          {/* Post-Generation Actions */}
          {generatedImage && !loading && (
            <div className="mt-8 space-y-4">
              {/* Action Buttons Row */}
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 text-sm font-semibold rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                >
                  📥 Download PNG
                </button>
                <button
                  onClick={handleTryAnother}
                  className="px-6 py-3 text-sm font-semibold rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                >
                  🔄 Try Another Photo
                </button>
              </div>

              {/* CTA Button */}
              {!showStoryboard && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCreateBook}
                    className="w-full py-4 px-8 text-xl font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-purple-300 transform hover:-translate-y-1 transition-all"
                  >
                    ✨ Create Your Custom Coloring Book
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Turn this character into a 25-page personalized story!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Storyboard Section */}
        {showStoryboard && (
          <div ref={storyboardRef} className="pt-4">
            <StoryboardSection
              characterImage={generatedImage || undefined}
              onComplete={(scenes) => {
                console.log('Story complete!', scenes);
                // TODO: Proceed to checkout
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
