'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import { ShoppingBag, User, LogOut, Calendar, Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close sidebar on path shifts
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Menu', href: '/menu' },
    { label: 'My Orders', href: '/my-orders' },
    { label: 'Book a Private Table', href: '/reservations' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-nav py-3 shadow-xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/image/logo01.png"
            alt="Bloomon Family Restaurant Logo"
            width={44}
            height={44}
            className="rounded-full object-cover"
            priority
          />
          <span className="font-display text-lg md:text-2xl font-bold tracking-widest text-gold-gradient">
            BLOOMON
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center space-x-8 font-sans font-medium tracking-wide">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-primary transition-colors relative ${
                pathname === link.href ? 'text-primary' : 'text-primary-light'
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <motion.span
                  layoutId="underline"
                  className="absolute left-0 top-full block w-full h-[1px] bg-primary mt-1"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Dynamic Controls */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/checkout" className="relative group text-primary-light hover:text-primary transition-colors">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-bg-dark text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full pulse-gold">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link
                href={user?.role === 'ADMIN' || user?.role === 'MANAGER' ? '/admin' : '/dashboard'}
                className="text-primary-light hover:text-primary transition-colors flex items-center space-x-1"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-sans truncate max-w-[120px]">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-primary-light hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="px-5 py-2 text-sm border border-primary text-primary hover:bg-primary hover:text-bg-dark transition-all rounded duration-300 font-sans tracking-wider"
            >
              LOG IN
            </Link>
          )}

        </div>

        {/* Mobile Nav Button */}
        <div className="flex items-center space-x-4 md:hidden">
          <Link href="/checkout" className="relative text-primary-light">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-bg-dark text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-primary hover:text-primary-light transition-colors"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden w-full bg-bg-dark/95 border-b border-primary/20 backdrop-blur-xl absolute top-full left-0 overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-8 flex flex-col space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-lg font-sans font-medium hover:text-primary ${
                    pathname === link.href ? 'text-primary' : 'text-primary-light'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-primary/10 pt-6 flex flex-col space-y-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={user?.role === 'ADMIN' || user?.role === 'MANAGER' ? '/admin' : '/dashboard'}
                      className="text-primary-light flex items-center space-x-2 text-base font-sans"
                    >
                      <User className="w-5 h-5" />
                      <span>{user?.name} (Profile)</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-red-400 flex items-center space-x-2 text-base font-sans text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/dashboard"
                    className="text-primary flex items-center space-x-2 text-base font-sans"
                  >
                    <span>Sign In / Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
