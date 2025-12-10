import { NextRequest, NextResponse } from "next/server";
import { getJob, getScenes, updateSceneImage } from "@/lib/db";

export const maxDuration = 300; // 5 minutes for full book generation
export const dynamic = 'force-dynamic';

interface BookGenerateRequest {
    jobId: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: BookGenerateRequest = await req.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
        }

        // Fetch job and scenes from database
        const job = getJob(jobId);
        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const scenes = getScenes(jobId);
        if (!scenes || scenes.length === 0) {
            return NextResponse.json({ error: "No scenes found for this job" }, { status: 404 });
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    sendEvent({
                        type: 'started',
                        message: `Generating ${scenes.length} coloring book pages...`,
                        totalPages: scenes.length
                    });

                    // Generate image for each scene
                    for (const scene of scenes) {
                        // Check if image already exists
                        if (scene.image_data) {
                            sendEvent({
                                type: 'page',
                                sceneNumber: scene.scene_number,
                                storyText: scene.story_text,
                                imageData: scene.image_data
                            });
                            continue;
                        }

                        sendEvent({
                            type: 'generating',
                            sceneNumber: scene.scene_number,
                            message: `Generating page ${scene.scene_number}...`
                        });

                        try {
                            // Generate image using OpenAI gpt-image-1-mini
                            const imageData = await generatePageImage(scene.image_prompt);

                            // Save to database
                            updateSceneImage(jobId, scene.scene_number, imageData);

                            // Send to client
                            sendEvent({
                                type: 'page',
                                sceneNumber: scene.scene_number,
                                storyText: scene.story_text,
                                imageData: imageData
                            });

                        } catch (imageError: any) {
                            console.error(`Failed to generate page ${scene.scene_number}:`, imageError);
                            sendEvent({
                                type: 'page_error',
                                sceneNumber: scene.scene_number,
                                message: imageError.message || 'Failed to generate image'
                            });
                            // Continue with next page instead of stopping
                        }
                    }

                    sendEvent({
                        type: 'complete',
                        message: 'All pages generated successfully!'
                    });

                    controller.close();

                } catch (error: any) {
                    console.error("Book generation error:", error);
                    sendEvent({
                        type: 'error',
                        message: error.message || 'Unknown error occurred'
                    });
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

    } catch (e: any) {
        console.error("Critical API Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}

async function generatePageImage(imagePrompt: string): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        throw new Error("OpenAI API key not configured");
    }

    // Use gpt-image-1-mini for faster generation
    const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-image-1-mini",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI Image API Error:", response.status, errorText);
        throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data[0]) {
        throw new Error("No image data in response");
    }

    const base64 = data.data[0].b64_json;
    return `data:image/png;base64,${base64}`;
}
