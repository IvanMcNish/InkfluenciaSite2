import { GoogleGenAI, Type } from "@google/genai";

type DesignAnalysis = {
  name: string;
  description: string;
  suggestion: string;
};

function getClient() {
  const apiKey = (process.env.API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Gemini init error:", e);
    return null;
  }
}

export async function analyzeDesign(base64Image: string): Promise<DesignAnalysis> {
  const ai = getClient();

  // ✅ No key / no client: fallback (evita pantalla en blanco en Pages)
  if (!ai) {
    return {
      name: "Diseño Personalizado",
      description: "Una pieza única creada por ti.",
      suggestion: "Ideal para cualquier ocasión casual.",
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image.split(",")[1],
            },
          },
          {
            text:
              "Eres un experto en moda streetwear. Analiza esta imagen que se usará como diseño para una camiseta. " +
              "Proporciona un nombre creativo para el diseño, una breve descripción de marketing de 2 frases y una sugerencia de estilo " +
              "(ej. 'combina bien con jeans rotos'). Responde en formato JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Nombre creativo para el diseño.",
            },
            description: {
              type: Type.STRING,
              description: "Descripción de marketing de 2 frases.",
            },
            suggestion: {
              type: Type.STRING,
              description: "Sugerencia de estilo.",
            },
          },
          required: ["name", "description", "suggestion"],
        },
      },
    });

    const jsonStr = response.text || "{}";
    const parsed = JSON.parse(jsonStr);

    // ✅ normaliza si Gemini devuelve algo raro
    return {
      name: String(parsed?.name ?? "Diseño Personalizado"),
      description: String(parsed?.description ?? "Una pieza única creada por ti."),
      suggestion: String(parsed?.suggestion ?? "Ideal para cualquier ocasión casual."),
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      name: "Diseño Personalizado",
      description: "Una pieza única creada por ti.",
      suggestion: "Ideal para cualquier ocasión casual.",
    };
  }
}
