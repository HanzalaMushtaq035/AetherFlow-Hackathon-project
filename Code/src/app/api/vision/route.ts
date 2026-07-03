import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, imageBase64, imageMimeType } = body;

    if (!prompt && !imageBase64) {
      return NextResponse.json({ error: "No input provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured." }, { status: 500 });
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are a service orchestration AI that extracts structured data from user requests.
The user may provide text, an image, or both. Analyze everything provided.

From the input, extract:
1. service: The type of service needed (e.g., "AC Repair", "Plumber", "Electrician", "Bike Mechanic", "Carpenter", "Cleaner", "Beautician", "Tutor")
2. category: The broader category (e.g., "Home Maintenance", "Vehicle Repair", "Personal Care", "Education")
3. issue: A brief description of the problem (e.g., "AC leaking water", "Pipe burst", "Flat tire")
4. city: The city name if mentioned (e.g., "Lahore", "Islamabad", "Karachi")
5. sector: The neighborhood/sector/area (e.g., "Pak Arab F1 Block", "G-10", "Gulberg", "DHA Phase 5")
6. street: Street name/number if mentioned
7. house_no: House or flat number if mentioned
8. address: Full combined address string
9. urgency: One of: "low", "medium", "high", "urgent"
10. schedule: When the service is needed (e.g., "Now", "Today", "Tomorrow Morning")

For images:
- If you see an AC unit, air conditioner, or cooling system → service: "AC Repair"
- If you see pipes, water damage, leaks → service: "Plumber"  
- If you see electrical panels, wires, outlets → service: "Electrician"
- If you see a motorcycle, bike → service: "Bike Mechanic"
- If you see broken furniture, wood → service: "Carpenter"
- If you see a dirty room, mess → service: "Cleaner"
- If you see beauty/grooming items → service: "Beautician"

Respond ONLY in valid JSON format with exactly these keys:
{"service": "", "category": "", "issue": "", "city": "", "sector": "", "street": "", "house_no": "", "address": "", "urgency": "", "schedule": ""}

If a field cannot be determined, use an empty string "".
Understand English, Urdu, and Roman Urdu (e.g., "AC ka masla" means "AC problem", "bijli ka masla" means "electrical problem").`;

    // Build multimodal parts
    const parts: any[] = [{ text: systemPrompt }];

    if (prompt) {
      parts.push({ text: `\n\nUser request: "${prompt}"` });
    }

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: imageBase64,
        },
      });
      if (!prompt) {
        parts.push({ text: "\n\nAnalyze the image above and determine what service is needed." });
      }
    }

    // 15-second timeout
    const result = await Promise.race([
      model.generateContent(parts),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout")), 15000)
      ),
    ]);

    const text = result.response.text();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, extraction: parsed });
  } catch (error: any) {
    console.error("Gemini Vision API error:", error);
    return NextResponse.json(
      { error: error.message || "Vision analysis failed." },
      { status: 500 }
    );
  }
}
