import { GoogleGenAI, Type } from "@google/genai";
import { HikingRecord } from "../types";

// Helper to generate UUIDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const parseHikingLogs = async (text: string): Promise<HikingRecord[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert data parser for outdoor activities. 
    Analyze the following text which contains hiking records. 
    Extract each trip into a structured object based on these specific dimensions:
    
    1. Date (YYYY-MM-DD). Infer year if missing.
    2. Name (Event name or main location name).
    3. Distance (km).
    4. Elevation Gain (m).
    5. Duration (Hours). Converting '3 hours 30 mins' to 3.5.
    6. Calories (kcal). If not explicitly stated, ESTIMATE it based on distance, elevation and duration (approx 60kcal/km + elevation factor).
    7. Start Point. (Infer if context allows, otherwise use "Unknown").
    8. End Point. (Infer if context allows, otherwise use "Unknown").
    9. Difficulty Score (0.0 to 3.0). 0.5 is easy/flat, 1.5 is moderate, 2.5 is hard, 3.0 is extreme/very difficult. Step 0.5.
    10. Scenery Score (0.0 to 3.0). 1 is average, 2 is good, 3 is world-class/breathtaking. Step 0.5.
    11. Notes/Summary.
    
    Return a JSON array.
    
    Input Text:
    "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "YYYY-MM-DD" },
              name: { type: Type.STRING, description: "Route or mountain name" },
              distanceKm: { type: Type.NUMBER },
              elevationGainM: { type: Type.NUMBER },
              durationHours: { type: Type.NUMBER, description: "Decimal hours" },
              calories: { type: Type.NUMBER, description: "Energy burned in kcal" },
              startPoint: { type: Type.STRING },
              endPoint: { type: Type.STRING },
              difficultyScore: { type: Type.NUMBER, description: "0-3 scale, step 0.5" },
              sceneryScore: { type: Type.NUMBER, description: "0-3 scale, step 0.5" },
              notes: { type: Type.STRING },
            },
            required: ["date", "name", "distanceKm", "elevationGainM", "durationHours", "calories", "startPoint", "endPoint", "difficultyScore", "sceneryScore", "notes"],
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "[]");
    
    // Enrich with IDs client-side
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return parsedData.map((record: any) => ({
      ...record,
      id: generateId(),
    }));

  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw new Error("AI 解析失败，请重试。");
  }
};