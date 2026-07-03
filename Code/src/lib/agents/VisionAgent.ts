import { GoogleGenerativeAI } from "@google/generative-ai";

export interface VisionDiagnosis {
  problem: string;
  description: string;
  category: "plumber" | "electrician" | "ac_technician" | "handyman";
  urgency: "low" | "medium" | "high";
  confidence: number;
  recommended_action: string;
}

const SYSTEM_PROMPT = `Analyze the uploaded maintenance/service image.
Identify the maintenance/service problem and generate a structured description.

Supported technician categories are strictly limited to:
- plumber
- electrician
- ac_technician
- handyman

Normalize categories strictly using these mapping rules:
- Pipes, water damage, leaks, seepage, plumbing joints, taps, toilets, drains -> "plumber"
- Electrical sockets, sparking, wires, panels, fuses, lighting sockets -> "electrician"
- Air conditioner units, outdoor units, split AC, HVAC, cooling issues -> "ac_technician"
- Any other minor repairs, door hinges, walls, paint, locks, general furniture, carpentry -> "handyman"

You must output a valid JSON string matching this schema:
{
  "problem": "Brief title of the diagnosed problem (e.g. 'Pipe leakage')",
  "description": "Concise details of the problem visible (e.g. 'Leakage from kitchen sink joints')",
  "category": "plumber" | "electrician" | "ac_technician" | "handyman",
  "urgency": "low" | "medium" | "high",
  "confidence": A decimal number between 0.0 and 1.0 estimating your diagnosis confidence,
  "recommended_action": "Suggested next repair step (e.g. 'Replace joint seals and tighten connection')"
}

Respond with STRICT JSON ONLY. Do not include markdown formatting, code blocks (such as \`\`\`json), comments, explanations, or any other prose. The response must be directly parsable as JSON.`;

export class VisionAgentClass {
  async execute(imageBase64: string, imageMimeType: string = "image/jpeg"): Promise<VisionDiagnosis> {
    console.log("[VisionAgent] Initializing Gemini image analysis...");
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // Fallback if API key is missing or Gemini fails
    const fallbackDiagnosis: VisionDiagnosis = {
      problem: "Unknown maintenance issue",
      description: "Could not confidently identify issue due to connection or parsing limitations.",
      category: "handyman",
      urgency: "low",
      confidence: 0.3,
      recommended_action: "Schedule manual visual inspection by technician."
    };

    if (!apiKey) {
      console.warn("[VisionAgent] Gemini API Key is missing. Returning fallback diagnosis.");
      return fallbackDiagnosis;
    }

    try {
      const ai = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.0-flash as the primary fast multimodal model
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

      const parts = [
        { text: SYSTEM_PROMPT },
        {
          inlineData: {
            mimeType: imageMimeType,
            data: imageBase64,
          },
        },
        { text: "\n\nAnalyze the image above and output strictly the JSON schema payload." }
      ];

      // 15-second timeout protection
      const result = await Promise.race([
        model.generateContent(parts),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini API call timed out")), 15000)
        ),
      ]);

      const text = result.response.text();
      console.log("[VisionAgent] Raw response text:", text);

      // Clean up response if wrapped in markdown code blocks
      let jsonStr = text.trim();
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr) as VisionDiagnosis;

      // Validate parsed category normalization
      const validCategories = ["plumber", "electrician", "ac_technician", "handyman"];
      if (!validCategories.includes(parsed.category)) {
        console.warn(`[VisionAgent] Unknown category "${parsed.category}" returned. Normalizing to handyman.`);
        parsed.category = "handyman";
      }

      // Validate parsed urgency normalization
      const validUrgencies = ["low", "medium", "high"];
      if (!validUrgencies.includes(parsed.urgency)) {
        parsed.urgency = "medium";
      }

      return parsed;

    } catch (err: any) {
      console.error("[VisionAgent] Image analysis failed:", err);
      return fallbackDiagnosis;
    }
  }

  validate() {
    return true;
  }

  log() {
    console.log("VisionAgent registered");
  }
}

const instance = new VisionAgentClass();
export default instance;
