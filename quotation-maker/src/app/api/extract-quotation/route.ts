import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiRateLimiter } from '@/utils/rateLimiter';

// Force Node.js runtime to support Buffer
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    console.log('API Request /api/extract-quotation STARTED');

    try {
        // 1. Rate Limiting Check
        const forwardedFor = request.headers.get('x-forwarded-for');
        const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : 'global';
        console.log(`Checking rate limit for IP: ${clientIP}`);

        const rateLimitResult = geminiRateLimiter.checkLimit(clientIP);
        if (!rateLimitResult.allowed) {
            console.warn(`Rate limit exceeded for IP: ${clientIP}`);
            return NextResponse.json(
                { error: rateLimitResult.message, retryAfter: rateLimitResult.retryAfter },
                { status: 429 }
            );
        }

        // 2. API Key Check
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('FATAL: GEMINI_API_KEY is missing');
            return NextResponse.json(
                { error: 'Server misconfiguration: API Key missing' },
                { status: 500 }
            );
        }

        // 3. Form Data Parsing
        console.log('Parsing form data...');
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('No file found in form data');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`File received: ${file.name}, Type: ${file.type}, Size: ${file.size}`);

        // 4. File Buffer Conversion
        console.log('Converting file to buffer...');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        console.log('File converted to base64');

        // 5. Gemini API Call
        console.log('Initializing Gemini client...');
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.5-flash as it appeared in the check-models list and likely has better limits than exp
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Extract structured data from this ${file.type.startsWith('image') ? 'image' : 'PDF'} BOQ (Bill of Quantities) or Quotation. 
        Return ONLY valid JSON. No markdown formatting.
        
        Target Structure:
        {
          "clientName": "string",
          "clientAddress": "string", 
          "quotationDate": "string (YYYY-MM-DD)",
          "items": [
            {
              "name": "string (Include item number e.g. '11.1 Description')",
              "quantity": number,
              "unit": "string",
              "rate": number,
              "amount": number
            }
          ],
          "subtotal": number,
          "discount": number,
          "gst": number,
          "total": number,
          "notes": "string"
        }

        Instructions:
        1. Structure Integrity: Capture items EXACTLY as listed with their original numbering.
        2. SKIP Document Titles: Lines like "FIRE FIGHTING WORK QUANTITY OF MATERIAL" or "BOQ FOR FIRE FIGHTING SYSTEM" that appear at the top as document titles should be SKIPPED entirely - do NOT include them as items.
        3. Section Headers: Section headers like "FIRE DETECTION & ALARM SYSTEM" that group items should be included WITH THEIR ORIGINAL NUMBER if they have one. Set Quantity = 0, Rate = 0, Amount = 0 for these.
        4. Pricing Logic: 
           - **HEADERS:** If an item is a descriptive header for subsequent sub-items (like "1 Supplying... pump" followed by "1.1 2280 lpm"), set **Quantity = 0**, Rate = 0, Amount = 0 for the header.
           - **SUB-ITEMS:** Ensure the specific billable sub-item (e.g. 1.1) has the correct Quantity and Rate.
        5. Serial Numbers: ALWAYS preserve the original item numbering (1, 1.1, 2, 2.1, 6.1, 6.6, etc.) in the name field.
        6. Inconsistent Numbering: Capture all text lines even if numbering is weird.
        7. Values: If rate/amount is blank or zero, use 0. However, if you are highly confident in a standard market rate (INR) for a common item, you MAY provide an estimate, but prefer 0 so the system can use the database price.
        8. Return the list in the exact order of the document.`;

        console.log('Sending request to Gemini...');
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ]);

        console.log('Received response from Gemini');
        const responseText = result.response.text();
        console.log('Raw AI Response length:', responseText.length);

        // 6. JSON Parsing
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanJson);

        console.log('JSON parsed successfully');

        // 7. Sanitization
        const sanitizedData = {
            clientName: data.clientName || '',
            clientAddress: data.clientAddress || '',
            quotationDate: data.quotationDate || new Date().toISOString().split('T')[0],
            items: Array.isArray(data.items) ? data.items.map((item: any) => {
                const qty = Number(item.quantity);
                return {
                    name: item.name || 'Unknown Item',
                    // Allow 0 as valid quantity for headers, default to 1 only if NaN or undefined
                    quantity: !isNaN(qty) ? qty : 1,
                    unit: item.unit || 'Each',
                    rate: Number(item.rate) || 0,
                    amount: Number(item.amount) || 0,
                };
            }) : [],
            subtotal: Number(data.subtotal) || 0,
            discount: Number(data.discount) || 0,
            gst: Number(data.gst) || 0,
            total: Number(data.total) || 0,
            notes: data.notes || '',
        };

        return NextResponse.json({ success: true, data: sanitizedData });

    } catch (error: any) {
        console.error('Detailed Error Trace:', error);

        // Return structured error
        return NextResponse.json(
            {
                error: error.message || 'An unexpected error occurred',
                details: error.toString()
            },
            { status: 500 }
        );
    }
}
