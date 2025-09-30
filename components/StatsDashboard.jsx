import React, { useMemo } from 'react';
import { GlobeIcon, DistanceIcon, ClockIcon, PlaneIcon } from './icons.jsx';

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:scale-105">
    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

const MobileStatItem = ({ icon, label, value }) => (
  <div className="flex flex-col items-center text-center space-y-1">
    {icon}
    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{value}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
  </div>
);

const StatsDashboard = ({ flights }) => {
  const stats = useMemo(() => {
    const totalFlights = flights.length;
    const totalDistance = flights.reduce((sum, flight) => sum + flight.distance, 0);
    const totalDuration = flights.reduce((sum, flight) => sum + flight.duration, 0);
    const uniqueAirports = new Set(flights.flatMap(f => [f.from, f.to])).size;

    const formatDuration = (minutes) => {
      const d = Math.floor(minutes / (24 * 60));
      const h = Math.floor((minutes % (24 * 60)) / 60);
      const m = minutes % 60;
      return `${d}d ${h}h ${m}m`;
    };

    const formatDurationCompact = (minutes) => {
      const d = Math.floor(minutes / (24 * 60));
      const h = Math.floor((minutes % (24 * 60)) / 60);
      const m = minutes % 60;

      if (d > 0) return `${d}d ${h}h`;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };
    
    const formatDistanceCompact = (distance) => {
        if (distance >= 1000000) {
            return `${(distance / 1000000).toFixed(1)}m`;
        }
        if (distance >= 1000) {
            return `${Math.round(distance / 1000)}k`;
        }
        return distance.toString();
    };

    return {
      totalFlights,
      totalDistance: totalDistance.toLocaleString(),
      totalDistanceCompact: formatDistanceCompact(totalDistance),
      totalDuration: formatDuration(totalDuration),
      totalDurationCompact: formatDurationCompact(totalDuration),
      uniqueAirports,
    };
  }, [flights]);

  return (
    <>
      {/* Mobile View: A single card with a grid of icons/stats */}
      <div className="sm:hidden bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-4 gap-2 text-center">
           <MobileStatItem 
             icon={<PlaneIcon className="w-7 h-7 text-blue-500" />} 
             label="Flights" 
             value={stats.totalFlights} 
           />
           <MobileStatItem 
             icon={<DistanceIcon className="w-7 h-7 text-green-500" />} 
             label="Distance (km)" 
             value={stats.totalDistanceCompact} 
           />
           <MobileStatItem 
             icon={<ClockIcon className="w-7 h-7 text-yellow-500" />} 
             label="Time in Air" 
             value={stats.totalDurationCompact} 
           />
           <MobileStatItem 
             icon={<GlobeIcon className="w-7 h-7 text-purple-500" />} 
             label="Airports" 
             value={stats.uniqueAirports} 
           />
        </div>
      </div>

      {/* Desktop View: Full stat cards */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <StatCard icon={<PlaneIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />} label="Total Flights" value={stats.totalFlights} />
        <StatCard icon={<DistanceIcon className="w-6 h-6 text-green-600 dark:text-green-300" />} label="Total Distance (km)" value={stats.totalDistance} />
        <StatCard icon={<ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />} label="Total Time in Air" value={stats.totalDuration} />
        <StatCard icon={<GlobeIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />} label="Airports Visited" value={stats.uniqueAirports} />
      </div>
    </>
  );
};

export default StatsDashboard;