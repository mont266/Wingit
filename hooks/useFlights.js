import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';

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
      // Supabase will auto-generate the 'id' (if it's a PK with a default value like uuid_generate_v4())
      const { error } = await supabase
        .from('flights')
        .insert([{ ...flightData, user_id: user.id }]);

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
      const flightsToInsert = uniqueNewFlights.map(f => ({ ...f, user_id: user.id }));
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

  return { flights, loading, addFlight, addMultipleFlights, deleteFlight };
};