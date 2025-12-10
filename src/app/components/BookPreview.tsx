"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Scene {
    sceneNumber: number;
    storyText: string;
}

interface GeneratedPage {
    sceneNumber: number;
    storyText: string;
    imageData: string; // Base64 image
}

interface BookPreviewProps {
    jobId: string;
    scenes: Scene[];
}

export function BookPreview({ jobId, scenes }: BookPreviewProps) {
    const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
    const [currentlyGenerating, setCurrentlyGenerating] = useState(0);
    const [isGenerating, setIsGenerating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            generateBook();
        }
    }, [jobId]);

    const generateBook = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedPages([]);
        setCurrentlyGenerating(1);

        try {
            const response = await fetch('/api/book/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            });

            if (!response.ok) {
                throw new Error('Failed to start book generation');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response stream');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmed.slice(6));
                            handleEvent(data);
                        } catch (e) {
                            console.warn('Parse error:', e);
                        }
                    }
                }
            }

            // Process remaining buffer
            if (buffer.trim().startsWith('data: ')) {
                try {
                    const data = JSON.parse(buffer.trim().slice(6));
                    handleEvent(data);
                } catch (e) {
                    console.warn('Final parse error:', e);
                }
            }

            setIsGenerating(false);

        } catch (e: any) {
            setError(e.message || 'Failed to generate book');
            setIsGenerating(false);
        }
    };

    const handleEvent = (data: any) => {
        switch (data.type) {
            case 'generating':
                setCurrentlyGenerating(data.sceneNumber);
                break;

            case 'page':
                setGeneratedPages(prev => [...prev, {
                    sceneNumber: data.sceneNumber,
                    storyText: data.storyText,
                    imageData: data.imageData
                }]);
                break;

            case 'complete':
                setIsGenerating(false);
                break;

            case 'error':
                setError(data.message);
                setIsGenerating(false);
                break;
        }
    };

    return (
        <div className="space-y-8">
            {/* Progress Header */}
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {isGenerating ? '✨ Creating Your Coloring Book...' : '📚 Your Coloring Book is Ready!'}
                </h3>

                {isGenerating && (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Generating page {currentlyGenerating} of {scenes.length}...
                        </p>

                        {/* Progress Bar */}
                        <div className="max-w-md mx-auto">
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                                    style={{ width: `${(generatedPages.length / scenes.length) * 100}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                {generatedPages.length} / {scenes.length} pages complete
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                    <strong>Error:</strong> {error}
                    <button
                        onClick={generateBook}
                        className="ml-4 px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Generated Pages Grid */}
            {generatedPages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedPages.map((page) => (
                        <div
                            key={page.sceneNumber}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                        >
                            {/* Page Number */}
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 text-white font-bold text-center">
                                Page {page.sceneNumber}
                            </div>

                            {/* Image */}
                            <div className="relative aspect-square bg-white">
                                <Image
                                    src={page.imageData}
                                    alt={`Page ${page.sceneNumber}`}
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>

                            {/* Story Text */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-700 text-sm leading-relaxed text-center">
                                    {page.storyText}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Loading Skeleton for remaining pages */}
            {isGenerating && generatedPages.length < scenes.length && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenes.slice(generatedPages.length, generatedPages.length + 3).map((scene) => (
                        <div
                            key={`skeleton-${scene.sceneNumber}`}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-50"
                        >
                            <div className="bg-gray-300 px-4 py-2 text-white font-bold text-center">
                                Page {scene.sceneNumber}
                            </div>
                            <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-400 text-sm text-center">
                                    {scene.storyText}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Completion Actions */}
            {!isGenerating && generatedPages.length > 0 && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
                    <h4 className="text-2xl font-bold mb-3">🎉 Your Book is Complete!</h4>
                    <p className="text-purple-100 mb-6">
                        All {generatedPages.length} pages have been generated. Ready to order your printed book?
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors">
                            📦 Order Printed Book - $24.99
                        </button>
                        <a
                            href={`/api/book/${jobId}/download`}
                            target="_blank"
                            download
                            className="px-8 py-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition-colors border-2 border-white flex items-center justify-center"
                        >
                            📥 Download PDF - $9.99
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
