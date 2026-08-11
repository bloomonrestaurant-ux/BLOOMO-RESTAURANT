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


      </body>
    </html>
  );
}
