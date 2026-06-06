import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not defined in the environment variables.');
}

export const genAI = new GoogleGenerativeAI(apiKey);
export default genAI;
