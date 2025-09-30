export interface Flight {
  id: string;
  date: string; // YYYY-MM-DD
  from: string; // Departure airport IATA code (e.g., SFO)
  to: string; // Arrival airport IATA code (e.g., JFK)
  fromName: string; // Full departure airport name
  toName: string; // Full arrival airport name
  fromICAO?: string; // Departure airport ICAO code
  toICAO?: string; // Arrival airport ICAO code
  airline: string;
  flightNumber: string;
  aircraft: string;
  distance: number; // in kilometers
  duration: number; // in minutes
}

export interface Airline {
  name: string;
  iata: string;
}

export interface Airport {
  iata: string;
  icao?: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

// A list of some of the world's major airlines
export const COMMON_AIRLINES: Airline[] = [
    { name: "American Airlines", iata: "AA" },
    { name: "Delta Air Lines", iata: "DL" },
    { name: "United Airlines", iata: "UA" },
    { name: "Southwest Airlines", iata: "WN" },
    { name: "Lufthansa", iata: "LH" },
    { name: "British Airways", iata: "BA" },
    { name: "Air France", iata: "AF" },
    { name: "KLM", iata: "KL" },
    { name: "Emirates", iata: "EK" },
    { name: "Qatar Airways", iata: "QR" },
    { name: "Singapore Airlines", iata: "SQ" },
    { name: "Cathay Pacific", iata: "CX" },
    { name: "Qantas", iata: "QF" },
    { name: "ANA (All Nippon Airways)", iata: "NH" },
    { name: "JAL (Japan Airlines)", iata: "JL" },
    { name: "Turkish Airlines", iata: "TK" },
    { name: "Ryanair", iata: "FR" },
    { name: "EasyJet", iata: "U2" },
    { name: "Air Canada", iata: "AC" },
    { name: "LATAM Airlines", iata: "LA" },
];