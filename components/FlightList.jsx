import React from 'react';
import FlightItem from './FlightItem.jsx';

const FlightList = ({ flights, onDelete, onEdit, showICAO }) => {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {flights.map(flight => (
        <FlightItem key={flight.id} flight={flight} onDelete={onDelete} onEdit={onEdit} showICAO={showICAO} />
      ))}
    </div>
  );
};

export default FlightList;
