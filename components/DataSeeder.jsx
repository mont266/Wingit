import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { DatabaseIcon, SpinnerIcon, DownloadIcon, DistanceIcon } from './icons.jsx';
import { AIRPORT_DATA } from '../services/airportData.js';
import { calculateHaversineDistance } from '../services/geoUtils.js';

const DataSeeder = () => {
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [recalcStatus, setRecalcStatus] = useState('idle');
    const [recalcMessage, setRecalcMessage] = useState('');

    const isAnyLoading = status === 'inserting' || recalcStatus === 'running';

    const handleSeed = async () => {
        if (!confirm("This will completely replace the current airport data in your database with a new, comprehensive list of over 250 major world airports. This ensures your data is accurate and free of duplicates. Do you want to continue?")) {
            return;
        }

        setRecalcStatus('idle');
        setRecalcMessage('');
        setStatus('inserting');
        setProgress(0);
        const airports = AIRPORT_DATA;
        
        try {
            setMessage(<p className="text-slate-600 dark:text-slate-300">{`Found ${airports.length} airports in the master list. Replacing data in database...`}</p>);

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
                setMessage(<p className="text-slate-600 dark:text-slate-300">{`Inserting... ${currentProgress}% complete.`}</p>);
            }

            setStatus('success');
            setMessage(<p className="text-green-600 dark:text-green-400">{`Successfully populated the database with ${airports.length} airports.`}</p>);

        } catch (err) {
            setStatus('error');
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (errorMessage.includes('violates row-level security policy')) {
                const RlsErrorComponent = (
                    <div className="text-slate-700 dark:text-slate-300 space-y-2">
                        <p className="font-bold text-red-600 dark:text-red-400">Seeding Failed: Row-Level Security Policy</p>
                        <p>This happens when RLS is enabled, but no policy allows your user to perform <code>INSERT</code> and <code>DELETE</code> operations. This is an important security step!</p>
                        
                        <p className="font-semibold">How to Fix:</p>
                        <p>Create a policy in Supabase that grants 'admin' users full access to the <code>airports</code> table.</p>

                        <details className="mt-2 p-3 border dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <summary className="font-semibold cursor-pointer">Option 1: Use the Supabase UI (Recommended)</summary>
                            <ol className="list-decimal list-inside mt-2 space-y-1 pl-2 text-sm">
                                <li>Go to your Supabase project dashboard.</li>
                                <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Policies</strong>.</li>
                                <li>Find the <code>airports</code> table and click <strong>New Policy</strong>.</li>
                                <li>Select <strong>"Create a policy from scratch"</strong>.</li>
                                <li>Set the <strong>Policy name</strong> to "Admins can manage airports".</li>
                                <li>For <strong>Allowed operation</strong>, check all: <strong>SELECT, INSERT, UPDATE, DELETE</strong>.</li>
                                <li>For <strong>Target roles</strong>, keep <code>authenticated</code>.</li>
                                <li>In the <strong>USING expression</strong> and <strong>WITH CHECK expression</strong> boxes, paste this condition:
                                    <pre className="mt-1 p-2 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono"><code>{`(SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'`}</code></pre>
                                </li>
                                <li>Click <strong>Review</strong> and then <strong>Save policy</strong>.</li>
                            </ol>
                        </details>

                        <details className="mt-2 p-3 border dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <summary className="font-semibold cursor-pointer">Option 2: Run a SQL Snippet</summary>
                            <p className="mt-2 text-sm">In the Supabase <strong>SQL Editor</strong>, run the following command:</p>
                            <div className="mt-2 p-3 bg-slate-200 dark:bg-slate-700 rounded-md text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                                <code className="whitespace-pre">
{`CREATE POLICY "Admins can manage airports"
ON public.airports
FOR ALL
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' )
WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );`}
                                </code>
                            </div>
                        </details>

                        <p className="pt-2">After adding the policy, try seeding the database again.</p>
                        <a href="https://supabase.com/docs/guides/auth/row-level-security" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-semibold inline-block">Learn more about Supabase RLS policies</a>
                    </div>
                );
                setMessage(RlsErrorComponent);
            } else {
                setMessage(<p className="text-red-600 dark:text-red-400">{errorMessage}</p>);
            }
        }
    };

    const handleRecalculateDistances = async () => {
        if (!confirm("This will recalculate the distance for all your existing flights based on the airport data in the database. This will overwrite any existing distance values. Are you sure?")) {
            return;
        }

        setStatus('idle');
        setMessage('');
        setProgress(0);
        setRecalcStatus('running');
        setRecalcMessage('Fetching your flights...');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Could not identify the current user.");

            const { data: flights, error: flightsError } = await supabase
                .from('flights')
                .select('*')
                .eq('user_id', user.id);
            
            if (flightsError) throw flightsError;

            if (!flights || flights.length === 0) {
                setRecalcStatus('success');
                setRecalcMessage("You don't have any flights to recalculate.");
                return;
            }

            setRecalcMessage(`Found ${flights.length} flights. Fetching airport coordinates...`);

            const iataCodes = [...new Set(flights.flatMap(f => [f.from, f.to]))];
            const { data: coords, error: coordError } = await supabase
                .from('airports')
                .select('iata, lat, lon')
                .in('iata', iataCodes);
            
            if (coordError) throw coordError;
            
            const coordsMap = new Map(coords.map(c => [c.iata, { lat: c.lat, lon: c.lon }]));
            
            const flightsToUpdate = [];
            let notFoundCount = 0;

            for (const flight of flights) {
                const fromCoord = coordsMap.get(flight.from);
                const toCoord = coordsMap.get(flight.to);

                if (fromCoord && toCoord) {
                    const newDistance = Math.round(calculateHaversineDistance(fromCoord.lat, fromCoord.lon, toCoord.lat, toCoord.lon));
                    if (newDistance !== flight.distance) {
                        flightsToUpdate.push({ ...flight, distance: newDistance });
                    }
                } else {
                    notFoundCount++;
                }
            }

            if (flightsToUpdate.length === 0) {
                 setRecalcStatus('success');
                 let message = "All flight distances are already correct.";
                 if (notFoundCount > 0) {
                     message += ` (${notFoundCount} flights were skipped due to missing airport data.)`
                 }
                 setRecalcMessage(message);
                 return;
            }

            setRecalcMessage(`Recalculating and updating ${flightsToUpdate.length} flights...`);

            const { error: updateError } = await supabase
                .from('flights')
                .upsert(flightsToUpdate);

            if (updateError) throw updateError;

            setRecalcStatus('success');
            let successMessage = `Successfully updated ${flightsToUpdate.length} flight distances. The page will reload in 3 seconds to reflect the changes.`;
             if (notFoundCount > 0) {
                successMessage += ` ${notFoundCount} flights were skipped due to missing airport data.`
            }
            setRecalcMessage(successMessage);

            setTimeout(() => window.location.reload(), 3000);

        } catch (err) {
            setRecalcStatus('error');
            let errorMessage = 'An unknown error occurred.';
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (err && typeof err.message === 'string') {
                errorMessage = err.message;
            }
            
            if (errorMessage.includes('violates row-level security policy') && errorMessage.includes('flights')) {
                const RlsErrorForFlights = (
                    <div className="text-slate-700 dark:text-slate-300 space-y-2">
                        <p className="font-bold text-red-600 dark:text-red-400">Update Failed: Row-Level Security Policy</p>
                        <p>The database is correctly preventing the application from updating your flights. This is because RLS is enabled on the <code>flights</code> table, but a policy allowing <strong>UPDATE</strong> operations is missing.</p>
                        
                        <p className="font-semibold">How to Fix:</p>
                        <p>You need to add a new policy in Supabase that allows users to update their own flight records.</p>
        
                        <details className="mt-2 p-3 border dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <summary className="font-semibold cursor-pointer">Option 1: Use the Supabase UI (Recommended)</summary>
                            <ol className="list-decimal list-inside mt-2 space-y-1 pl-2 text-sm">
                                <li>Go to your Supabase project dashboard.</li>
                                <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Policies</strong>.</li>
                                <li>Find the <code>flights</code> table and click <strong>New Policy</strong>.</li>
                                <li>Select <strong>"Create a policy from scratch"</strong>.</li>
                                <li>Set the <strong>Policy name</strong> to "Users can update their own flights".</li>
                                <li>For <strong>Allowed operation</strong>, check <strong>UPDATE</strong>.</li>
                                <li>The <strong>USING expression</strong> determines which rows can be updated. Paste this condition:
                                    <pre className="mt-1 p-2 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono"><code>auth.uid() = user_id</code></pre>
                                </li>
                                 <li>The <strong>WITH CHECK expression</strong> prevents users from changing a flight to belong to someone else. Use the same condition:
                                    <pre className="mt-1 p-2 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono"><code>auth.uid() = user_id</code></pre>
                                </li>
                                <li>Click <strong>Review</strong> and then <strong>Save policy</strong>.</li>
                            </ol>
                        </details>
        
                        <details className="mt-2 p-3 border dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <summary className="font-semibold cursor-pointer">Option 2: Run a SQL Snippet</summary>
                            <p className="mt-2 text-sm">In the Supabase <strong>SQL Editor</strong>, run the following command:</p>
                            <div className="mt-2 p-3 bg-slate-200 dark:bg-slate-700 rounded-md text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                                <code className="whitespace-pre">
{`CREATE POLICY "Users can update their own flights"
ON public.flights
FOR UPDATE
TO authenticated
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );`}
                                </code>
                            </div>
                        </details>
        
                        <p className="pt-2">After adding the policy, try recalculating the distances again.</p>
                    </div>
                );
                setRecalcMessage(RlsErrorForFlights);
            } else {
                setRecalcMessage(<p>Error: {errorMessage}</p>);
            }
        }
    };


    const handleDownloadCsv = () => {
        const headers = ['iata', 'icao', 'name', 'city', 'country', 'lat', 'lon'];
        const csvRows = [headers.join(',')];

        for (const airport of AIRPORT_DATA) {
            const values = headers.map(header => {
                let value = airport[header];
                if (typeof value === 'string' && value.includes(',')) {
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
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mt-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Database Management (Admin Tool)</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Use the buttons below to manage your airport and flight data. This provides a fast, reliable way to keep your application data accurate.
            </p>

            <div className="mt-4 flex flex-wrap items-start gap-3">
                <button
                    onClick={handleSeed}
                    disabled={isAnyLoading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {status === 'inserting' ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <DatabaseIcon className="w-5 h-5 mr-2" />}
                    {status === 'idle' && 'Seed Airport Database'}
                    {status === 'inserting' && `Seeding... ${progress}%`}
                    {status === 'success' && 'Seeding Complete'}
                    {status === 'error' && 'Retry Seeding'}
                </button>
                 <button
                    onClick={handleRecalculateDistances}
                    disabled={isAnyLoading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {recalcStatus === 'running' ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <DistanceIcon className="w-5 h-5 mr-2" />}
                    {recalcStatus === 'running' ? 'Recalculating...' : 'Recalculate Distances'}
                </button>
                <button
                    onClick={handleDownloadCsv}
                    disabled={isAnyLoading}
                    className="inline-flex items-center px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Download Master Airport CSV
                </button>
            </div>
            
            {status !== 'idle' && (
                <div className="mt-4 space-y-2">
                    {status === 'inserting' && (
                         <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ 
                                    width: `${progress}%`,
                                    transition: 'width 0.3s ease-in-out'
                                }}
                            ></div>
                        </div>
                    )}
                    {message && <div className="text-sm" role="status">{message}</div>}
                </div>
            )}
            
            {recalcStatus !== 'idle' && (
                 <div className={`mt-4 text-sm p-3 rounded-md ${recalcStatus === 'error' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-700/50'}`} role="status">
                    {recalcMessage}
                </div>
            )}
        </div>
    );
};

export default DataSeeder;