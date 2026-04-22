import React from 'react';

export const BlueBg = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-100 blur-xl rounded-full pointer-events-none" />
  </>
);
