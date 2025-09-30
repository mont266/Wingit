import React from 'react';
import { Flight } from '../types';
import FlightItem from './FlightItem';

interface FlightListProps {
  flights: Flight[];
  onDelete: (id: string) => void;
  showICAO: boolean;
}

const FlightList: React.FC<FlightListProps> = ({ flights, onDelete, showICAO }) => {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {flights.map(flight => (
        <FlightItem key={flight.id} flight={flight} onDelete={onDelete} showICAO={showICAO} />
      ))}
    </div>
  );
};

export default FlightList;