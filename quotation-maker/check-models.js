const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load env if possible or just use the key directly for this test script
// Please replace with your actual key if running manually, or we'll assume it's set in env
const apiKey = "REDACTED_API_KEY";

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client
        // Actually the SDK doesn't have a direct 'listModels' on the instance easily exposed in all versions, 
        // but usually it's on the class or via a different endpoint.
        // Let's rely on the error message suggestion: "Call ListModels"

        // We can't easily call ListModels via this high-level SDK in a script without some setup.
        // Instead, let's try to hit the REST API directly to be minimal.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
