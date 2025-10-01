import React, { useState, useEffect } from 'react';
import { COMMON_AIRLINES } from '../types.js';
import { findFlightDetailsWithGemini } from '../services/geminiFlightApi.js';
import { XIcon, SearchIcon, SpinnerIcon, PlaneTakeoffIcon, PlaneLandingIcon } from './icons.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { KM_TO_MILES } from '../services/geoUtils.js';

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
  duration: '',
  seat_number: '',
};

const AddFlightModal = ({ isOpen, onClose, onAddFlight, onUpdateFlight, flightToEdit }) => {
  const isEditMode = !!flightToEdit;
  const [step, setStep] = useState(isEditMode ? 'manual' : 'search');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchData, setSearchData] = useState(initialSearchState);
  const [manualData, setManualData] = useState(initialManualState);
  const [foundFlight, setFoundFlight] = useState(null);
  const [error, setError] = useState(null);
  const { distanceUnit } = useSettings();

  useEffect(() => {
    if (isOpen) {
        setError(null);
        if (isEditMode) {
            setStep('manual');
            setManualData({
                date: flightToEdit.date,
                from: flightToEdit.from,
                to: flightToEdit.to,
                airline: flightToEdit.airline,
                flightNumber: flightToEdit.flightNumber,
                aircraft: flightToEdit.aircraft,
                duration: flightToEdit.duration.toString(),
                seat_number: flightToEdit.seat_number || '',
            });
        } else {
            // Reset for "add" mode
            setStep('search');
            setSearchData(initialSearchState);
            setManualData(initialManualState);
            setFoundFlight(null);
        }
    }
  }, [isOpen, flightToEdit, isEditMode]);


  const handleClose = () => {
    setIsSubmitting(false); // Ensure submitting state is reset
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
      setError(null); // Clear previous errors
      try {
        await onAddFlight({
          ...foundFlight,
          seat_number: foundFlight.seat_number?.trim() || null
        });
        // On success, parent will close the modal
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to save flight. Please try again.";
        setError(errorMessage);
        setIsSubmitting(false);
      }
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const fromIata = manualData.from.toUpperCase();
    const toIata = manualData.to.toUpperCase();

    const flightData = {
      date: manualData.date,
      from: fromIata,
      to: toIata,
      airline: manualData.airline,
      flightNumber: manualData.flightNumber,
      aircraft: manualData.aircraft,
      duration: parseInt(manualData.duration, 10) || 0,
      seat_number: manualData.seat_number.trim() || null,
    };

    setIsSubmitting(true);
    try {
        if (isEditMode) {
            await onUpdateFlight(flightToEdit.id, flightData);
        } else {
            // fromName/toName default to IATA for new manual entries.
            // The hook will resolve the full name on its own if the airport exists.
            await onAddFlight({ ...flightData, fromName: fromIata, toName: toIata });
        }
        // Success is handled by parent, which calls onClose
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to save flight. Please try again.";
        setError(errorMessage);
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  const renderContent = () => {
    // The direct assignment `step = 'manual'` was causing a crash because
    // 'step' is a const from a useState hook. The useEffect above already
    // correctly handles setting the step for edit mode, so this logic was
    // both incorrect and redundant.
    
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

        const displayDistance = distanceUnit === 'mi' ? foundFlight.distance * KM_TO_MILES : foundFlight.distance;
        const distanceLabel = distanceUnit === 'mi' ? 'mi' : 'km';
        
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
                        <div className="text-sm text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                           <div><strong>Airline:</strong> {foundFlight.airline}</div>
                           <div><strong>Flight:</strong> {foundFlight.flightNumber}</div>
                           <div><strong>Date:</strong> {foundFlight.date}</div>
                           <div><strong>Aircraft:</strong> {foundFlight.aircraft}</div>
                           <div><strong>Distance:</strong> {Math.round(displayDistance).toLocaleString()} {distanceLabel}</div>
                           <div><strong>Duration:</strong> {Math.floor(foundFlight.duration/60)}h {foundFlight.duration%60}m</div>
                           <div className="col-span-2 mt-1">
                                <label htmlFor="confirm-seat" className="block text-sm font-medium mb-1">Seat Number (Optional)</label>
                                <input 
                                    id="confirm-seat"
                                    type="text" 
                                    value={foundFlight.seat_number || ''}
                                    onChange={e => setFoundFlight({...foundFlight, seat_number: e.target.value})}
                                    placeholder="e.g., 14A"
                                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm"
                                    aria-label="Seat Number"
                                />
                            </div>
                        </div>
                    </div>
                    {error && <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md text-sm" role="alert">{error}</div>}
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
                    <h3 className="font-semibold text-lg mb-4 text-slate-700 dark:text-slate-200">{isEditMode ? 'Edit Flight Details' : 'Enter Flight Details Manually'}</h3>
                     {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md text-sm" role="alert">{error}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ManualInputField label="Date" id="date" type="date" value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} required />
                        <ManualInputField label="Flight Number" id="flightNumber" type="text" value={manualData.flightNumber} onChange={e => setManualData({...manualData, flightNumber: e.target.value})} placeholder="e.g., UA235" required />
                        <ManualInputField label="Airline" id="airline" type="text" value={manualData.airline} onChange={e => setManualData({...manualData, airline: e.target.value})} placeholder="United Airlines" required />
                        <ManualInputField label="Aircraft" id="aircraft" type="text" value={manualData.aircraft} onChange={e => setManualData({...manualData, aircraft: e.target.value})} placeholder="Boeing 787" required />
                        <ManualInputField label="From (IATA)" id="from" type="text" maxLength="3" value={manualData.from} onChange={e => setManualData({...manualData, from: e.target.value})} placeholder="SFO" required />
                        <ManualInputField label="To (IATA)" id="to" type="text" maxLength="3" value={manualData.to} onChange={e => setManualData({...manualData, to: e.target.value})} placeholder="JFK" required />
                        <ManualInputField label="Duration (min)" id="duration" type="number" value={manualData.duration} onChange={e => setManualData({...manualData, duration: e.target.value})} placeholder="330" required />
                        <div className="sm:col-span-2">
                            <ManualInputField label="Seat Number (Optional)" id="seat_number" type="text" value={manualData.seat_number} onChange={e => setManualData({...manualData, seat_number: e.target.value})} placeholder="e.g., 14A" />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-36">
                       {isSubmitting ? <SpinnerIcon className="w-5 h-5"/> : (isEditMode ? 'Save Changes' : 'Add Flight')}
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
          <h2 id="add-flight-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">{isEditMode ? 'Edit Flight' : 'Add a Flight'}</h2>
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