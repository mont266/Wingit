
import React, { useState, useCallback, useMemo } from 'react';
import { useFlights } from '../hooks/useFlights';
import { parseMyFlightRadarCsv } from '../services/csvParser';
import { Flight } from '../types';
import Header from './Header';
import StatsDashboard from './StatsDashboard';
import FlightList from './FlightList';
import AddFlightModal from './AddFlightModal';
import ProfilePage from './ProfilePage';
import { PlusIcon, EmptyStateIcon, SpinnerIcon } from './icons';
import { Session } from '@supabase/supabase-js';

interface FlightDashboardProps {
    session: Session;
    profile: { username: string; role: string; } | null;
}

type View = 'dashboard' | 'profile';

const FlightDashboard: React.FC<FlightDashboardProps> = ({ session, profile }) => {
  const { flights, loading: flightsLoading, addFlight, addMultipleFlights, deleteFlight } = useFlights(session.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showICAO, setShowICAO] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const availableYears = useMemo(() => {
    if (flights.length === 0) {
        return [];
    }
    const years = new Set(flights.map(flight => new Date(flight.date).getFullYear().toString()));
    const sortedYears = [...years].sort((a, b) => Number(b) - Number(a));
    return ['all', ...sortedYears];
  }, [flights]);

  const filteredFlights = useMemo(() => {
    if (selectedYear === 'all') {
      return flights;
    }
    return flights.filter(flight => new Date(flight.date).getFullYear().toString() === selectedYear);
  }, [flights, selectedYear]);

  const { upcomingFlights, pastFlights } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = filteredFlights.filter(f => new Date(f.date) >= today);
    const past = filteredFlights.filter(f => new Date(f.date) < today);

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // The main `flights` array is already sorted by date descending from the hook
    // so `past` will be correctly sorted.

    return { upcomingFlights: upcoming, pastFlights: past };
  }, [filteredFlights]);


  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (text) {
          try {
            const parsedFlights = parseMyFlightRadarCsv(text);
            await addMultipleFlights(parsedFlights);
            setSelectedYear('all');
          } catch (parseError) {
            console.error('CSV Parsing Error:', parseError);
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error.';
            setError(`Failed to parse CSV file: ${errorMessage}`);
          }
        }
        setIsImporting(false);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsImporting(false);
      };
      reader.readAsText(file);
    } catch (err) {
      setError('An unexpected error occurred during file processing.');
      setIsImporting(false);
    }
    event.target.value = '';
  }, [addMultipleFlights]);

  const handleAddFlight = async (flight: Omit<Flight, 'id'>) => {
     try {
        await addFlight(flight);
        setIsModalOpen(false);
        setSelectedYear('all');
    } catch(err) {
        console.error(err);
        setError("Failed to add flight. Please try again.");
    }
  };
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const renderDashboardContent = () => (
    <>
      <StatsDashboard flights={filteredFlights} />

      <div className="mt-8 bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-100">My Flights</h2>
            {availableYears.length > 1 && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter flights by year"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      {year === 'all' ? 'All Years' : year}
                    </option>
                  ))}
                </select>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {flights.length > 0 && (
              <button
                onClick={() => setShowICAO(!showICAO)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                aria-pressed={showICAO}
              >
                {showICAO ? 'Hide ICAO' : 'Show ICAO'}
              </button>
            )}
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
              disabled={isImporting}
            />
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import CSV'}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center shadow-md"
              aria-label="Add new flight"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {error && <div className="m-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded-lg">{error}</div>}
        
        {filteredFlights.length === 0 ? (
          <div className="text-center py-16 px-6">
            <EmptyStateIcon className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">No Flights Logged Yet</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Add your first flight or import your history to get started.
            </p>
          </div>
        ) : (
          <div>
            {upcomingFlights.length > 0 && (
              <div className="flight-section">
                <h3 className="text-center px-6 pt-8 pb-4 text-xl font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">Upcoming Flights</h3>
                <FlightList flights={upcomingFlights} onDelete={deleteFlight} showICAO={showICAO} />
              </div>
            )}
            {pastFlights.length > 0 && (
              <div className={`flight-section ${upcomingFlights.length > 0 ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}>
                <h3 className="text-center px-6 pt-8 pb-4 text-xl font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">Past Flights</h3>
                <FlightList flights={pastFlights} onDelete={deleteFlight} showICAO={showICAO} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (flightsLoading) {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
            <Header session={session} profile={profile} currentView={currentView} setView={setCurrentView} />
            <main className="container mx-auto p-4 md:p-8 flex justify-center items-center h-[calc(100vh-80px)]">
                <SpinnerIcon className="w-12 h-12 text-blue-500" />
            </main>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header session={session} profile={profile} currentView={currentView} setView={setCurrentView} />
      <main className="container mx-auto p-4 md:p-8">
        {currentView === 'dashboard' ? (
            renderDashboardContent()
        ) : (
            <ProfilePage flights={flights} profile={profile} />
        )}
      </main>

      <AddFlightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddFlight={handleAddFlight}
      />
    </div>
  );
};

export default FlightDashboard;
