import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runLegalSummarizer(query: string, context: any): Promise<string> {
  const summarizerResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are a Legal Summarizer Agent in a multi-agent system.
Analyze this legal query and context, producing a structured Legal Interpretation Summary.

Query: ${query}
Context: ${JSON.stringify(context || {})}

Format exactly as follows:
Legal Interpretation Summary:
- Issue Identified: [Core legal issue]
- Relevant Area: [Swiss legal domains]
- Preliminary Assessment: [Initial legal thought]
- Risk Level: [Low/Medium/High/Critical]`
  });
  
  return summarizerResponse.text || "Summary generation failed.";
}
