
import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types.ts";

// Security Warning: API keys are passed through environment variables, please ensure not to commit .env files containing real keys to version control
// Development: Create .env file in project root and add GEMINI_API_KEY=your_key_here
// Production: Set GEMINI_API_KEY through system environment variables

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set. Please create a .env file with your Google Gemini API key.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateText = async (model: string, systemInstruction: string, prompt: string): Promise<string> => {
  // FIX: Removed fallback logic for when API key is missing, as per guidelines.
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate text from Gemini API.");
  }
};

export const generateImage = async (model: string, prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  // FIX: Removed fallback logic for when API key is missing, as per guidelines.
  try {
    const response = await ai.models.generateImages({
        model: model,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Gemini Image API Error:", error);
    throw new Error("Failed to generate image from Gemini API.");
  }
};