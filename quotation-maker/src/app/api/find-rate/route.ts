import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai'; // Used for Groq too

// Initialize Gemini
const geminiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiKey);

// Initialize Groq (Free Tier Champion)
const groqKey = process.env.GROQ_API_KEY;
const groq = groqKey ? new OpenAI({
    apiKey: groqKey,
    baseURL: 'https://api.groq.com/openai/v1'
}) : null;


// Strategy: Prioritize Gemini with Search. Fallback to Groq (Fast/Free).
const ATTEMPTS = [
    { provider: 'gemini', model: 'gemini-2.5-flash', useTools: true },
    { provider: 'gemini', model: 'gemini-2.5-flash', useTools: false },
    { provider: 'gemini', model: 'gemini-2.0-flash-exp', useTools: true },

    // Groq Fallbacks (Excellent Free Tier)
    { provider: 'groq', model: 'llama-3.3-70b-versatile', useTools: false },
    { provider: 'groq', model: 'llama-3.1-8b-instant', useTools: false },
];

async function generateWithFallback(prompt: string) {
    let lastError = null;

    for (const attempt of ATTEMPTS) {
        // Retry logic: If rate limited, wait and try THIS model again before skipping
        for (let retry = 0; retry < 2; retry++) {
            try {
                if (retry > 0) console.log(`Retrying ${attempt.model}...`);
                else console.log(`Trying ${attempt.provider} model: ${attempt.model} (Tools: ${attempt.useTools})`);

                if (attempt.provider === 'gemini') {
                    const modelConfig: any = { model: attempt.model };
                    if (attempt.useTools) {
                        modelConfig.tools = [{
                            // @ts-ignore
                            googleSearch: {}
                        }];
                    }
                    const model = genAI.getGenerativeModel(modelConfig);
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }]
                    });
                    return result;
                }

                if (attempt.provider === 'groq') {
                    if (!groq) {
                        if (retry === 0) console.log("Groq Skipped: No API Key");
                        break;
                    }
                    const completion = await groq.chat.completions.create({
                        model: attempt.model,
                        messages: [
                            { role: "system", content: "You are a Procurement Expert. Return JSON only." },
                            { role: "user", content: prompt }
                        ],
                        response_format: { type: "json_object" }
                    });

                    return {
                        response: {
                            text: () => completion.choices[0].message.content || ""
                        }
                    };
                }

                break;
            } catch (error: any) {
                const isRateLimit = error.status === 429 || error.code === 'insufficient_quota';

                console.warn(`${attempt.provider} model ${attempt.model} attempt ${retry + 1} failed.`);
                console.error(`Error details:`, error.message || error);

                if (isRateLimit && retry === 0) {
                    console.log("Hit Rate Limit. Waiting 5s...");
                    await new Promise(r => setTimeout(r, 5000));
                    continue;
                }

                lastError = error;
                break;
            }
        }
    }

    throw lastError || new Error('All model attempts failed');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { itemName } = body;

        if (!itemName) {
            return NextResponse.json({ rate: 0 });
        }

        // Truncate item descriptions slightly less aggressively to allow Context + Item
        // 500 chars allows for Header + SubItem details while still being safe.
        const cleanItemName = itemName.length > 500 ? itemName.substring(0, 500) + '...' : itemName;

        const prompt = `
        Act as a Senior Procurement Expert for Construction & Fire Safety in India.
        Item: "${cleanItemName}"

        Task: Determine the Unit Rate (INR).

        PRICING GUIDELINES:
        1. **Brand Tiers:** 
           - 'Agni', 'LifeGuard', 'Kartar' are Mid-Range/Standard. Do not price them as Luxury/Imported.
           - 'Honeywell', 'Siemens', 'Bosch' are Premium.
        2. **Technical Specs:** 
           - Large sizes (100mm+) are expensive. Small sizes (15mm-25mm) are cheap.
           - "Agni Addressable MCP" is typically 1800-2800 INR. "Addressable Detector" is 1500-2500 INR.
        3. **Logic:** Return a **BALANCED ESTIMATE**. Do not overestimate excessively. Do not underestimate.
        4. **Composite:** If "Supply & Install" is mentioned, add ~20% to the hardware cost, but don't double it.

        Instructions:
        1. If Search available: Find real INR price.
        2. Else: Estimate based on Indian Market Standards.
        3. Return JSON.

        Output Schema:
        { "rate": number }
        `;

        const result = await generateWithFallback(prompt);

        const response = result.response;
        const text = response.text();

        if (!text) return NextResponse.json({ rate: 0 });

        console.log("AI Response:", text);

        try {
            const data = JSON.parse(text);
            return NextResponse.json({ rate: typeof data.rate === 'number' ? data.rate : 0 });
        } catch (e) {
            console.error("JSON Parse Error", e);
            const digits = text.match(/(\d+)/);
            return NextResponse.json({ rate: digits ? parseFloat(digits[0]) : 0 });
        }

    } catch (error: any) {
        console.error('Final Error finding rate:', error);

        const isQuota = error.status === 429 ||
            error.code === 'insufficient_quota' ||
            (error.message && error.message.toLowerCase().includes('quota'));

        return NextResponse.json(
            { rate: 0, error: isQuota ? 'Rate limit exceeded' : 'Rate lookup failed' },
            { status: isQuota ? 429 : 200 }
        );
    }
}
