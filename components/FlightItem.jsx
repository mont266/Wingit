import React, { useState } from 'react';
import { PlaneTakeoffIcon, PlaneLandingIcon, TrashIcon, CalendarIcon, HashtagIcon, AirlineIcon, AircraftIcon, ClockIcon, DistanceIcon, ChevronDownIcon, SeatIcon, EditIcon } from './icons.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { KM_TO_MILES } from '../services/geoUtils.js';

const FlightItem = ({ flight, onDelete, onEdit, showICAO }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { distanceUnit } = useSettings();
    
  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatDate = (dateString) => {
    // Handles YYYY-MM-DD format without timezone issues.
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const date = new Date(Date.UTC(year, month - 1, day));
    
    const monthName = date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });

    const getDayWithSuffix = (d) => {
        if (d > 3 && d < 21) return `${d}th`;
        switch (d % 10) {
            case 1: return `${d}st`;
            case 2: return `${d}nd`;
            case 3: return `${d}rd`;
            default: return `${d}th`;
        }
    };

    return `${getDayWithSuffix(day)} ${monthName} ${year}`;
  };

  const AirportDisplay = ({ name, iata, icao }) => (
    <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate" title={`${name} (${iata})`}>
        {name}
        <span className="ml-1.5 text-slate-500 dark:text-slate-400 font-normal">({iata})</span>
        {showICAO && icao && (
            <span className="ml-2 text-sm text-slate-400 dark:text-slate-500 font-mono">({icao})</span>
        )}
    </p>
  );

  const displayDistance = distanceUnit === 'mi' ? flight.distance * KM_TO_MILES : flight.distance;
  const distanceLabel = distanceUnit === 'mi' ? 'mi' : 'km';

  return (
    <div>
      <div 
        className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`flight-details-${flight.id}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded); }}}
      >
        <div className="flex justify-between items-center">
          <div className="flex-grow min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <AirportDisplay name={flight.fromName} iata={flight.from} icao={flight.fromICAO} />
              <div className="flex-grow flex items-center text-slate-400 min-w-0">
                  <PlaneTakeoffIcon className="w-5 h-5 flex-shrink-0"/>
                  <div className="flex-grow border-t-2 border-dashed border-slate-300 dark:border-slate-600 mx-2"></div>
                  <PlaneLandingIcon className="w-5 h-5 flex-shrink-0"/>
              </div>
              <AirportDisplay name={flight.toName} iata={flight.to} icao={flight.toICAO} />
            </div>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center truncate"><AirlineIcon className="w-4 h-4 mr-1.5 flex-shrink-0"/><span>{flight.airline}</span></div>
                <div className="flex items-center mt-1 sm:mt-0"><CalendarIcon className="w-4 h-4 mr-1.5 flex-shrink-0"/>{formatDate(flight.date)}</div>
            </div>
          </div>
          <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ml-4 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isExpanded && (
        <div id={`flight-details-${flight.id}`} className="bg-slate-50 dark:bg-slate-800/50 p-6 pt-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-700 dark:text-slate-300 w-full">
                <div className="flex items-center col-span-1 sm:col-span-2"><PlaneTakeoffIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400"/> From: <span className="font-medium ml-1 text-slate-800 dark:text-slate-200 truncate">{flight.fromName} ({flight.from})</span></div>
                <div className="flex items-center col-span-1 sm:col-span-2"><PlaneLandingIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400"/> To: <span className="font-medium ml-1 text-slate-800 dark:text-slate-200 truncate">{flight.toName} ({flight.to})</span></div>
                <div className="flex items-center"><HashtagIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400"/> Flight: <span className="font-medium ml-1 text-slate-800 dark:text-slate-200 truncate">{flight.flightNumber}</span></div>
                <div className="flex items-center"><AircraftIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400"/> Aircraft: <span className="font-medium ml-1 text-slate-800 dark:text-slate-200 truncate">{flight.aircraft}</span></div>
                <div className="flex items-center"><ClockIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400"/> Duration: <span className="font-medium ml-1 text-slate-800 dark:text-slate-200">{formatDuration(flight.duration)}</span></div>
                <div className="flex items-center"><DistanceIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400"/> Distance: <span className="font-medium ml-1 text-slate-800 dark:text-slate-200">{Math.round(displayDistance).toLocaleString()} {distanceLabel}</span></div>
                {flight.seat_number && (
                  <div className="flex items-center"><SeatIcon className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400"/> Seat: <span className="font-medium ml-1 text-slate-800 dark:text-slate-200">{flight.seat_number}</span></div>
                )}
            </div>
            <div className="self-start sm:self-center flex-shrink-0 flex items-center space-x-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(flight);
                    }}
                    className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-slate-700 dark:hover:text-blue-400 rounded-full transition-colors duration-200"
                    aria-label={`Edit flight from ${flight.from} to ${flight.to} on ${flight.date}`}
                >
                    <EditIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(flight.id);
                    }}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-slate-700 dark:hover:text-red-400 rounded-full transition-colors duration-200"
                    aria-label={`Delete flight from ${flight.from} to ${flight.to} on ${flight.date}`}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightItem;
