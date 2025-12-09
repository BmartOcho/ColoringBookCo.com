
// test_single_step.js
// Standalone test script to compare single-step vs two-step generation
// Run with: node test_single_step.js

const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || fs.readFileSync('.env.local', 'utf8').match(/OPENAI_API_KEY=(.+)/)?.[1];

async function testSingleStep() {
    console.log("=== SINGLE-STEP TEST ===");
    console.log("This tests generating a coloring page directly in ONE API call.\n");

    // Read the test image
    const imagePath = path.join(__dirname, 'ali.jpg');
    if (!fs.existsSync(imagePath)) {
        console.error("ERROR: ali.jpg not found in project root. Please add a test image.");
        return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append("image", blob, "test.jpg");
    formData.append("model", "gpt-image-1");
    formData.append("prompt", "Transform this person into a black and white coloring book page. Disney Pixar inspired character style with bold, clean outlines. No shading, no grayscale, pure white background. The character should be recognizable from the original photo but simplified for a children's coloring book.");
    formData.append("output_format", "png");
    // No streaming for simpler test

    console.log("Sending request to OpenAI (single step)...");
    const startTime = Date.now();

    try {
        const response = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: formData
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`ERROR: ${response.status} - ${errText}`);
            return;
        }

        const data = await response.json();
        console.log(`\n✅ SUCCESS in ${elapsed}s`);

        // Save the result
        if (data.data && data.data[0]) {
            let base64 = data.data[0].b64_json || data.data[0].image;
            if (base64) {
                const outputPath = path.join(__dirname, 'test_single_step_output.png');
                fs.writeFileSync(outputPath, Buffer.from(base64, 'base64'));
                console.log(`📁 Output saved to: ${outputPath}`);
                console.log("\nOpen this file to compare quality with the two-step approach!");
            }
        }

    } catch (err) {
        console.error("Request failed:", err.message);
    }
}

testSingleStep();
