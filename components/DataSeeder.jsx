import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { DatabaseIcon, SpinnerIcon, DownloadIcon } from './icons.jsx';
import { AIRPORT_DATA } from '../services/airportData.js';

const DataSeeder = () => {
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);

    const handleSeed = async () => {
        if (!confirm("This will perform a one-time operation to populate the airport database from a pre-defined list of major world airports. This is a fast, free operation. Do you want to continue?")) {
            return;
        }

        setStatus('inserting');
        setProgress(0);
        const airports = AIRPORT_DATA;
        
        try {
            setMessage(`Found ${airports.length} major airports. Inserting into database...`);

            // Delete existing data to prevent duplicates on re-run
            const { error: deleteError } = await supabase.from('airports').delete().neq('iata', 'placeholder');
            if (deleteError) throw new Error(`Failed to clear existing data: ${deleteError.message}`);

            const chunkSize = 500;
            for (let i = 0; i < airports.length; i += chunkSize) {
                const chunk = airports.slice(i, i + chunkSize);
                const { error } = await supabase.from('airports').insert(chunk);
                if (error) {
                    throw new Error(`Failed to insert chunk starting at index ${i}: ${error.message}`);
                }
                const currentProgress = Math.round(((i + chunk.length) / airports.length) * 100);
                setProgress(currentProgress);
                setMessage(`Inserting... ${currentProgress}% complete.`);
            }

            setStatus('success');
            setMessage(`Successfully populated the database with ${airports.length} airports.`);

        } catch (err) {
            setStatus('error');
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setMessage(errorMessage);
        }
    };

    const handleDownloadCsv = () => {
        const headers = ['iata', 'icao', 'name', 'city', 'country', 'lat', 'lon'];
        const csvRows = [headers.join(',')];

        for (const airport of AIRPORT_DATA) {
            const values = headers.map(header => {
                let value = airport[header];
                if (typeof value === 'string' && value.includes(',')) {
                    // Enclose value in double quotes if it contains a comma
                    value = `"${value}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'airports.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const isLoading = status === 'inserting';

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mt-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Database Management</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Use the buttons below to manage your airport data. You can automatically seed your Supabase table with a pre-defined list, or download the list as a CSV for manual inspection and upload.
            </p>

            <div className="mt-4 flex items-center space-x-3">
                <button
                    onClick={handleSeed}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <DatabaseIcon className="w-5 h-5 mr-2" />}
                    {status === 'idle' && 'Seed Airport Database'}
                    {status === 'inserting' && `Inserting... ${progress}%`}
                    {status === 'success' && 'Seeding Complete'}
                    {status === 'error' && 'Retry Seeding'}
                </button>
                <button
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download Airports CSV
                </button>
            </div>
            
            {isLoading && (
                <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ 
                            width: `${progress}%`,
                            transition: 'width 0.3s ease-in-out'
                        }}
                    ></div>
                </div>
            )}

            {message && (
                 <div className="mt-4 text-sm" role="status">
                    {status === 'error' && <p className="text-red-600 dark:text-red-400">{message}</p>}
                    {status === 'success' && <p className="text-green-600 dark:text-green-400">{message}</p>}
                    {status === 'inserting' && <p className="text-slate-600 dark:text-slate-300">{message}</p>}
                </div>
            )}
        </div>
    );
};

export default DataSeeder;