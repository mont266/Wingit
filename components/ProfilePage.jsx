import React, { useMemo } from 'react';
import { PlaneIcon, ClockIcon, DistanceIcon, AirlineIcon, AircraftIcon, GlobeIcon } from './icons.jsx';
import DataSeeder from './DataSeeder.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { KM_TO_MILES } from '../services/geoUtils.js';

const StatHighlightCard = ({ icon, label, value, footer }) => (
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

const TopListItem = ({ rank, name, count, icon }) => (
    <div className="flex items-center space-x-4">
        <div className="text-lg font-bold text-slate-400 dark:text-slate-500 w-4 text-right">{rank}.</div>
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-grow min-w-0">
            <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{count} {count > 1 ? 'flights' : 'flight'}</p>
        </div>
    </div>
);

const ProfilePage = ({ flights, profile }) => {
    const { distanceUnit, toggleDistanceUnit } = useSettings();

    const stats = useMemo(() => {
        if (flights.length === 0) return null;

        const longestFlightByDistance = [...flights].sort((a, b) => b.distance - a.distance)[0];
        const longestFlightByDuration = [...flights].sort((a, b) => b.duration - a.duration)[0];

        const countItems = (key) => {
            return flights.reduce((acc, flight) => {
                const item = flight[key];
                if(item === 'N/A') return acc;
                acc[item] = (acc[item] || 0) + 1;
                return acc;
            }, {});
        };
        
        const countAirports = () => {
             return flights.reduce((acc, flight) => {
                acc[flight.fromName] = (acc[flight.fromName] || 0) + 1;
                acc[flight.toName] = (acc[flight.toName] || 0) + 1;
                return acc;
            }, {});
        }

        const getTopThree = (counts) => {
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

    const formatDuration = (minutes) => {
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
                            value={
                                <>
                                {Math.round(
                                    distanceUnit === 'mi'
                                    ? stats.longestFlightByDistance.distance * KM_TO_MILES
                                    : stats.longestFlightByDistance.distance
                                ).toLocaleString()}{' '}
                                <span className="text-base font-medium">
                                    {distanceUnit === 'mi' ? 'mi' : 'km'}
                                </span>
                                </>
                            }
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

            <div className="border-t border-slate-300 dark:border-slate-700 pt-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</h3>
                <div className="mt-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex justify-between items-center max-w-sm">
                    <p className="font-medium text-slate-700 dark:text-slate-200">Distance Unit</p>
                    <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${distanceUnit === 'km' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>KM</span>
                        <button
                            onClick={toggleDistanceUnit}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 ${distanceUnit === 'mi' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                            role="switch"
                            aria-checked={distanceUnit === 'mi'}
                            aria-label={`Switch to ${distanceUnit === 'km' ? 'Miles' : 'Kilometers'}`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${distanceUnit === 'mi' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                        <span className={`font-semibold ${distanceUnit === 'mi' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>Miles</span>
                    </div>
                </div>
            </div>

            {profile?.role === 'admin' && (
                <div className="border-t border-slate-300 dark:border-slate-700 pt-8 mt-8">
                    <DataSeeder />
                </div>
            )}
        </div>
    );
};

export default ProfilePage;