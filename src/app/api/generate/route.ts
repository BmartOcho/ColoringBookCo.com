
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get("image") as File;

        if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });
        if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    const arrayBuffer = await image.arrayBuffer();
                    // STEP 1: Generate Cartoon with OpenAI "gpt-image-1" (Streaming)
                    sendEvent({ status: "step1_start", message: "Generating Cartoon..." });

                    const openAIFormData = new FormData();
                    openAIFormData.append("image", image);
                    openAIFormData.append("model", "gpt-image-1");
                    openAIFormData.append("prompt", "Turn this person into a 3D Disney Pixar character. Cute, big eyes, smooth skin, vibrant colors. Keep the pose and expression matching the original. White background.");
                    // openAIFormData.append("input_fidelity", "high"); // Removed for speed
                    openAIFormData.append("output_format", "png");
                    openAIFormData.append("stream", "true");
                    openAIFormData.append("partial_images", "3");

                    const openAIResponse = await fetch("https://api.openai.com/v1/images/edits", {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
                        body: openAIFormData
                    });

                    if (!openAIResponse.ok) {
                        const errText = await openAIResponse.text();
                        console.error("OpenAI Error:", openAIResponse.status, errText);
                        throw new Error(`OpenAI Step 1 Failed: ${openAIResponse.status} ${errText}`);
                    }

                    if (!openAIResponse.body) throw new Error("No response body from OpenAI");

                    const reader = openAIResponse.body.getReader();
                    let cartoonBase64 = "";
                    let textBuffer = "";

                    const processLine = (line: string) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('data: ')) {
                            const jsonStr = trimmedLine.replace('data: ', '').trim();
                            if (jsonStr === '[DONE]') return;
                            try {
                                const eventData = JSON.parse(jsonStr);
                                let pImgKey = null;
                                if (eventData.b64_json) pImgKey = eventData.b64_json;
                                else if (eventData.image) pImgKey = eventData.image;
                                else if (eventData.data && eventData.data[0] && eventData.data[0].b64_json) pImgKey = eventData.data[0].b64_json;

                                if (pImgKey) {
                                    const pImg = `data:image/png;base64,${pImgKey}`;
                                    sendEvent({ status: "step1_progress", image: pImg });
                                    cartoonBase64 = pImg;
                                }
                            } catch (e) {
                                // console.log("Partial chunk parse fail");
                            }
                        }
                    }

                    // Read the stream from OpenAI
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        textBuffer += decoder.decode(value, { stream: true });
                        const lines = textBuffer.split('\n');

                        // Keep the last line in the buffer as it might be incomplete
                        textBuffer = lines.pop() || "";

                        for (const line of lines) {
                            processLine(line);
                        }
                    }

                    // Flush remaining buffer
                    if (textBuffer.trim()) {
                        processLine(textBuffer);
                    }

                    if (cartoonBase64) {
                        sendEvent({ status: "step1_complete", image: cartoonBase64 });
                    } else {
                        // If no image found, we let Step 2 fail naturally or throw specific error?
                        // We throw here or let Step 2 throw. The code below checks cartoonBase64.
                    }

                    // STEP 2: Vectorize with gpt-image-1-mini (Fast)
                    sendEvent({ status: "step2_start", message: "Vectorizing Line Art..." });

                    if (!cartoonBase64) throw new Error("Step 1 failed to produce an image. Please try again.");

                    const cartoonBuffer = Buffer.from(cartoonBase64.split(",")[1], 'base64');
                    const cartoonBlob = new Blob([cartoonBuffer], { type: 'image/png' });

                    const step2FormData = new FormData();
                    step2FormData.append("image", cartoonBlob, "cartoon.png");
                    step2FormData.append("model", "gpt-image-1-mini");
                    step2FormData.append("prompt", "Convert this 3D character into a clean, black and white coloring book page. Thick bold outlines, no shading, no grayscale, pure white background. Keep the character's details recognizable but simplified for coloring.");
                    step2FormData.append("output_format", "png");

                    const step2Response = await fetch("https://api.openai.com/v1/images/edits", {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
                        body: step2FormData
                    });

                    if (!step2Response.ok) {
                        const err = await step2Response.text();
                        throw new Error(`Step 2 Failed: ${err}`);
                    }

                    const step2Data = await step2Response.json();
                    let finalBase64 = "";
                    if (step2Data.data && step2Data.data[0]) {
                        if (step2Data.data[0].b64_json) finalBase64 = `data:image/png;base64,${step2Data.data[0].b64_json}`;
                        else if (step2Data.data[0].image) finalBase64 = `data:image/png;base64,${step2Data.data[0].image}`;
                        else if (step2Data.data[0].url) {
                            const r = await fetch(step2Data.data[0].url);
                            const b = await r.arrayBuffer();
                            finalBase64 = `data:image/png;base64,${Buffer.from(b).toString('base64')}`;
                        }
                    }

                    sendEvent({ status: "complete", image: finalBase64 });
                    controller.close();

                } catch (error: any) {
                    console.error("Stream Error:", error);
                    sendEvent({ status: "error", message: error.message });
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
