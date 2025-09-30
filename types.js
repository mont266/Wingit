/**
 * @typedef {object} Flight
 * @property {string} id
 * @property {string} date - YYYY-MM-DD
 * @property {string} from - Departure airport IATA code (e.g., SFO)
 * @property {string} to - Arrival airport IATA code (e.g., JFK)
 * @property {string} fromName - Full departure airport name
 * @property {string} toName - Full arrival airport name
 * @property {string} [fromICAO] - Departure airport ICAO code
 * @property {string} [toICAO] - Arrival airport ICAO code
 * @property {string} airline
 * @property {string} flightNumber
 * @property {string} aircraft
 * @property {number} distance - in kilometers
 * @property {number} duration - in minutes
 */

/**
 * @typedef {object} Airline
 * @property {string} name
 * @property {string} iata
 */

/**
 * @typedef {object} Airport
 * @property {string} iata
 * @property {string} [icao]
 * @property {string} name
 * @property {string} city
 * @property {string} country
 * @property {number} lat
 * @property {number} lon
 */

// A list of some of the world's major airlines
export const COMMON_AIRLINES = [
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