
import { GoogleGenAI } from "@google/genai";

// Assume process.env.API_KEY is configured in the environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this simulation, we'll log a warning.
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getAdminAdvice = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return "AI Advisor is unavailable. Please configure your API key.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [{
          text: `As an expert in managing informal rotating savings and credit associations (ROSCAs) like the Ethiopian Equb, provide concise, actionable advice for the following situation:\n\nSITUATION: "${prompt}"\n\nADVICE:`
        }]
      }],
      config: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 200,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I couldn't generate advice at the moment. Please check the console for errors.";
  }
};
