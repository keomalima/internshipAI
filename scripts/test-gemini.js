/* eslint-disable @typescript-eslint/no-require-imports */
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No GEMINI_API_KEY found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Quick sanity check with a known model

        // Better approach: SDK usually supports generic requests.
        // But for now, let's try to verify if the key works at all with 'embedding-001' or similar?
        // No, let's try to hit the API with a curl if the SDK is opaque.

        // Let's try gemini-1.5-flash-001 or gemini-1.0-pro

        console.log("Testing gemini-1.5-flash...");
        const model1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model1.generateContent("Hello");
        console.log("Success with gemini-1.5-flash");

    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }

    try {
        console.log("Testing gemini-pro...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model2.generateContent("Hello");
        console.log("Success with gemini-pro");
    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }

    try {
        console.log("Testing gemini-1.0-pro...");
        const model3 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        await model3.generateContent("Hello");
        console.log("Success with gemini-1.0-pro");
    } catch (error) {
        console.error("Error with gemini-1.0-pro:", error.message);
    }
}

listModels();
