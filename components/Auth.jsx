import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { WingitIcon, SpinnerIcon } from './icons.jsx';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured) {
      setError('Application is not configured correctly. Please check environment variables.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    username: username,
                }
            }
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center items-center mb-6">
            <WingitIcon className="w-10 h-10 text-blue-500" />
            <h1 className="ml-3 text-4xl font-bold text-slate-800 dark:text-white tracking-tight">
              Wingit
            </h1>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-8">
          <h2 className="text-2xl font-bold text-center text-slate-700 dark:text-slate-100 mb-2">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">
            {isSignUp ? 'Sign up to start tracking your flights.' : 'Sign in to see your flight log.'}
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Username
                    </label>
                    <input
                        id="username"
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        type="text"
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        aria-label="Username"
                    />
                </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email Address"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {loading ? <SpinnerIcon className="w-5 h-5" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 text-center" role="alert">{error}</p>}
            {message && <p className="text-xs text-green-500 text-center" role="status">{message}</p>}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setMessage(null)
                }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;