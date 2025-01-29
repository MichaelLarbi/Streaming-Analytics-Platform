import React from 'react';

export const Alert = ({ className = '', children }) => (
  <div className={`relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 
  [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11 ${className}`}>
    {children}
  </div>
);

export const AlertDescription = ({ className = '', children }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>{children}</div>
);