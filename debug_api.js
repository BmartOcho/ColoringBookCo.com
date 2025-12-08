
const fs = require('fs');

async function test() {
    const filePath = "C:/Users/Benjamin/.gemini/antigravity/brain/6e7e6a29-8228-4899-b5ed-0aa1ba5dfbed/uploaded_image_1764960381469.png";
    if (!fs.existsSync(filePath)) {
        console.error("File not found");
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', blob, 'test.png');

    console.log("Sending request to http://localhost:3000/api/generate...");
    try {
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            body: formData
        });

        console.log('Status code:', res.status);
        const text = await res.text();
        console.log('Raw Response Body:', text);

        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Response is not JSON');
        }

    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

test();
