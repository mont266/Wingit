
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Auth from './components/Auth';
import FlightDashboard from './components/FlightDashboard';
import { SpinnerIcon } from './components/icons';

interface Profile {
    username: string;
    role: string;
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, don't attempt to check auth state.
    // This prevents network errors to the placeholder URL.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    
    // Rely solely on onAuthStateChange for session management.
    // It's called upon initial load and whenever the auth state changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        // Only fetch profile if there's a session
        await getProfile(session.user);
      } else {
        // Clear profile when session is lost
        setProfile(null);
      }
      // This will be called on the initial check, turning off the loader.
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  const getProfile = async (user: User) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, role`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-gray-900 flex justify-center items-center">
        <SpinnerIcon className="w-12 h-12 text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {!session ? <Auth /> : <FlightDashboard key={session.user.id} session={session} profile={profile} />}
    </div>
  );
};

export default App;
