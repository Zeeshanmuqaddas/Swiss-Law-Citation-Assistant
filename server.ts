import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import nodemailer from "nodemailer";
import "./src/server/orchestrator/worker";
import "./src/server/email-worker/worker";
import { apiGatewayRouter } from "./src/server/api-gateway/routes";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Use the shared Gemini client approach
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Conditionally configure nodemailer transporter if env variables provided
  const hasMailConfig = !!process.env.SMTP_SERVER && !!process.env.SMTP_PORT && !!process.env.EMAIL_ADDRESS;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Simulate Agentic Architecture Pipeline via Gemini Structured Responses
  app.post("/api/research", async (req, res) => {
    try {
      const { query } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an enterprise-grade AI-powered Swiss Law Citation Assistant.
A user asked the following legal question:
"${query}"

Perform the following agentic pipeline steps:
1. Query Understanding & Multilingual Expansion: Understand the English legal concept and translate to Swiss German and French terminology. 
2. Hybrid Retrieval Simulation: Find the most relevant Swiss legal citations (e.g., OR, ZGB, BGE decisions) using your deep knowledge of Swiss law. Provide realistic citations and explanations.
3. Reranking & Normalization: Ensure citations match standard Swiss formats (e.g. BGE 145 III 63). If you generate malformed ones internally, auto-correct them and show confidence.
4. Explainability & Temporal Analysis: Explain *why* the citation is relevant and provide temporal context (historical vs modern validity).
5. Output format follows exactly this structure.

Important: You MUST ONLY Output JSON matching this schema exactly.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING },
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    citation: { type: Type.STRING },
                    confidence_score: { type: Type.NUMBER },
                    relevance_explanation: { type: Type.STRING },
                    temporal_context: { type: Type.STRING },
                    language_matches: {
                      type: Type.OBJECT,
                      properties: {
                        german: { type: Type.ARRAY, items: { type: Type.STRING } },
                        french: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  },
                  required: ["citation", "confidence_score", "relevance_explanation", "temporal_context", "language_matches"]
                }
              }
            },
            required: ["query", "results"]
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("No response from AI");
      const data = JSON.parse(text);
      res.json(data);
    } catch (err: any) {
      console.error("Research error:", err);
      res.status(500).json({ error: err.message || "Failed to process query" });
    }
  });
  
  // Multi-Agent System Orchestrator Pipeline
  app.post("/api/multi-agent", async (req, res) => {
    try {
      const { query } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are the Orchestrator Agent of an advanced autonomous multi-agent Swiss legal intelligence system.
A user has submitted the following legal scenario/query:
"${query}"

Coordinate the execution of your sub-agents to analyze this query. Provide a JSON response structured exactly as follows:
- "retrieval_agent": Retrieves exact relevant Swiss legal statutes and codes (e.g., OR, ZGB, BV). Provide a list of citations and short explanations.
- "precedent_agent": Analyzes historical Swiss legal cases (BGEs). Provide a summary of how courts have ruled on similar issues, extracting reasoning trends.
- "compliance_agent": Evaluates if the scenario complies with Swiss law. Flags legal risks (low, medium, high) and violations.
- "simulation_agent": Runs a "what-if" scenario if a key fact changed, predicting the legal outcome. Provide the scenario and predicted outcome.
- "explainable_summary": A final merged explanation summarizing the findings of all agents for the end user in a clear, narrative format, explaining the reasoning chain.

Important: You MUST ONLY output JSON matching this exact schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              retrieval_agent: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    citation: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["citation", "explanation"]
                }
              },
              precedent_agent: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  key_cases: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        case_citation: { type: Type.STRING },
                        ruling_trend: { type: Type.STRING }
                      },
                      required: ["case_citation", "ruling_trend"]
                    }
                  }
                },
                required: ["summary", "key_cases"]
              },
              compliance_agent: {
                type: Type.OBJECT,
                properties: {
                  overall_risk_level: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
                  assessment: { type: Type.STRING },
                  flagged_risks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["overall_risk_level", "assessment", "flagged_risks"]
              },
              simulation_agent: {
                type: Type.OBJECT,
                properties: {
                  what_if_scenario: { type: Type.STRING },
                  predicted_outcome: { type: Type.STRING }
                },
                required: ["what_if_scenario", "predicted_outcome"]
              },
              explainable_summary: {
                type: Type.STRING
              }
            },
            required: ["retrieval_agent", "precedent_agent", "compliance_agent", "simulation_agent", "explainable_summary"]
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("No response from AI");
      const data = JSON.parse(text);
      res.json(data);
    } catch (err: any) {
      console.error("Multi-Agent error:", err);
      res.status(500).json({ error: err.message || "Failed to process multi-agent pipeline" });
    }
  });

  app.use("/api", apiGatewayRouter);

  app.post("/api/tutor", async (req, res) => {
    try {
      const { citation, mode } = req.body;
      const modeInstruction = mode === "beginner" ? "Explain it simply for a beginner/student." : "Provide an advanced professional legal breakdown.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an educational AI legal tutor specializing in Swiss Law.
Explain the following Swiss legal citation: "${citation}".
Mode: ${mode} (${modeInstruction})

Provide a comprehensive, clear, and engaging explanation including the context of the law, its historical application, and practical implications.
Use Markdown formatting.`,
      });
      res.json({ result: response.text });
    } catch (err: any) {
      console.error("Tutor error:", err);
      res.status(500).json({ error: err.message || "Failed to generate tutor response." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note Express v4 style catch-all, if upgrading to v5 use '*all'
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
