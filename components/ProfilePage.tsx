
import React, { useMemo } from 'react';
import { Flight } from '../types';
import { PlaneIcon, ClockIcon, DistanceIcon, AirlineIcon, AircraftIcon, GlobeIcon } from './icons';
import DataSeeder from './DataSeeder';

interface ProfilePageProps {
    flights: Flight[];
    profile: { username: string; role: string; } | null;
}

const StatHighlightCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; footer: string; }> = ({ icon, label, value, footer }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col justify-between h-full">
        <div>
            <div className="flex items-center text-slate-500 dark:text-slate-400">
                {icon}
                <span className="ml-2 text-sm font-medium">{label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 truncate">{footer}</p>
    </div>
);

const TopListItem: React.FC<{ rank: number; name: string; count: number; icon: React.ReactNode; }> = ({ rank, name, count, icon }) => (
    <div className="flex items-center space-x-4">
        <div className="text-lg font-bold text-slate-400 dark:text-slate-500 w-4 text-right">{rank}.</div>
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-grow min-w-0">
            <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{count} {count > 1 ? 'flights' : 'flight'}</p>
        </div>
    </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ flights, profile }) => {

    const stats = useMemo(() => {
        if (flights.length === 0) return null;

        const longestFlightByDistance = [...flights].sort((a, b) => b.distance - a.distance)[0];
        const longestFlightByDuration = [...flights].sort((a, b) => b.duration - a.duration)[0];

        const countItems = (key: keyof Flight) => {
            return flights.reduce((acc, flight) => {
                const item = flight[key] as string;
                if(item === 'N/A') return acc;
                acc[item] = (acc[item] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        };
        
        const countAirports = () => {
             return flights.reduce((acc, flight) => {
                acc[flight.fromName] = (acc[flight.fromName] || 0) + 1;
                acc[flight.toName] = (acc[flight.toName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        }

        const getTopThree = (counts: Record<string, number>) => {
            return Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);
        };
        
        const airlineCounts = countItems('airline');
        const aircraftCounts = countItems('aircraft');
        const airportCounts = countAirports();

        return {
            longestFlightByDistance,
            longestFlightByDuration,
            topAirlines: getTopThree(airlineCounts),
            topAircraft: getTopThree(aircraftCounts),
            topAirports: getTopThree(airportCounts),
        };
    }, [flights]);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome, {profile?.username || 'Aviator'}!</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    {flights.length > 0
                        ? "Here's a summary of your travels so far. Keep flying!"
                        : "Your profile is ready. Add flights to see your stats, or seed the airport database below to get started."}
                </p>
            </div>

            {flights.length > 0 && stats && (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatHighlightCard
                            icon={<DistanceIcon className="w-5 h-5" />}
                            label="Longest Flight by Distance"
                            value={<>{stats.longestFlightByDistance.distance.toLocaleString()} <span className="text-base font-medium">km</span></>}
                            footer={`${stats.longestFlightByDistance.from} → ${stats.longestFlightByDistance.to} on ${stats.longestFlightByDistance.airline}`}
                        />
                         <StatHighlightCard
                            icon={<ClockIcon className="w-5 h-5" />}
                            label="Longest Flight by Duration"
                            value={formatDuration(stats.longestFlightByDuration.duration)}
                            footer={`${stats.longestFlightByDuration.from} → ${stats.longestFlightByDuration.to} on ${stats.longestFlightByDuration.airline}`}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Top Airlines</h4>
                            <div className="space-y-4">
                                {stats.topAirlines.map(([name, count], i) => <TopListItem key={name} rank={i+1} name={name} count={count} icon={<AirlineIcon className="w-6 h-6 text-blue-500"/>} />)}
                            </div>
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Top Aircraft</h4>
                            <div className="space-y-4">
                                {stats.topAircraft.map(([name, count], i) => <TopListItem key={name} rank={i+1} name={name} count={count} icon={<AircraftIcon className="w-6 h-6 text-green-500"/>} />)}
                            </div>
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Top Airports</h4>
                            <div className="space-y-4">
                                {stats.topAirports.map(([name, count], i) => <TopListItem key={name} rank={i+1} name={name} count={count} icon={<GlobeIcon className="w-6 h-6 text-purple-500"/>} />)}
                            </div>
                        </div>
                    </div>
                 </>
            )}

            {profile?.role === 'admin' && <DataSeeder />}
        </div>
    );
};

export default ProfilePage;
