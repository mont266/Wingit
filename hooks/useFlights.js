import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { calculateHaversineDistance } from '../services/geoUtils.js';

export const useFlights = (user) => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  const getFlights = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from('flights')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFlights(data);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
      alert('Error fetching flights.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      getFlights();
    } else {
      setFlights([]);
      setLoading(false);
    }
  }, [user, getFlights]);

  const addFlight = useCallback(async (flightData) => {
    if (!user || !isSupabaseConfigured) throw new Error("Application not configured or user not logged in");
    try {
      // Fetch coordinates for departure and arrival airports from the database
      const { data: coords, error: coordError } = await supabase
        .from('airports')
        .select('iata, lat, lon')
        .in('iata', [flightData.from, flightData.to]);

      if (coordError) {
        console.error("Error fetching coordinates:", coordError);
        throw new Error(`Database error: Could not fetch airport coordinates.`);
      }

      const fromCoord = coords?.find(c => c.iata === flightData.from);
      const toCoord = coords?.find(c => c.iata === flightData.to);
      
      if (!fromCoord || !toCoord) {
         throw new Error(`Could not find one or both airports (${flightData.from}, ${flightData.to}) in the database. Please check the IATA codes.`);
      }
      
      // Calculate distance using Haversine formula
      const distance = calculateHaversineDistance(fromCoord.lat, fromCoord.lon, toCoord.lat, toCoord.lon);

      // Supabase will auto-generate the 'id'
      const { error } = await supabase
        .from('flights')
        .insert([{ ...flightData, distance: Math.round(distance), user_id: user.id }]);

      if (error) throw error;
      await getFlights();
    } catch (error) {
        console.error('Error adding flight:', error);
        throw error;
    }
  }, [user, getFlights]);
  
  const addMultipleFlights = useCallback(async (newFlights) => {
    if (!user || !isSupabaseConfigured) throw new Error("Application not configured or user not logged in");

    const { data: existingDbFlights, error: fetchError } = await supabase
      .from('flights')
      .select('date,from,to,flightNumber')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching existing flights for duplicate check:', fetchError);
      throw fetchError;
    }

    const existingFlightsSet = new Set(existingDbFlights?.map(f => `${f.date}-${f.from}-${f.to}-${f.flightNumber}`) ?? []);
    const uniqueNewFlights = newFlights.filter(f => !existingFlightsSet.has(`${f.date}-${f.from}-${f.to}-${f.flightNumber}`));

    if (uniqueNewFlights.length === 0) return;

    try {
      // Get all unique IATA codes from the new flights
      const iataCodes = [...new Set(uniqueNewFlights.flatMap(f => [f.from, f.to]))];

      // Fetch all coordinates in one go
      const { data: coords, error: coordError } = await supabase
        .from('airports')
        .select('iata, lat, lon')
        .in('iata', iataCodes);
      
      if (coordError) {
        console.error("Error fetching coordinates for bulk import:", coordError);
        throw new Error("Database error: could not fetch coordinates for imported flights.");
      }

      const coordsMap = new Map(coords.map(c => [c.iata, { lat: c.lat, lon: c.lon }]));
      
      // Recalculate distance for each flight and prepare for insertion
      const flightsToInsert = uniqueNewFlights.map(f => {
          const fromCoord = coordsMap.get(f.from);
          const toCoord = coordsMap.get(f.to);
          
          let distance = f.distance; // Use original from CSV as a fallback
          if (fromCoord && toCoord) {
              distance = Math.round(calculateHaversineDistance(fromCoord.lat, fromCoord.lon, toCoord.lat, toCoord.lon));
          } else {
              console.warn(`Could not find coordinates for flight ${f.from}-${f.to}. Using distance from file: ${distance} km.`);
          }
          
          return { ...f, distance, user_id: user.id };
      });

      const { error } = await supabase
        .from('flights')
        .insert(flightsToInsert);
      
      if (error) throw error;
      await getFlights();
    } catch (error) {
      console.error('Error adding multiple flights:', error);
      throw error;
    }
  }, [user, getFlights]);

  const deleteFlight = useCallback(async (flightId) => {
    if (!user || !isSupabaseConfigured) {
        console.error("Cannot delete flight: Application not configured or user not logged in.");
        return;
    }
    const originalFlights = flights;
    try {
      setFlights(prevFlights => prevFlights.filter(flight => flight.id !== flightId));
      
      const { error } = await supabase
        .from('flights')
        .delete()
        .eq('id', flightId)
        .eq('user_id', user.id);

      if (error) {
        setFlights(originalFlights); // Revert optimistic update on error
        throw error;
      }
    } catch (error) {
      console.error('Error deleting flight:', error);
      alert('Error deleting flight.');
    }
  }, [user, flights]);
  
  const updateFlight = useCallback(async (flightId, flightData) => {
    if (!user || !isSupabaseConfigured) throw new Error("Application not configured or user not logged in");
    
    try {
      const originalFlight = flights.find(f => f.id === flightId);
      if (!originalFlight) throw new Error("Original flight not found for update");
      
      let distance = originalFlight.distance;
      let fromName = originalFlight.fromName;
      let toName = originalFlight.toName;

      // Recalculate distance and update airport names if IATA codes have changed.
      if (originalFlight.from !== flightData.from || originalFlight.to !== flightData.to) {
        const { data: airports, error: coordError } = await supabase
          .from('airports')
          .select('iata, lat, lon, name')
          .in('iata', [flightData.from, flightData.to]);

        if (coordError) {
          console.error("Error fetching coordinates for update:", coordError);
          throw new Error(`Database error: Could not fetch airport data for update.`);
        }

        const fromAirport = airports?.find(c => c.iata === flightData.from);
        const toAirport = airports?.find(c => c.iata === flightData.to);

        if (!fromAirport || !toAirport) {
          throw new Error(`Could not find one or both airports (${flightData.from}, ${flightData.to}) in the database. Please check the IATA codes.`);
        }
        
        distance = calculateHaversineDistance(fromAirport.lat, fromAirport.lon, toAirport.lat, toAirport.lon);
        fromName = fromAirport.name;
        toName = toAirport.name;
      }
      
      const { error } = await supabase
        .from('flights')
        .update({ ...flightData, distance: Math.round(distance), fromName, toName })
        .eq('id', flightId)
        .eq('user_id', user.id);

      if (error) throw error;
      await getFlights();
    } catch (error) {
      console.error('Error updating flight:', error);
      throw error;
    }
  }, [user, getFlights, flights]);

  return { flights, loading, addFlight, addMultipleFlights, deleteFlight, updateFlight };
};
