
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing. Add it to your environment or .env.local");
}

const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({ model: modelName });
export { modelName as geminiModelName };
