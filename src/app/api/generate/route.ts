
import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60; // Allow sufficient timeout for AI generation

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get("image") as File;

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json(
                { error: "REPLICATE_API_TOKEN is not configured" },
                { status: 500 }
            );
        }

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:${image.type};base64,${buffer.toString("base64")}`;

        // Get the latest version of the model dynamically to avoid hardcoding dead hashes
        // Using 'lucataco/controlnet-canny-sdxl' or 'lucataco/controlnet-canny'
        // Let's try to fetch the model first. 
        // Recommended model for consistency: lucataco/controlnet-canny (SDXL based)

        // NOTE: If this fails, we can fall back to a known hash or a different model.
        let modelVersionId = "aff48af9c68d162388d230a2ab003f68d2638d88307bdaf1c2f1ac95079c9669"; // jagilley fallback

        try {
            // Search for jagilley first as it was the original plan, but let's try to get its latest version.
            // actually jagilley/controlnet-canny is quite old (SD 1.5).
            // Let's use standard stability-ai/sdxl with controlnet if possible, OR
            // Use a verified public model. 'lucataco/controlnet-canny' is good.
            const model = await replicate.models.get("lucataco", "sdxl-controlnet-canny");
            // Note: Model name might be `sdxl-controlnet-canny` or `controlnet-canny-sdxl`.
            // Let's use the explicit `fofr/sdxl-controlnet-canny` or similar if `lucataco` is ambiguous.
            // Actually, let's just use the `replicate.run` with the model name, Replicate client might support it.
            // But typically strict mode requires "owner/name:version".

            if (model && model.latest_version) {
                modelVersionId = model.latest_version.id;
            }
        } catch (e) {
            console.log("Could not fetch latest version, using hardcoded fallback or erroring.");
            // Fallback to a known working SDXL ControlNet Canny if possible or keep jagilley.
            // Let's try a known working SDXL Canny hash from a popular model if the dynamic fetch fails.
            // Model: diffusers/controlnet-canny-sdxl-1.0 is not a replicate runable model directly usually.
            // Using `xlabs-ai/flux-dev-controlnet-canny` (new flux model) or `lucataco/sdxl-controlnet-canny`
        }

        // Hardcoded known working SDXL Canny (lucataco) if dynamic fails:
        // This is a guess, but better to use the specific one I found in search context if available.
        // Let's use a very standard one: `stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b` doesn't have controlnet.

        // Let's go with `jagilley/controlnet-canny` BUT get the version dynamically to ensure it's valid.
        const model = await replicate.models.get("jagilley", "controlnet-canny");
        const version = model.latest_version.id;

        const output = await replicate.run(
            `jagilley/controlnet-canny:${version}`,
            {
                input: {
                    image: base64Image,
                    prompt: "coloring book page, disney style, clean line art, black and white, white background, cute, simple",
                    // jagilley model specific params
                    num_samples: "1",
                    image_resolution: "512",
                    ddim_steps: 20,
                    scale: 9,
                    eta: 0,
                    a_prompt: "best quality, extremely detailed",
                    n_prompt: "shading, complex details, realistic, photograph, color, grayscale, text, watermark"
                }
            }
        );

        return NextResponse.json({ output });
    } catch (error: any) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
