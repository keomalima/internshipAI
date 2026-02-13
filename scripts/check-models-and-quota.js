/* eslint-disable @typescript-eslint/no-require-imports */
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// List of models to test
const modelsToTest = [
    // Latest models
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-exp-1206",

    // Gemini 1.5 series
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",

    // Gemini 1.0 series
    "gemini-1.0-pro",
    "gemini-pro",

    // Experimental
    "gemini-pro-vision",
];

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        const response = await result.response;
        const text = response.text();
        return { success: true, response: text.substring(0, 50) };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function checkModelsAndQuota() {
    console.log("🔍 Checking Gemini Models and Quota...\n");
    console.log("=".repeat(80));

    const results = {
        available: [],
        unavailable: [],
        errors: []
    };

    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName}... `);
        const result = await testModel(modelName);

        if (result.success) {
            console.log("✅ Available");
            results.available.push(modelName);
        } else {
            console.log(`❌ ${result.error}`);
            results.unavailable.push({ model: modelName, error: result.error });

            // Check if it's a quota issue
            if (result.error.includes("quota") || result.error.includes("RESOURCE_EXHAUSTED")) {
                results.errors.push({ model: modelName, type: "quota", error: result.error });
            } else if (result.error.includes("404") || result.error.includes("not found")) {
                results.errors.push({ model: modelName, type: "not_found", error: result.error });
            }
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n📊 SUMMARY\n");

    console.log(`✅ Available Models (${results.available.length}):`);
    if (results.available.length > 0) {
        results.available.forEach(model => {
            console.log(`   • ${model}`);
        });
    } else {
        console.log("   None");
    }

    console.log(`\n❌ Unavailable Models (${results.unavailable.length}):`);
    if (results.unavailable.length > 0) {
        results.unavailable.forEach(({ model, error }) => {
            console.log(`   • ${model}`);
            console.log(`     Reason: ${error}`);
        });
    } else {
        console.log("   None");
    }

    // Quota analysis
    const quotaIssues = results.errors.filter(e => e.type === "quota");

    console.log("\n📈 QUOTA STATUS:");
    if (quotaIssues.length > 0) {
        console.log("   ⚠️  Quota issues detected for:");
        quotaIssues.forEach(({ model }) => console.log(`      • ${model}`));
    } else {
        console.log("   ✅ No quota issues detected");
    }

    console.log("\n💡 RECOMMENDATIONS:");
    if (results.available.length > 0) {
        console.log(`   • Use: ${results.available[0]} (currently available)`);
        console.log(`   • Your project is using: gemini-2.0-flash`);
        if (results.available.includes("gemini-2.0-flash")) {
            console.log("   ✅ Your current model is available!");
        } else {
            console.log("   ⚠️  Your current model may not be available. Consider switching to:");
            console.log(`      ${results.available[0]}`);
        }
    }

    console.log("\n🔗 For more information:");
    console.log("   • API Documentation: https://ai.google.dev/gemini-api/docs");
    console.log("   • Quota Management: https://aistudio.google.com/app/apikey");
    console.log("   • Model Comparison: https://ai.google.dev/gemini-api/docs/models/gemini");

    console.log("\n" + "=".repeat(80));
}

checkModelsAndQuota().catch(console.error);
