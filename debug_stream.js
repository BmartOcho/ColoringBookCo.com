
const fs = require('fs');

async function testStream() {
    const filePath = "C:/Users/Benjamin/.gemini/antigravity/brain/6e7e6a29-8228-4899-b5ed-0aa1ba5dfbed/uploaded_image_1764960381469.png";
    if (!fs.existsSync(filePath)) {
        console.error("Test image not found at " + filePath);
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', blob, 'test.png');

    console.log("Sending POST to http://localhost:3000/api/generate (SSE)...");

    try {
        const response = await fetch("http://localhost:3000/api/generate", {
            method: "POST",
            body: formData,
        });

        console.log("Response Status:", response.status);

        if (!response.body) {
            console.error("No response body!");
            return;
        }

        console.log("--- Streaming Response ---");
        const decoder = new TextDecoder();
        for await (const chunk of response.body) {
            process.stdout.write(decoder.decode(chunk));
        }
        console.log("\n--------------------------");

    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testStream();
