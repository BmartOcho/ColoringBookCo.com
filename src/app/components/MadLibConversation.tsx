"use client";

import { useState, useRef, useEffect } from "react";

interface MadLibConversationProps {
    currentPrompt: string;
    interactionNumber: number;
    totalInteractions: number;
    onSubmit: (input: string) => void;
    onRedo: () => void;
    canRedo: boolean;
    isLoading?: boolean;
    plotPoints: string[];
}

export function MadLibConversation({
    currentPrompt,
    interactionNumber,
    totalInteractions,
    onSubmit,
    onRedo,
    canRedo,
    isLoading,
    plotPoints
}: MadLibConversationProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus input when prompt changes
        inputRef.current?.focus();
    }, [currentPrompt]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSubmit(input.trim());
            setInput("");
        }
    };

    // Progress percentage
    const progress = (interactionNumber / totalInteractions) * 100;

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Story Progress</span>
                    <span>{interactionNumber} of {totalInteractions}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Previous Answers */}
            {plotPoints.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Your Story So Far</h4>
                    <div className="flex flex-wrap gap-2">
                        {plotPoints.map((point, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                            >
                                {point}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Current Prompt */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">✨</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-lg text-gray-800 leading-relaxed">
                            {currentPrompt}
                        </p>
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        disabled={isLoading}
                        className="w-full px-5 py-4 pr-14 text-lg border-2 border-gray-200 rounded-xl 
              focus:border-purple-500 focus:ring-4 focus:ring-purple-100 
              transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`
              absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg
              flex items-center justify-center transition-all
              ${(!input.trim() || isLoading)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }
            `}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-3">
                    {canRedo && (
                        <button
                            type="button"
                            onClick={onRedo}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg 
                hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ↩ Redo Last Answer
                        </button>
                    )}
                </div>
            </form>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center gap-3 py-4">
                    <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                    <span className="text-purple-600 font-medium">Thinking...</span>
                </div>
            )}
        </div>
    );
}
