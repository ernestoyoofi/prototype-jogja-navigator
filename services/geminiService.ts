
import { GoogleGenAI, Type } from "@google/genai";
import { Spot } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const spotSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    address: { type: Type.STRING },
    description: { type: Type.STRING },
    cost: { type: Type.NUMBER },
    lat: { type: Type.NUMBER },
    lng: { type: Type.NUMBER },
    time: { type: Type.STRING },
  },
  required: ["id", "name", "address", "description", "cost", "lat", "lng"],
};

export async function getTravelAdvice(
  prompt: string, 
  history: {role: string, parts: {text: string}[]}[],
  location: {lat: number, lng: number} | null
): Promise<{ text: string; newSpots?: Spot[]; suggestions?: string[] }> {
  try {
    const currentTime = new Date().toLocaleString();
    const locationInfo = location ? `User current location: lat ${location.lat}, lng ${location.lng}.` : "User location unknown.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `You are Sugeng, a local guide in Yogyakarta. 
        Current Time: ${currentTime}.
        ${locationInfo}
        
        Rules:
        1. Always provide a helpful conversational response.
        2. When suggesting places, you MUST provide exactly 3 specific locations.
        3. If the user's prompt is too short or vague, include 3 follow-up suggestion chips in the "suggestions" field.
        4. Return JSON with: { "conversationalText": string, "spots": Array<Spot>, "suggestions": string[] }.
        5. Provide a clear 'address' for each spot.
        6. Coordinate range for Jogja: lat -7.7 to -7.9, lng 110.3 to 110.4.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conversationalText: { type: Type.STRING },
            spots: {
              type: Type.ARRAY,
              items: spotSchema
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["conversationalText"]
        }
      },
    });

    const result = JSON.parse(response.text || '{}');
    const newSpots: Spot[] = (result.spots || []).map((s: any) => ({
      id: s.id || Math.random().toString(36).substr(2, 9),
      name: s.name,
      address: s.address,
      description: s.description,
      cost: s.cost,
      coords: [s.lat, s.lng],
      time: s.time,
      isCompleted: false,
      rating: null
    }));

    return {
      text: result.conversationalText,
      newSpots: newSpots.length > 0 ? newSpots : undefined,
      suggestions: result.suggestions
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Waduh, Sugeng lagi sibuk sebentar. Coba lagi ya!" };
  }
}
