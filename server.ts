import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client to prevent crash on startup if API key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// System instruction helper based on workspace options
function getSystemInstruction(option: string): string {
  switch (option) {
    case "brainstorm":
      return "You are an expert brainstorming and ideation partner. Provide creative, innovative, and lateral insights. Format with crisp headings, bullet points, and brief, highly engaging paragraphs.";
    case "explain":
      return "You are a master educator. Break down complex topics into incredibly simple, intuitive concepts, analogies, and step-by-step details. Avoid unnecessarily technical jargon unless requested.";
    case "polish":
      return "You are a world-class professional editor. Rewrite, structure, and embellish the provided text. Focus on sentence flow, perfect grammar, compelling vocabulary, and layout clarity.";
    case "action-plan":
      return "You are a strict project manager. Convert the user's concept into a structured, chronologically sorted, highly specific action plan with milestones and risk metrics.";
    default:
      return "You are a helpful, professional, and intelligent AI companion in a smart workspace. Deliver precise, constructive, and beautifully formatted markdown responses.";
  }
}

// Endpoint 1: General Smart Interaction / Brainstorming
app.post("/api/gemini/interact", async (req, res) => {
  try {
    const { prompt, option = "custom" } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
       res.status(400).json({ error: "No prompt was provided." });
       return;
    }

    const ai = getGeminiClient();
    const instruction = getSystemInstruction(option);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: instruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || "No response content generated." });
  } catch (error: any) {
    console.error("Gemini interact endpoint error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI model." });
  }
});

// Endpoint 2: Refine Task / Goal Breakdown into structured subtasks
app.post("/api/gemini/refine-task", async (req, res) => {
  try {
    const { title, description = "" } = req.body;
    if (!title || typeof title !== "string" || title.trim() === "") {
       res.status(400).json({ error: "Task title is required for refinement." });
       return;
    }

    const ai = getGeminiClient();
    const prompt = `Break down the task "${title}" into structured subtasks. Description/Details provided: "${description}". Specify refined, clear actionable goals.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Break down the provided task title and description into actionable subtasks. Ensure subtasks are concise, specific, and doable. Output in JSON only.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["refinedDescription", "subtasks", "tip"],
          properties: {
            refinedDescription: {
              type: Type.STRING,
              description: "A polished and motivating 1-2 sentence description of the task."
            },
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of exactly 3-4 clear, actionable steps to complete this task."
            },
            tip: {
              type: Type.STRING,
              description: "A quick, clever, highly practical productivity tip specifically tailored to this task."
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini refine-task endpoint error:", error);
    res.status(500).json({ error: error.message || "Could not refine the task." });
  }
});

// Serve frontend assets via Vite middleware in dev or static files in production
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

setupVite().catch((err) => {
  console.error("Error setting up Vite dev server middleware:", err);
  process.exit(1);
});
