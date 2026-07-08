'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ChatProvider } from '../context/ChatContext';

// Dynamically import HomeContent with SSR disabled to completely prevent client-server hydration mismatch errors
const HomeContent = dynamic(() => import('../components/HomeContent'), {
  ssr: false,
  loading: () => (
    <div className="app-container" style={{ backgroundColor: '#212121', height: '100vh', width: '100vw' }} />
  ),
});

export default function Home() {
  return (
    <ChatProvider>
      <HomeContent />
    </ChatProvider>
  );
}
