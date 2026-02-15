// api/recommend.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { prompt, genres, type } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server Error: API Key missing in Vercel Settings." });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const finalPrompt = `
      Act as a high-end movie recommendation engine.
      User Context:
      - Vibe/Request: "${prompt || 'Surprise me'}"
      - Selected Genres: ${genres ? genres.join(", ") : "Any"}
      - Type: ${type || 'Movie'}

      Task: Recommend exactly ONE perfect title.
      Output: Strictly JSON. No Markdown.
      {
        "title": "Exact Title",
        "year": "YYYY",
        "reason": "A sophisticated, intriguing one-sentence reason why this fits."
      }
    `;

    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.status(200).json(JSON.parse(cleanText));

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "The Oracle is confused." });
  }
}
