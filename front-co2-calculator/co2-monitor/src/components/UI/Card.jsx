import React from 'react';

export const Card = ({ className, children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children }) => {
  return (
    <div className="px-6 py-4 border-b">
      {children}
    </div>
  );
};

export const CardTitle = ({ children }) => {
  return (
    <div className="text-xl font-bold">
      {children}
    </div>
  );
};

export const CardContent = ({ children }) => {
  return (
    <div className="p-6">
      {children}
    </div>
  );
};