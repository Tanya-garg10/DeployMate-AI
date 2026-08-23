import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Models prioritized by speed and stability to avoid 503 spikes in demand
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip Markdown code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGeminiJson<T>(prompt: string, fallback: T): Promise<T> {
  const client = getGeminiClient();
  if (!client) {
    return fallback;
  }

  // Iterate over candidate models with retries on 503 / 429
  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const rawText = response.text;
        if (rawText) {
          const cleaned = cleanJsonString(rawText);
          if (cleaned) {
            try {
              return JSON.parse(cleaned) as T;
            } catch (parseErr) {
              console.warn(`[AI Service] JSON parse warning on ${modelName}:`, parseErr);
            }
          }
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isTransient) {
          console.warn(
            `[AI Service] Model ${modelName} attempt ${attempt} returned transient overload (${isTransient ? '503/429' : 'error'}). Retrying/fallback.`
          );
          if (attempt < 2) {
            await sleep(attempt * 400);
            continue;
          }
        } else {
          console.warn(`[AI Service] Model ${modelName} error:`, errMsg);
          break; // proceed to next candidate model
        }
      }
    }
  }

  // If all candidate models encounter issues, safely return fallback object
  return fallback;
}
