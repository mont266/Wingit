import { GoogleGenAI, Type } from '@google/genai';
import { COMMON_AIRLINES } from '../types.js';

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

const flightSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: 'The flight date in YYYY-MM-DD format.' },
    from: { type: Type.STRING, description: 'The 3-letter IATA code for the departure airport.' },
    to: { type: Type.STRING, description: 'The 3-letter IATA code for the arrival airport.' },
    fromName: { type: Type.STRING, description: 'The full name of the departure airport, including the city (e.g., "London Heathrow Airport").' },
    toName: { type: Type.STRING, description: 'The full name of the arrival airport, including the city (e.g., "New York JFK Airport").' },
    fromICAO: { type: Type.STRING, description: 'The 4-letter ICAO code for the departure airport.' },
    toICAO: { type: Type.STRING, description: 'The 4-letter ICAO code for the arrival airport.' },
    airline: { type: Type.STRING, description: 'The name of the airline.' },
    flightNumber: { type: Type.STRING, description: 'The flight number, including the airline prefix if available.' },
    aircraft: { type: Type.STRING, description: 'The aircraft type, e.g., Boeing 787-9.' },
    distance: { type: Type.NUMBER, description: 'The flight distance in kilometers.' },
    duration: { type: Type.NUMBER, description: 'The flight duration in total minutes.' },
  },
  required: ['date', 'from', 'to', 'fromName', 'toName', 'airline', 'flightNumber', 'aircraft', 'distance', 'duration']
};

export const findFlightDetailsWithGemini = async (
  airline,
  flightNumber,
  date
) => {
  if (!isGeminiConfigured) {
    throw new Error('Gemini API key is not configured. Cannot find flight details.');
  }

  const prompt = `Find the flight details for ${airline} flight ${flightNumber} on ${date}. Return the departure and arrival airport IATA and ICAO codes, and the full airport names including the city.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a flight data API. Your task is to find and return accurate historical flight details based on the user's query. You must return the data in the specified JSON format. If you cannot find the exact flight, state that the flight could not be found.",
        responseMimeType: 'application/json',
        responseSchema: flightSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("The API returned an empty response.");
    }

    const flightData = JSON.parse(jsonText);

    // Basic validation to ensure the returned data is reasonable
    if (!flightData.from || !flightData.to || !flightData.date) {
        throw new Error("The API returned incomplete flight data.");
    }
    
    // The API might return the flight number without the airline prefix, so let's ensure it's consistent.
    if (!flightData.flightNumber.includes(flightData.airline.substring(0,2).toUpperCase())) {
        const airlineIata = COMMON_AIRLINES.find(a => a.name === flightData.airline)?.iata || '';
        flightData.flightNumber = `${airlineIata}${flightData.flightNumber}`;
    }

    return flightData;

  } catch (error) {
    console.error('Gemini API Error:', error);
    // Re-throw a more user-friendly error message
    throw new Error('Could not retrieve flight information from the AI. The flight may be too old or uncommon.');
  }
};