import { Flight } from '../types';

const parseDuration = (durationStr: string): number => {
  if (!durationStr) return 0;

  // Try parsing "Xh Ym" format (e.g., "1h 30m")
  const hoursMatch = durationStr.match(/(\d+)\s*h/);
  const minutesMatch = durationStr.match(/(\d+)\s*m/);
  if (hoursMatch || minutesMatch) {
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    return hours * 60 + minutes;
  }

  // Try parsing time formats like "HH:MM:SS" or "HH:MM"
  const timeParts = durationStr.split(':');
  if (timeParts.length === 2 || timeParts.length === 3) {
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      // The app model uses minutes, so seconds from HH:MM:SS are ignored.
      return hours * 60 + minutes;
    }
  }

  // Finally, try parsing as a raw number of minutes (e.g., "90")
  const totalMinutes = parseInt(durationStr, 10);
  if (!isNaN(totalMinutes)) {
    return totalMinutes;
  }

  return 0; // Return 0 if no format matches
};

interface LocationInfo {
    name: string;
    iata: string;
    icao?: string;
}

const parseLocation = (location: string): LocationInfo => {
    if (!location) return { name: 'N/A', iata: 'N/A' };

    // Regex for "Airport Name (IATA / ICAO)"
    const iataIcaoMatch = location.match(/(.*?)\s*\(([A-Z]{3})\s*\/\s*([A-Z]{4})\)/);
    if (iataIcaoMatch) {
        return {
            name: iataIcaoMatch[1].trim(),
            iata: iataIcaoMatch[2],
            icao: iataIcaoMatch[3],
        };
    }

    // Regex for "Airport Name (IATA)"
    const iataMatch = location.match(/(.*?)\s*\(([A-Z]{3})\)/);
    if (iataMatch) {
        return {
            name: iataMatch[1].trim(),
            iata: iataMatch[2],
        };
    }
    
    // Fallback for just a 3-letter IATA code
    if (location.length === 3 && location.toUpperCase() === location) {
        return { name: location, iata: location };
    }

    // Fallback for just a name
    return { name: location, iata: 'N/A' };
};


export const parseMyFlightRadarCsv = (csvText: string): Omit<Flight, 'id'>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows.");
  }

  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataLines = lines.slice(1);

  // Helper to find index for potential column names
  const findIndex = (...names: string[]) => {
    for (const name of names) {
      const index = header.indexOf(name);
      if (index !== -1) return index;
    }
    return -1;
  };

  const columnIndices = {
    date: findIndex('Date'),
    from: findIndex('From'),
    to: findIndex('To'),
    flightNumber: findIndex('Flight number'),
    airline: findIndex('Airline'),
    distance: findIndex('Distance'), // This column may not exist
    duration: findIndex('Duration'),
    aircraft: findIndex('Aircraft type', 'Aircraft'), // Handle both possible names
  };
  
  const requiredColumns: { key: keyof typeof columnIndices; name: string }[] = [
      { key: 'date', name: 'Date' },
      { key: 'from', name: 'From' },
      { key: 'to', name: 'To' },
      { key: 'flightNumber', name: 'Flight number' },
      { key: 'airline', name: 'Airline' },
      { key: 'duration', name: 'Duration' },
      { key: 'aircraft', name: 'Aircraft type/Aircraft' },
  ];

  const missingColumns = requiredColumns.filter(c => columnIndices[c.key] === -1);

  if (missingColumns.length > 0) {
    const missingColumnNames = missingColumns.map(c => c.name).join(', ');
    throw new Error(`CSV file has missing required columns. Could not find: ${missingColumnNames}`);
  }

  return dataLines.map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    const distance = columnIndices.distance !== -1 
      ? parseInt(values[columnIndices.distance]?.replace(' km', ''), 10) || 0
      : 0;
      
    const fromInfo = parseLocation(values[columnIndices.from]);
    const toInfo = parseLocation(values[columnIndices.to]);

    return {
      date: values[columnIndices.date],
      from: fromInfo.iata,
      to: toInfo.iata,
      fromName: fromInfo.name,
      toName: toInfo.name,
      fromICAO: fromInfo.icao,
      toICAO: toInfo.icao,
      flightNumber: values[columnIndices.flightNumber] || 'N/A',
      airline: values[columnIndices.airline] || 'N/A',
      distance: distance,
      duration: parseDuration(values[columnIndices.duration]),
      aircraft: values[columnIndices.aircraft] || 'N/A',
    };
  }).filter(f => f.date && f.from && f.to); // Filter out potentially empty/invalid rows
};