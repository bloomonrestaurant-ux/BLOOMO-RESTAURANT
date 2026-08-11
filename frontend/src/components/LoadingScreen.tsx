'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show loader only once per browser session
    const hasLoaded = sessionStorage.getItem('bloomon_loaded');
    if (!hasLoaded) {
      setVisible(true);
      sessionStorage.setItem('bloomon_loaded', 'true');

      // Start fade-out after 2.4s
      const fadeTimer = setTimeout(() => setFading(true), 2400);
      // Fully unmount after fade completes (0.7s transition)
      const hideTimer = setTimeout(() => setVisible(false), 3100);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#0B0B0C',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        transition: 'opacity 0.7s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Animated logo mark */}
      <div
        style={{
          animation: 'scaleInLogo 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Gold emblem ring with logo */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '2px solid #D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 32px rgba(212,175,55,0.35)',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/logo01.png"
            alt="Bloomon Family Restaurant Logo"
            width={96}
            height={96}
            style={{ objectFit: 'cover', borderRadius: '50%' }}
          />
        </div>

        {/* Restaurant name */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #C5A02E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}
          >
            Bloomon
          </p>
          <p
            style={{
              fontFamily: '"Poppins", system-ui, sans-serif',
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: '0.35em',
              color: 'rgba(243,229,171,0.55)',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Family Restaurant
          </p>
        </div>
      </div>

      {/* Shimmer progress bar */}
      <div
        style={{
          position: 'relative',
          width: 160,
          height: 2,
          background: 'rgba(212,175,55,0.18)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
        className="loader-shimmer"
      />

      <p
        style={{
          fontFamily: '"Poppins", system-ui, sans-serif',
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          color: 'rgba(243,229,171,0.35)',
          margin: 0,
        }}
      >
        CRAFTING YOUR EXPERIENCE…
      </p>
    </div>
  );
}
