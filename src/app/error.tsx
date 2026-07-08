'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('NextJS caught uncaught error boundary:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(234, 67, 53, 0.1)',
          color: 'var(--danger-color)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          marginBottom: '20px',
        }}
      >
        <AlertTriangle size={28} />
      </div>
      
      <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
        Something went wrong!
      </h1>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '400px' }}>
        An unexpected error occurred in the application rendering thread. You can try resetting the page view.
      </p>

      <button
        onClick={() => reset()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          backgroundColor: 'var(--accent-color)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <RotateCcw size={15} />
        <span>Reload View</span>
      </button>
    </div>
  );
}
