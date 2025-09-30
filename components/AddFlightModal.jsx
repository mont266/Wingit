import React, { useState } from 'react';
import { COMMON_AIRLINES } from '../types.js';
import { findFlightDetailsWithGemini } from '../services/geminiFlightApi.js';
import { XIcon, SearchIcon, SpinnerIcon, PlaneTakeoffIcon, PlaneLandingIcon } from './icons.jsx';

const initialSearchState = {
    airline: '',
    flightNumber: '',
    date: new Date().toISOString().split('T')[0],
};

const initialManualState = {
  date: '',
  from: '',
  to: '',
  airline: '',
  flightNumber: '',
  aircraft: '',
  distance: '',
  duration: '',
};

const AddFlightModal = ({ isOpen, onClose, onAddFlight }) => {
  const [step, setStep] = useState('search');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchData, setSearchData] = useState(initialSearchState);
  const [manualData, setManualData] = useState(initialManualState);
  const [foundFlight, setFoundFlight] = useState(null);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setStep('search');
    setSearchData(initialSearchState);
    setManualData(initialManualState);
    setFoundFlight(null);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };
  
  const handleFindFlight = async (e) => {
    e.preventDefault();
    setError(null);
    setStep('loading');

    try {
      const flightDetails = await findFlightDetailsWithGemini(
        searchData.airline,
        searchData.flightNumber,
        searchData.date
      );
      
      setFoundFlight(flightDetails);
      setStep('confirm');
    } catch (err) {
      console.error("Gemini API Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not find flight details.";
      setError(`${errorMessage} Please try another or enter manually.`);
      setStep('search');
    }
  };

  const handleConfirmFlight = async () => {
    if (foundFlight) {
      setIsSubmitting(true);
      try {
        await onAddFlight(foundFlight);
        handleClose();
      } catch (e) {
        setError("Failed to save flight. Please try again.");
        setIsSubmitting(false);
      }
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const fromIata = manualData.from.toUpperCase();
    const toIata = manualData.to.toUpperCase();

    const flightData = {
      ...manualData,
      from: fromIata,
      to: toIata,
      fromName: fromIata,
      toName: toIata,
      distance: parseInt(manualData.distance, 10) || 0,
      duration: parseInt(manualData.duration, 10) || 0,
    };
    setIsSubmitting(true);
    try {
        await onAddFlight(flightData);
        handleClose();
    } catch (e) {
        setError("Failed to save flight. Please try again.");
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <div className="p-10 flex flex-col items-center justify-center space-y-4">
            <SpinnerIcon className="w-12 h-12 text-blue-500" />
            <p className="text-slate-600 dark:text-slate-300">Searching for your flight...</p>
          </div>
        );
      
      case 'confirm':
        if (!foundFlight) return null;
        return (
            <div>
                <div className="p-6">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700 dark:text-slate-200">Is this your flight?</h3>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between text-xl font-bold text-slate-800 dark:text-slate-100">
                           <span>{foundFlight.from}</span>
                           <div className="flex items-center text-slate-400">
                                <PlaneTakeoffIcon className="w-5 h-5"/>
                                <div className="flex-grow border-t-2 border-dashed border-slate-300 dark:border-slate-600 mx-2 w-16"></div>
                                <PlaneLandingIcon className="w-5 h-5"/>
                           </div>
                           <span>{foundFlight.to}</span>
                        </div>
                         <div className="text-center text-sm text-slate-500 dark:text-slate-400 -mt-2">
                           <span className="truncate block">{foundFlight.fromName} to {foundFlight.toName}</span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-2 pt-2">
                           <div><strong>Airline:</strong> {foundFlight.airline}</div>
                           <div><strong>Flight:</strong> {foundFlight.flightNumber}</div>
                           <div><strong>Date:</strong> {foundFlight.date}</div>
                           <div><strong>Aircraft:</strong> {foundFlight.aircraft}</div>
                           <div><strong>Distance:</strong> {foundFlight.distance.toLocaleString()} km</div>
                           <div><strong>Duration:</strong> {Math.floor(foundFlight.duration/60)}h {foundFlight.duration%60}m</div>
                        </div>
                    </div>
                    {error && <div className="mt-4 text-xs text-red-500 text-center" role="alert">{error}</div>}
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <button onClick={() => setStep('search')} disabled={isSubmitting} className="text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white disabled:opacity-50">
                        Search Again
                    </button>
                    <button onClick={handleConfirmFlight} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-48 disabled:bg-slate-400">
                        {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : 'Yes, Add to Logbook'}
                    </button>
                </div>
            </div>
        );

      case 'manual':
        const ManualInputField = ({ label, id, ...props }) => (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                <input id={id} name={id} {...props} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
        );
        return (
            <form onSubmit={handleManualSubmit}>
                <div className="p-6">
                    <h3 className="font-semibold text-lg mb-4 text-slate-700 dark:text-slate-200">Enter Flight Details Manually</h3>
                     {error && <div className="mb-4 text-xs text-red-500 text-center" role="alert">{error}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ManualInputField label="Date" id="date" type="date" value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} required />
                        <ManualInputField label="Flight Number" id="flightNumber" type="text" value={manualData.flightNumber} onChange={e => setManualData({...manualData, flightNumber: e.target.value})} placeholder="e.g., UA235" required />
                        <ManualInputField label="Airline" id="airline" type="text" value={manualData.airline} onChange={e => setManualData({...manualData, airline: e.target.value})} placeholder="United Airlines" required />
                        <ManualInputField label="Aircraft" id="aircraft" type="text" value={manualData.aircraft} onChange={e => setManualData({...manualData, aircraft: e.target.value})} placeholder="Boeing 787" required />
                        <ManualInputField label="From (IATA)" id="from" type="text" value={manualData.from} onChange={e => setManualData({...manualData, from: e.target.value})} placeholder="SFO" required />
                        <ManualInputField label="To (IATA)" id="to" type="text" value={manualData.to} onChange={e => setManualData({...manualData, to: e.target.value})} placeholder="JFK" required />
                        <ManualInputField label="Distance (km)" id="distance" type="number" value={manualData.distance} onChange={e => setManualData({...manualData, distance: e.target.value})} placeholder="4178" required />
                        <ManualInputField label="Duration (min)" id="duration" type="number" value={manualData.duration} onChange={e => setManualData({...manualData, duration: e.target.value})} placeholder="330" required />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-28">
                       {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : 'Add Flight'}
                    </button>
                </div>
            </form>
        );

      case 'search':
      default:
        return (
          <form onSubmit={handleFindFlight}>
            <div className="p-6">
              <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">Find Your Flight</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your flight number and date to automatically fill details.</p>
              
              {error && <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md text-sm">{error}</div>}

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="airline" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Airline</label>
                  <select
                    id="airline"
                    value={searchData.airline}
                    onChange={(e) => setSearchData({ ...searchData, airline: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="" disabled>Select an airline</option>
                    {COMMON_AIRLINES.map(airline => (
                      <option key={airline.iata} value={airline.name}>{airline.name} ({airline.iata})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="flightNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Flight Number</label>
                  <input
                    type="text"
                    id="flightNumber"
                    value={searchData.flightNumber}
                    onChange={(e) => setSearchData({ ...searchData, flightNumber: e.target.value })}
                    placeholder="e.g., 235"
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={searchData.date}
                    onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <button type="button" onClick={() => setStep('manual')} className="text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white">
                Enter Manually
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <SearchIcon className="w-4 h-4 mr-2" />
                Find Flight
              </button>
            </div>
          </form>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="add-flight-modal-title">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="add-flight-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">Add a Flight</h2>
          <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close modal">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AddFlightModal;