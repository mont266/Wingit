
import React from 'react';
import { WingitIcon, UserIcon } from './icons';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';

type View = 'dashboard' | 'profile';

interface HeaderProps {
    session: Session | null;
    profile: { username: string } | null;
    currentView: View;
    setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ session, profile, currentView, setView }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <button 
          onClick={() => setView('dashboard')} 
          className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 -ml-1"
          aria-label="Go to flight dashboard"
        >
            <WingitIcon className="w-8 h-8 text-blue-500" />
            <h1 className="ml-3 text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Wingit
            </h1>
        </button>
        {session && (
          <div className="flex items-center space-x-2 sm:space-x-4">
            {profile?.username && (
              <p className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-300">
                Welcome, <span className="font-bold">{profile.username}</span>
              </p>
            )}
            <button
              onClick={() => setView('profile')}
              className={`p-2 rounded-full transition-colors ${currentView === 'profile' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
              aria-label="View Profile"
              aria-pressed={currentView === 'profile'}
            >
                <UserIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
