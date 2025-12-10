const fs = require('fs');

// 1. Read dummy image
const imgPath = "C:/Users/Benjamin/.gemini/antigravity/brain/a658a8ca-ebb4-483c-880f-89963c6abb80/dummy_upload_1765400151039.png";
const imgBase64 = fs.readFileSync(imgPath, { encoding: 'base64' });
const characterImage = `data:image/png;base64,${imgBase64}`;

async function callAPI(body) {
    try {
        const res = await fetch('http://localhost:3000/api/storyboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const text = await res.text(); // Consume body
    } catch (e) {
        console.error("API Call Failed:", e);
    }
}

async function run() {
    console.log("Starting story generation test...");

    // Start
    await callAPI({ action: 'start', storyType: 'adventure', characterName: 'Max' });

    // Interactions
    await callAPI({ action: 'continue', storyType: 'adventure', characterName: 'Max', interactionNumber: 1, userInput: 'A golden key', plotPoints: [] });
    await callAPI({ action: 'continue', storyType: 'adventure', characterName: 'Max', interactionNumber: 2, userInput: 'A giant wall', plotPoints: ['A golden key'] });
    await callAPI({ action: 'continue', storyType: 'adventure', characterName: 'Max', interactionNumber: 3, userInput: 'A small green alien named Zorg', plotPoints: ['A golden key', 'A giant wall'] });

    console.log("Triggering final generation (this may take 30-60s)...");

    const finalRes = await fetch('http://localhost:3000/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'continue',
            storyType: 'adventure',
            characterName: 'Max',
            characterDescription: 'A brave boy with messy hair',
            characterImage: characterImage,
            interactionNumber: 4,
            userInput: 'They fly over it',
            plotPoints: ['A golden key', 'A giant wall', 'A small green alien named Zorg']
        })
    });

    if (!finalRes.body) throw new Error("No response body");

    const reader = finalRes.body.getReader(); // Use Web Streams API (Node 18+)
    const decoder = new TextDecoder();
    let done = false;
    let jobId = null;

    while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
            const chunk = decoder.decode(value);
            // Look for complete event with jobId
            // Format: data: {"type":"complete","jobId":"..."}
            const match = chunk.match(/"jobId":"([^"]+)"/);
            if (match) jobId = match[1];

            if (chunk.includes('"type":"complete"')) {
                console.log("Generation Complete!");
                break;
            }
        }
    }

    if (jobId) {
        console.log(`JOB ID: ${jobId}`);
    } else {
        console.log("No job ID found in stream.");
    }
}

run().catch(console.error);
