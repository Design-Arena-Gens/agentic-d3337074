import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type RequestPayload = {
  topic?: string;
  tone?: string;
  duration?: string;
  audience?: string;
};

type GeminiResult = {
  title: string;
  description: string;
  script: string;
  shotIdeas: string[];
  hashtags: string[];
  callToAction: string;
};

const MODEL_NAME = "gemini-1.5-pro";

const sanitizeJson = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const firstFence = lines.findIndex((line) => line.trim().startsWith("```"));
    const secondFence = lines.findIndex(
      (line, index) => index > firstFence && line.trim().startsWith("```")
    );
    if (firstFence !== -1 && secondFence !== -1 && secondFence > firstFence) {
      return lines.slice(firstFence + 1, secondFence).join("\n");
    }
    return lines.slice(firstFence + 1).join("\n");
  }
  return trimmed;
};

const validateResult = (data: GeminiResult): GeminiResult => {
  if (
    typeof data.title !== "string" ||
    typeof data.description !== "string" ||
    typeof data.script !== "string" ||
    !Array.isArray(data.shotIdeas) ||
    !Array.isArray(data.hashtags) ||
    typeof data.callToAction !== "string"
  ) {
    throw new Error("Gemini response missing fields");
  }
  return {
    ...data,
    shotIdeas: data.shotIdeas.map((item) => String(item)),
    hashtags: data.hashtags.map((item) => (String(item).startsWith("#") ? item : `#${item}`))
  };
};

export async function POST(request: Request) {
  try {
    const { topic, tone, duration, audience } = (await request.json()) as RequestPayload;

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing GEMINI_API_KEY environment variable" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
You are an elite short-form video strategist. Build a complete creative package for a YouTube Short.

Constraints:
- Keep runtime around ${duration || "45"} seconds
- Tone: ${tone || "Energetic"}
- Target audience: ${audience || "General YouTube viewers"}
- Deliver a punchy hook in the first 3 seconds
- End with a compelling call to action that feels natural, not salesy

Respond with strict JSON in the following shape:
{
  "title": "Optimized short headline under 60 characters",
  "description": "2 paragraph description. Include CTA + hashtags.",
  "script": "Script broken into numbered beats with timing cues.",
  "shotIdeas": ["Shot idea with framing and motion", "..."],
  "hashtags": ["#shorts", "#topicKeyword", "..."],
  "callToAction": "Direct CTA phrase"
}

Topic / Hook: ${topic}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonPayload = sanitizeJson(responseText);
    const parsed = JSON.parse(jsonPayload) as GeminiResult;
    const validated = validateResult(parsed);

    return NextResponse.json({ success: true, data: validated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
