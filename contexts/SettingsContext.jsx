import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
  const [distanceUnit, setDistanceUnit] = useState(() => {
    // Get saved unit from localStorage or default to 'km'
    return localStorage.getItem('distanceUnit') || 'km';
  });

  // Save to localStorage whenever the unit changes
  useEffect(() => {
    localStorage.setItem('distanceUnit', distanceUnit);
  }, [distanceUnit]);

  const toggleDistanceUnit = () => {
    setDistanceUnit(prevUnit => (prevUnit === 'km' ? 'mi' : 'km'));
  };

  const value = {
    distanceUnit,
    toggleDistanceUnit,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};