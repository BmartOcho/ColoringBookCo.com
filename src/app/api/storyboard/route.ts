import { NextRequest, NextResponse } from "next/server";
import { createJob, saveScenes, updateJobStatus } from "@/lib/db";

export const maxDuration = 120; // Allow longer for full story generation
export const dynamic = 'force-dynamic';

// Story type configurations with tailored prompts
const STORY_TYPES = {
    adventure: {
        name: "Adventure Story",
        icon: "🗺️",
        prompts: [
            "What is {name} searching for on this adventure?",
            "What dangerous obstacle must {name} overcome?",
            "Who becomes {name}'s unexpected friend along the way?",
            "What surprising discovery does {name} make at the end?",
        ],
        theme: "exploration, discovery, treasure hunting, journeys"
    },
    hero: {
        name: "Hero's Tale",
        icon: "⚔️",
        prompts: [
            "What special power or skill does {name} discover they have?",
            "What villain or monster threatens {name}'s world?",
            "Who does {name} need to protect or save?",
            "What brave choice does {name} make in the final battle?",
        ],
        theme: "bravery, courage, fighting evil, protecting others"
    },
    explorer: {
        name: "Explorer Story",
        icon: "🔭",
        prompts: [
            "What mysterious place does {name} want to explore?",
            "What amazing creature or thing does {name} discover?",
            "What tool or vehicle helps {name} on the journey?",
            "What important secret does {name} uncover?",
        ],
        theme: "space, underwater, science, discovery, new worlds"
    },
    career: {
        name: "Dream Career",
        icon: "🎯",
        prompts: [
            "What does {name} dream of becoming when they grow up?",
            "What is the hardest part of learning this skill?",
            "Who inspires and teaches {name} along the way?",
            "What is {name}'s proudest moment in their new career?",
        ],
        theme: "growing up, learning, hard work, achieving dreams, career journey"
    }
};

type StoryType = keyof typeof STORY_TYPES;

interface StoryboardRequest {
    action: 'start' | 'continue' | 'generate' | 'redo';
    storyType?: StoryType;
    characterName?: string;
    characterDescription?: string;
    characterImage?: string; // Base64 of character coloring page
    userInput?: string;
    plotPoints?: string[];
    interactionNumber?: number;
}

