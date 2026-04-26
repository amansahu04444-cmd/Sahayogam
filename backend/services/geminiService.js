import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const processWithGemini = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Extract structured information from the following text.

Return ONLY valid JSON with these fields:
- title
- description
- location
- category (Food, Health, Education, Disaster, Infrastructure)
- peopleAffected (number)
- priority (Low, Medium, High)

If any field is missing, intelligently अनुमान (infer) it.

Text:
"""
${text}
"""`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let output = response.text();

    // Remove markdown code block wrappers if Gemini adds them
    if (output.startsWith("\`\`\`json")) {
      output = output.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (output.startsWith("\`\`\`")) {
      output = output.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    return JSON.parse(output);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
