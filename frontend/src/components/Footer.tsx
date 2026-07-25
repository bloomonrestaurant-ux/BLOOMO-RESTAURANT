import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Mail, Clock, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bg-dark border-t border-primary/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* About Section */}
        <div className="space-y-4">
          <h3 className="font-display text-2xl font-bold text-gold-gradient">
            BLOOMON FAMILY RESTAURANT
          </h3>
          <p className="text-sm font-sans text-primary-light/70 leading-relaxed">
            Reimagining fine dining in Warangal. Indulge in wood-fired delights, legacy tandoors, and luxury garden setups crafted for the royal family experiences.
          </p>
          <div className="flex items-center space-x-2 text-xs text-primary/80 font-sans">
            <ShieldCheck className="w-4 h-4" />
            <span>FSSAI Certified Luxury Kitchen</span>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-4 font-sans text-sm">
          <h4 className="font-display text-lg text-primary font-semibold">FIND US</h4>
          <div className="flex items-start space-x-3 text-primary-light/70">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
            <span>Geesukonda Main Road, Dharmaram, Warangal, Telangana - 506002</span>
          </div>
          <div className="flex items-center space-x-3 text-primary-light/70">
            <Phone className="w-4 h-4 text-primary" />
            <span>+91 93920 54442</span>
          </div>
          <div className="flex items-center space-x-3 text-primary-light/70">
            <Mail className="w-4 h-4 text-primary" />
            <span>contact@bloomon.com</span>
          </div>
        </div>

        {/* Hours of operation */}
        <div className="space-y-4 font-sans text-sm">
          <h4 className="font-display text-lg text-primary font-semibold">DINING HOURS</h4>
          <div className="flex items-start space-x-3 text-primary-light/70">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-primary-light">Monday - Sunday</p>
              <p className="text-xs text-primary-light/50">11:00 AM - 11:00 PM</p>
              <p className="text-xs text-primary">Kitchen closes at 10:30 PM</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4 font-sans text-sm">
          <h4 className="font-display text-lg text-primary font-semibold">EXPLORE</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/menu" className="text-primary-light/70 hover:text-primary transition-colors">
                Gourmet Menu
              </Link>
            </li>
            <li>
              <Link href="/reservations" className="text-primary-light/70 hover:text-primary transition-colors">
                Book A Table
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-primary-light/70 hover:text-primary transition-colors">
                Your Account
              </Link>
            </li>
            <li>
              <Link href="/tracking" className="text-primary-light/70 hover:text-primary transition-colors">
                Track Order
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-primary/10 text-center font-sans text-xs text-primary-light/40 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} Bloomon Family Restaurant. All Rights Reserved.</p>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}