interface Scene {
    sceneNumber: number;
    storyText: string;
    imagePrompt: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: StoryboardRequest = await req.json();
        const { action, storyType, characterName, characterDescription, characterImage, userInput, plotPoints, interactionNumber } = body;

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    if (action === 'start') {
                        // Validate inputs
                        if (!storyType || !characterName) {
                            sendEvent({ type: 'error', message: 'Story type and character name are required' });
                            controller.close();
                            return;
                        }

                        const config = STORY_TYPES[storyType];
                        if (!config) {
                            sendEvent({ type: 'error', message: 'Invalid story type' });
                            controller.close();
                            return;
                        }

                        // Send first prompt
                        const firstPrompt = config.prompts[0].replace('{name}', characterName);
                        sendEvent({
                            type: 'prompt',
                            interactionNumber: 1,
                            text: firstPrompt,
                            storyType: storyType,
                            storyTypeName: config.name,
                            totalInteractions: 5
                        });
                        controller.close();

                    } else if (action === 'continue') {
                        // Validate
                        if (!storyType || !characterName || !userInput || interactionNumber === undefined) {
                            sendEvent({ type: 'error', message: 'Missing required fields for continue action' });
                            controller.close();
                            return;
                        }

                        const config = STORY_TYPES[storyType];
                        const currentPlotPoints = [...(plotPoints || []), userInput];

                        // If we have all 5 inputs (including initial story type selection as implicit #0), generate the story
                        if (interactionNumber >= 4) {
                            // Create job in database
                            const jobId = createJob(
                                characterName,
                                characterDescription || null,
                                characterImage || null,
                                storyType,
                                currentPlotPoints
                            );

                            // Time to generate the full story!
                            sendEvent({
                                type: 'generating',
                                message: 'Creating your personalized 25-scene story...',
                                jobId: jobId,
                                plotPoints: currentPlotPoints
                            });

                            // Generate the full story using OpenAI
                            const scenes = await generateFullStory(
                                storyType,
                                characterName,
                                characterDescription || '',
                                currentPlotPoints,
                                config,
                                (data: object) => {
                                    // Filter out imagePrompt from scene events sent to client
                                    const eventData = data as any;
                                    if (eventData.type === 'scene') {
                                        sendEvent({
                                            type: 'scene',
                                            sceneNumber: eventData.sceneNumber,
                                            storyText: eventData.storyText
                                            // imagePrompt intentionally omitted
                                        });
                                    } else {
                                        sendEvent(data);
                                    }
                                }
                            );

                            // Save all scenes to database (with prompts)
                            saveScenes(jobId, scenes.map(s => ({
                                sceneNumber: s.sceneNumber,
                                storyText: s.storyText,
                                imagePrompt: s.imagePrompt
                            })));

                            // Update job status
                            updateJobStatus(jobId, 'complete');

                            // Send completion with jobId (not full scenes with prompts)
                            sendEvent({
                                type: 'complete',
                                jobId: jobId,
                                totalScenes: scenes.length,
                                scenes: scenes.map(s => ({
                                    sceneNumber: s.sceneNumber,
                                    storyText: s.storyText
                                    // imagePrompt intentionally omitted
                                }))
                            });

                        } else {
                            // Send next prompt
                            const nextPrompt = config.prompts[interactionNumber].replace('{name}', characterName);
                            sendEvent({
                                type: 'prompt',
                                interactionNumber: interactionNumber + 1,
                                text: nextPrompt,
                                plotPoints: currentPlotPoints,
                                totalInteractions: 5
                            });
                        }

                        controller.close();

                    } else if (action === 'redo') {
                        // Redo last interaction - just send the previous prompt again
                        if (!storyType || !characterName || interactionNumber === undefined) {
                            sendEvent({ type: 'error', message: 'Missing required fields for redo action' });
                            controller.close();
                            return;
                        }

                        const config = STORY_TYPES[storyType];
                        const promptIndex = Math.max(0, interactionNumber - 1);
                        const prompt = config.prompts[promptIndex].replace('{name}', characterName);

                        sendEvent({
                            type: 'prompt',
                            interactionNumber: interactionNumber,
                            text: prompt,
                            plotPoints: plotPoints || [],
                            totalInteractions: 5,
                            isRedo: true
                        });

                        controller.close();

                    } else {
                        sendEvent({ type: 'error', message: 'Invalid action' });
                        controller.close();
                    }

                } catch (error: unknown) {
                    console.error("Storyboard Error:", error);
                    const message = error instanceof Error ? error.message : 'Unknown error occurred';
                    sendEvent({ type: 'error', message });
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (e: unknown) {
        console.error("Critical API Error:", e);
        const message = e instanceof Error ? e.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function generateFullStory(
    storyType: StoryType,
    characterName: string,
    characterDescription: string,
    plotPoints: string[],
    config: typeof STORY_TYPES[StoryType],
    sendEvent: (data: object) => void
): Promise<Scene[]> {

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        throw new Error("OpenAI API key not configured");
    }

    // Build the system prompt for story generation
    const systemPrompt = `You are a children's book author creating a 25-scene illustrated storybook. 
Your task is to write a complete story with exactly 25 scenes.

For EACH scene, you must provide:
1. "storyText": A simple, child-friendly sentence (1-2 sentences max) that will be printed in the book
2. "imagePrompt": A detailed visual description (400-800 characters) for generating the coloring book illustration

Character Details:
- Name: ${characterName}
- Description: ${characterDescription || 'A young child with a friendly smile'}

Story Type: ${config.name}
Theme: ${config.theme}

The story should follow this arc based on user's choices:
- Goal/Quest: ${plotPoints[0] || 'an exciting adventure'}
- Main Challenge: ${plotPoints[1] || 'a difficult obstacle'}
- Helper/Friend: ${plotPoints[2] || 'a new friend'}
- Resolution: ${plotPoints[3] || 'a happy ending'}

IMPORTANT for imagePrompt:
- Always include the character's name ({characterName}) and physical description in the prompt.
- When new characters are introduced (friends, animals, siblings), EXPLICITLY describe them as distinct from {characterName}.
- Describe the composition clearly (e.g., "{characterName} stands on the left, looking at the small cat on the right").
- End each imagePrompt with: "Coloring book style, black and white line art, thick bold outlines, no shading, white background."
- Maintain consistency in {characterName}'s appearance, but ensure other characters look completely different.

Respond with a JSON array of exactly 25 scene objects. No markdown, just valid JSON.`;

    const userPrompt = `Create a 25-scene ${config.name.toLowerCase()} for ${characterName}.

Plot points from the user:
1. Goal: ${plotPoints[0]}
2. Challenge: ${plotPoints[1]}
3. Helper: ${plotPoints[2]}
4. Resolution: ${plotPoints[3]}

Generate the complete story now as a JSON array of 25 scenes, each with "sceneNumber", "storyText", and "imagePrompt" fields.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openaiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.8,
                max_tokens: 16000, // Need plenty of tokens for 25 scenes
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API Error:", errorText);
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content in OpenAI response");
        }

        // Parse the JSON response
        let scenes: Scene[];
        try {
            // Clean up potential markdown code blocks
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.slice(7);
            }
            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.slice(3);
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.slice(0, -3);
            }

            scenes = JSON.parse(cleanContent.trim());
        } catch (parseError) {
            console.error("Failed to parse story JSON:", content);
            throw new Error("Failed to parse generated story");
        }

        // Validate and stream each scene
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            scene.sceneNumber = i + 1; // Ensure correct numbering

            // Stream each scene as it's "processed"
            sendEvent({
                type: 'scene',
                sceneNumber: scene.sceneNumber,
                storyText: scene.storyText,
                imagePrompt: scene.imagePrompt
            });

            // Small delay to simulate streaming effect
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return scenes;

    } catch (error) {
        console.error("Story generation error:", error);
        throw error;
    }
}
