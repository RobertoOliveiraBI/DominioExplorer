import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ensure environment variable is used

export const generateSemanticKeywords = async (userQuery: string): Promise<string[]> => {
  if (!apiKey) {
    console.warn("API Key is missing. Semantic search will fallback to direct matching.");
    return [userQuery];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We want to translate a conceptual query (e.g., "loja de sapatos") into 
    // concrete substrings found in domains (e.g., "sapato", "calcado", "botas", "tenis", "foot").
    // We strictly request a JSON array of strings.
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a list of 5 to 10 short, relevant keywords (substrings) that might appear in a domain name based on this user concept: "${userQuery}". 
      Include synonyms, related terms, and variations in Portuguese (and English if relevant).
      Keep them short (e.g., 'auto' instead of 'automobilismo').
      Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            }
        }
      }
    });

    const text = response.text;
    if (!text) return [userQuery];

    const keywords = JSON.parse(text);
    
    // Always include the original term sanitized
    const sanitizedOriginal = userQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sanitizedOriginal && !keywords.includes(sanitizedOriginal)) {
        keywords.unshift(sanitizedOriginal);
    }

    return Array.isArray(keywords) ? keywords : [userQuery];

  } catch (error) {
    console.error("Error generating keywords:", error);
    // Fallback to the original query if AI fails
    return [userQuery];
  }
};