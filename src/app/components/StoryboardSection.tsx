"use client";

import { useState, useRef } from "react";
import { StoryTypeSelection } from "./StoryTypeSelection";
import { MadLibConversation } from "./MadLibConversation";
import { StoryPreview } from "./StoryPreview";

interface Scene {
    sceneNumber: number;
    storyText: string;
    imagePrompt: string;
}

type StoryboardPhase = 'selection' | 'conversation' | 'generating' | 'complete';

interface StoryboardSectionProps {
    characterImage?: string; // Base64 of the generated coloring page character
    onComplete?: (scenes: Scene[]) => void;
}

export function StoryboardSection({ characterImage, onComplete }: StoryboardSectionProps) {
    // State
    const [phase, setPhase] = useState<StoryboardPhase>('selection');
    const [storyType, setStoryType] = useState<string | null>(null);
    const [characterName, setCharacterName] = useState("");
    const [currentPrompt, setCurrentPrompt] = useState("");
    const [interactionNumber, setInteractionNumber] = useState(1);
    const [plotPoints, setPlotPoints] = useState<string[]>([]);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [generatingMessage, setGeneratingMessage] = useState("");
    const [error, setError] = useState<string | null>(null);

    const sectionRef = useRef<HTMLDivElement>(null);

    // API call helper
    const callStoryboardAPI = async (body: object) => {
        const response = await fetch('/api/storyboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        return response;
    };

    // Process SSE stream
    const processStream = async (response: Response) => {
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
    };

    // Handle SSE events
    const handleEvent = (data: any) => {
        switch (data.type) {
            case 'prompt':
                setCurrentPrompt(data.text);
                setInteractionNumber(data.interactionNumber);
                if (data.plotPoints) {
                    setPlotPoints(data.plotPoints);
                }
                setPhase('conversation');
                setIsLoading(false);
                break;

            case 'generating':
                setPhase('generating');
                setGeneratingMessage(data.message);
                setScenes([]);
                break;

            case 'scene':
                setScenes(prev => [...prev, {
                    sceneNumber: data.sceneNumber,
                    storyText: data.storyText,
                    imagePrompt: data.imagePrompt
                }]);
                break;

            case 'complete':
                setPhase('complete');
                setIsLoading(false);
                if (onComplete && data.scenes) {
                    onComplete(data.scenes);
                }
                break;

            case 'error':
                setError(data.message);
                setIsLoading(false);
                break;
        }
    };

    // Start the story
    const handleStart = async () => {
        if (!storyType || !characterName.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await callStoryboardAPI({
                action: 'start',
                storyType,
                characterName: characterName.trim()
            });

            await processStream(response);
        } catch (e: any) {
            setError(e.message || 'Failed to start story');
            setIsLoading(false);
        }
    };

    // Continue the conversation
    const handleContinue = async (input: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await callStoryboardAPI({
                action: 'continue',
                storyType,
                characterName,
                userInput: input,
                plotPoints,
                interactionNumber
            });

            await processStream(response);
        } catch (e: any) {
            setError(e.message || 'Failed to continue story');
            setIsLoading(false);
        }
    };

    // Redo last answer
    const handleRedo = async () => {
        if (plotPoints.length === 0) return;

        setIsLoading(true);
        setError(null);

        // Remove last plot point
        const newPlotPoints = plotPoints.slice(0, -1);
        setPlotPoints(newPlotPoints);

        try {
            const response = await callStoryboardAPI({
                action: 'redo',
                storyType,
                characterName,
                plotPoints: newPlotPoints,
                interactionNumber: interactionNumber - 1
            });

            await processStream(response);
        } catch (e: any) {
            setError(e.message || 'Failed to redo');
            setIsLoading(false);
        }
    };

    return (
        <div ref={sectionRef} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 text-white">
                <h2 className="text-2xl font-bold mb-1">Create Your Custom Coloring Book</h2>
                <p className="text-purple-100">
                    {phase === 'selection' && 'Choose your story type and name your character'}
                    {phase === 'conversation' && 'Answer a few questions to shape your story'}
                    {phase === 'generating' && 'AI is writing your personalized story...'}
                    {phase === 'complete' && 'Your story is ready!'}
                </p>
            </div>

            {/* Content */}
            <div className="p-8">
                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <strong>Error:</strong> {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 text-red-500 hover:text-red-700"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Phase: Selection */}
                {phase === 'selection' && (
                    <StoryTypeSelection
                        selectedType={storyType}
                        onSelect={setStoryType}
                        characterName={characterName}
                        onNameChange={setCharacterName}
                        onStart={handleStart}
                        disabled={isLoading}
                    />
                )}

                {/* Phase: Conversation */}
                {phase === 'conversation' && (
                    <MadLibConversation
                        currentPrompt={currentPrompt}
                        interactionNumber={interactionNumber}
                        totalInteractions={5}
                        onSubmit={handleContinue}
                        onRedo={handleRedo}
                        canRedo={plotPoints.length > 0}
                        isLoading={isLoading}
                        plotPoints={plotPoints}
                    />
                )}

                {/* Phase: Generating or Complete */}
                {(phase === 'generating' || phase === 'complete') && (
                    <StoryPreview
                        scenes={scenes}
                        isGenerating={phase === 'generating'}
                        generatingMessage={generatingMessage}
                    />
                )}
            </div>
        </div>
    );
}
