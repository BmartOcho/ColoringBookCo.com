"use client";

import { useState } from "react";

interface StoryTypeCardProps {
    type: string;
    name: string;
    icon: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}

export function StoryTypeCard({ type, name, icon, description, selected, onClick }: StoryTypeCardProps) {
    return (
        <button
            onClick={onClick}
            className={`
        relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
        hover:scale-105 hover:shadow-xl
        ${selected
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg shadow-purple-200'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }
      `}
        >
            {/* Selection indicator */}
            {selected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            {/* Icon */}
            <div className="text-4xl mb-3">{icon}</div>

            {/* Title */}
            <h3 className={`text-lg font-bold mb-2 ${selected ? 'text-purple-700' : 'text-gray-800'}`}>
                {name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed">
                {description}
            </p>
        </button>
    );
}

const STORY_TYPES = [
    {
        type: 'adventure',
        name: 'Adventure Story',
        icon: '🗺️',
        description: 'Treasure hunting, finding lost civilizations, climbing the tallest mountain...'
    },
    {
        type: 'hero',
        name: "Hero's Tale",
        icon: '⚔️',
        description: 'Fighting dragons, becoming a warrior, saving the day with bravery...'
    },
    {
        type: 'explorer',
        name: 'Explorer Story',
        icon: '🔭',
        description: 'Discovering new worlds in space, under the sea, or hidden on Earth...'
    },
    {
        type: 'career',
        name: 'Dream Career',
        icon: '🎯',
        description: 'Growing up to become a doctor, pilot, firefighter, or any dream job...'
    }
];

interface StoryTypeSelectionProps {
    selectedType: string | null;
    onSelect: (type: string) => void;
    characterName: string;
    onNameChange: (name: string) => void;
    onStart: () => void;
    disabled?: boolean;
}

export function StoryTypeSelection({
    selectedType,
    onSelect,
    characterName,
    onNameChange,
    onStart,
    disabled
}: StoryTypeSelectionProps) {
    return (
        <div className="space-y-8">
            {/* Character Name Input */}
            <div className="space-y-3">
                <label className="block text-lg font-semibold text-gray-800">
                    What is your character's name?
                </label>
                <input
                    type="text"
                    value={characterName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Enter a name..."
                    disabled={disabled}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl 
            focus:border-purple-500 focus:ring-4 focus:ring-purple-100 
            transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>

            {/* Story Type Grid */}
            <div className="space-y-3">
                <label className="block text-lg font-semibold text-gray-800">
                    Choose your story type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STORY_TYPES.map((story) => (
                        <StoryTypeCard
                            key={story.type}
                            {...story}
                            selected={selectedType === story.type}
                            onClick={() => !disabled && onSelect(story.type)}
                        />
                    ))}
                </div>
            </div>

            {/* Start Button */}
            <button
                onClick={onStart}
                disabled={!selectedType || !characterName.trim() || disabled}
                className={`
          w-full py-4 px-8 text-xl font-bold rounded-xl transition-all duration-300
          ${(!selectedType || !characterName.trim() || disabled)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-300 transform hover:-translate-y-1'
                    }
        `}
            >
                {disabled ? 'Starting...' : 'Begin Your Story ✨'}
            </button>
        </div>
    );
}
