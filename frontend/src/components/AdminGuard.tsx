'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

type RootState = {
  auth: {
    isAuthenticated: boolean;
    user: any;
  };
};

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Give Redux a moment to hydrate if needed
    if (isAuthenticated && user?.role === 'ADMIN') {
      setAuthorized(true);
    } else {
      const timeout = setTimeout(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
          setAuthorized(false);
          router.replace('/');
        } else {
          setAuthorized(true);
        }
      }, 500); // short delay to avoid flash of 403 during hydration
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, user, router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans text-xs">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-display font-bold text-red-500 tracking-wider">403 ACCESS DENIED</h2>
        <p className="text-primary-light/50 max-w-sm">
          You do not have permission to access this administrative area.
          Redirecting you to the home page...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
