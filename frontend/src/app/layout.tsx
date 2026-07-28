import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bloomon Family Restaurant | Garden Dining & Fine Cuisine',
  description: 'Experience gourmet dining at Bloomon Family Restaurant in Warangal. Wood-fired pizzas, signature Indian curries, and premium garden ambiance.',
  keywords: 'Bloomon Family Restaurant, Warangal Restaurant, Fine Dining, Garden Restaurant, Online Food Delivery, Table Reservation, Indian Cuisine',
  openGraph: {
    title: 'Bloomon Family Restaurant | Garden Dining',
    description: 'Order online or book a luxury table at Warangal’s finest garden restaurant.',
    images: [{ url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }],
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Schema.org JSON-LD Metadata for Local Restaurant SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              'name': 'Bloomon Family Restaurant',
              'image': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
              'address': {
                '@type': 'PostalAddress',
                'streetAddress': 'Geesukonda Main Road, Dharmaram',
                'addressLocality': 'Warangal',
                'addressRegion': 'Telangana',
                'postalCode': '506002',
                'addressCountry': 'IN',
              },
              'telephone': '+919392054442',
              'priceRange': '$$',
              'servesCuisine': 'Indian, Chinese, South Indian, Tandoori, Fast Food, Pizzas',
              'openingHoursSpecification': {
                '@type': 'OpeningHoursSpecification',
                'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                'opens': '11:00',
                'closes': '23:00',
              },
            }),
          }}
        />
      </head>
      <body className="bg-bg-dark text-primary-light min-h-screen flex flex-col antialiased">
        {/* Premium loading splash — shown once per session */}
        <LoadingScreen />

        <Providers>
          <Navigation />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <Footer />
        </Providers>

        {/* WhatsApp Floating Action Button */}
        <a
          href="https://wa.me/919392054442"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Bloomon on WhatsApp"
          className="whatsapp-float pulse-gold"
        >
          {/* High-resolution WhatsApp SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="30"
            height="30"
            fill="none"
          >
            <circle cx="24" cy="24" r="24" fill="#25D366" />
            <path
              d="M34.7 13.3A14.8 14.8 0 0 0 24 9C16.3 9 10 15.3 10 23c0 2.5.7 4.9 1.9 7L10 39l9.3-1.8a14.9 14.9 0 0 0 14.7-3.8A14.8 14.8 0 0 0 38 23c0-3.8-1.5-7.4-3.3-9.7zM24 36.2a12.3 12.3 0 0 1-6.3-1.7l-.5-.3-5.5 1.1 1.1-5.3-.3-.5A12.3 12.3 0 0 1 11.7 23C11.7 16.2 17.3 10.7 24 10.7c3.3 0 6.3 1.3 8.6 3.5a12 12 0 0 1 3.5 8.6c.1 6.8-5.4 13.4-12.1 13.4zm6.7-9.2c-.4-.2-2.2-1.1-2.5-1.2-.3-.1-.6-.2-.8.2-.2.4-.9 1.2-1.1 1.4-.2.2-.4.2-.8 0a9.9 9.9 0 0 1-3-1.8 10.7 10.7 0 0 1-2-2.7c-.2-.4 0-.6.2-.8l.5-.6c.2-.2.2-.4.4-.6.1-.2 0-.5 0-.6-.2-.4-.8-1.9-1.1-2.6-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.1 3.4 1.4 3.4.9 4 .9.6 0 2.2-.9 2.5-1.7.3-.8.3-1.5.2-1.7-.2-.2-.4-.3-.7-.4z"
              fill="#fff"
            />
          </svg>
        </a>
      </body>
    </html>
  );
}
