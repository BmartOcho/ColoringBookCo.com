"use client";

interface Scene {
    sceneNumber: number;
    storyText: string;
    imagePrompt: string;
}

interface StoryPreviewProps {
    scenes: Scene[];
    isGenerating: boolean;
    generatingMessage?: string;
}

export function StoryPreview({ scenes, isGenerating, generatingMessage }: StoryPreviewProps) {
    if (isGenerating && scenes.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-6">
                    <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {generatingMessage || 'Creating your story...'}
                </h3>
                <p className="text-gray-600">
                    Our AI author is writing your personalized 25-scene adventure!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    🎉 Your Story is Ready!
                </h3>
                <p className="text-gray-600">
                    {scenes.length} scenes created. Preview your story below.
                </p>
            </div>

            {/* Scenes Grid */}
            <div className="grid gap-4">
                {scenes.map((scene) => (
                    <div
                        key={scene.sceneNumber}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-stretch">
                            {/* Scene Number Badge */}
                            <div className="w-16 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">{scene.sceneNumber}</span>
                            </div>

                            {/* Scene Content */}
                            <div className="flex-1 p-4">
                                <p className="text-gray-800 font-medium mb-2">
                                    {scene.storyText}
                                </p>

                                {/* Expandable Image Prompt (for debugging/preview) */}
                                <details className="text-sm">
                                    <summary className="text-purple-600 cursor-pointer hover:text-purple-700">
                                        View image prompt
                                    </summary>
                                    <p className="mt-2 text-gray-500 text-xs leading-relaxed bg-gray-50 p-3 rounded-lg">
                                        {scene.imagePrompt}
                                    </p>
                                </details>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Generating indicator for streaming */}
            {isGenerating && scenes.length > 0 && (
                <div className="flex items-center justify-center gap-3 py-4 text-purple-600">
                    <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                    <span className="font-medium">Generating scene {scenes.length + 1}...</span>
                </div>
            )}

            {/* Next Steps CTA */}
            {!isGenerating && scenes.length >= 25 && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
                    <h4 className="text-2xl font-bold mb-3">Ready to Create Your Book?</h4>
                    <p className="text-purple-100 mb-6">
                        Your story is complete! Choose your book options below to bring it to life.
                    </p>
                    <button className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors">
                        Continue to Book Options →
                    </button>
                </div>
            )}
        </div>
    );
}
