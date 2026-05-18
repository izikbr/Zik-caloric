import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/nutrition/analyze-photo", async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) return res.status(400).json({ error: "Image is required" });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image } },
          { text: prompt || "Analyze this food photo. List the items, estimate portions, calories, protein, carbs, and fat. Focus on Israeli foods and Hebrew output. Respond in JSON format." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            description: { type: Type.STRING },
            isIsraeliFood: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["foodName", "calories", "protein", "carbs", "fat"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/nutrition/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "אתה מאמן תזונה חכם, מעודד ומקצועי בשם 'קלוריה AI'. הענק עצות תזונה, הצע מאכלים עתירי חלבון, ועזור למשתמשים להגיע למטרותיהם (ירידה במשקל, עלייה במסת שריר). דבר בעברית טבעית, כולל סלנג ישראלי כשצריך. אם שואלים על אוכל ישראלי, דע לנתח מנות כמו שווארמה, פלאפל, וקוטג'. היה מנומס אך תכליתי.",
      }
    });

    // Simple history conversion if provided
    // For now just send the message
    const result = await chat.sendMessage({ message });
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/nutrition/parse-text", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this food entry: "${text}". Estimate calories, protein, carbs, fat, and fiber. Return a JSON object with foodName, calories, protein, carbs, fat, fiber. Language is Hebrew.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER }
          },
          required: ["foodName", "calories", "protein", "carbs", "fat"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini Parse Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
