import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.API_KEY;

export const isGeminiConfigured = !!(apiKey && !apiKey.includes('placeholder'));

if (!isGeminiConfigured) {
    console.error(
        "CRITICAL: Missing Gemini API Key. Please provide API_KEY in your environment variables. " +
        "AI-powered features will not function."
    );
}

// Use a placeholder key to prevent the constructor from throwing an error and crashing the app.
const ai = new GoogleGenAI({ apiKey: apiKey || 'placeholder-api-key' });

const coordinatesSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      iata: { type: Type.STRING, description: 'The 3-letter IATA code for the airport.' },
      lat: { type: Type.NUMBER, description: 'The latitude of the airport.' },
      lon: { type: Type.NUMBER, description: 'The longitude of the airport.' },
    },
    required: ['iata', 'lat', 'lon']
  }
};

export const getAirportCoordinates = async (
  iataCodes
) => {
  if (iataCodes.length === 0) {
    return {};
  }

  if (!isGeminiConfigured) {
    throw new Error('Gemini API key is not configured. Cannot get airport coordinates.');
  }
  
  const uniqueIataCodes = [...new Set(iataCodes)];
  const prompt = `For the following airport IATA codes, provide their latitude and longitude coordinates: ${uniqueIataCodes.join(', ')}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a geographical data API. Your task is to return accurate coordinates for given airport IATA codes in the specified JSON format. If you cannot find coordinates for a specific code, omit it from your response.",
        responseMimeType: 'application/json',
        responseSchema: coordinatesSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("The AI API returned an empty response for coordinates.");
    }
    
    const coordsArray = JSON.parse(jsonText);

    const coordsMap = coordsArray.reduce((acc, curr) => {
        acc[curr.iata] = { lat: curr.lat, lon: curr.lon };
        return acc;
    }, {});
    
    return coordsMap;

  } catch (error) {
    console.error('Gemini API Error (Coordinates):', error);
    throw new Error('Could not retrieve airport coordinates from the AI.');
  }
};