import { GoogleGenerativeAI } from "@google/generative-ai";

import { GoogleGenAI } from '@google/genai';

async function main() {
  const ai = new GoogleGenAI({
    apiKey: 'API',
  });

  const model = "gemini-2.5-flash";

  const contents = [
    {
      role: "user",
      parts: [{ text: "Explain AQI in simple words" }],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    contents,
  });

  for await (const chunk of response) {
    process.stdout.write(chunk.text ?? "");
  }
}

main();

