'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store';
import { syncStorage } from '@/store/authSlice';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes cache for instant rendering
      gcTime: 1000 * 60 * 15,    // 15 minutes garbage collection retention
      retry: 1,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync credentials from localStorage to Redux state on load
    store.dispatch(syncStorage());
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
