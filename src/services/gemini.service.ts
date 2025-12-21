import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../constant";

const AI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function search(prompt: string) {
  const response = await AI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  return response;
}

export { AI, search };
