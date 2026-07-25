'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Compass, Star, ChevronDown, Phone, MapPin, Send } from 'lucide-react';

const featuredDishes = [
  {
    name: 'Bloomon Special Chicken Biryani',
    price: '₹350',
    description: 'Aromatic basmati rice cooked with succulent chicken, rich saffron, and local spices.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600',
    tag: 'Signature'
  },
  {
    name: 'Royale Paneer Butter Masala',
    price: '₹280',
    description: 'Cottage cheese cubes simmered in a rich, buttery tomato gravy with fresh cream.',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=600',
    tag: 'Best Seller'
  },
  {
    name: 'Artisanal Sourdough Cheese Pizza',
    price: '₹450',
    description: 'Wood-fired sourdough crust topped with premium fresh mozzarella and basil leaves.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
    tag: 'Trending'
  }
];

const testimonials = [
  {
    name: 'Rohan Sharma',
    comment: 'The Special Chicken Biryani is hands down the best in Warangal! Beautiful garden seating and exceptional service.',
    rating: 5,
  },
  {
    name: 'Anjali Reddy',
    comment: 'Gorgeous dark and gold theme. The wood-fired pizza was super authentic. Felt like dining in a royal palace.',
    rating: 5,
  },
  {
    name: 'Dr. Srinivas Rao',
    comment: 'Excellent table booking setup. Booked a private table for my anniversary. The chef personally curated our mains.',
    rating: 5,
  }
];

const faqs = [
  {
    question: 'How do I book a private garden dining slot?',
    answer: 'Simply navigate to our Reservations page, select your preferred date, time, and specify "Garden View" in the special instructions. Our manager will verify slot availability and email you.'
  },
  {
    question: 'Do you offer catering for corporate events and weddings?',
    answer: 'Yes, Bloomon Family Restaurant offers premium boutique catering services. You can contact our event coordinator at support@bloomon.com.'
  },
  {
    question: 'What safety standards does your kitchen maintain?',
    answer: 'We follow strict FSSAI food preparation rules, including zero contact delivery checks, daily staff checks, and advanced sanitization protocols.'
  }
];

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  return (
    <div className="bg-bg-dark relative">
      {/* 1. HERO SECTION WITH ANIMATED BACKDROP */}
      <section className="relative h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="Luxury Interior Background"
            fill
            priority
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-dark via-transparent to-bg-dark" />
        </div>

        {/* Animated Contents */}
        <div className="relative z-10 text-center max-w-4xl px-6 space-y-6">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-primary font-sans text-sm md:text-base font-semibold tracking-[0.3em]"
          >
            A CULINARY REVELATION IN TELANGANA
          </motion.p>
          <motion.h1
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-7xl font-display font-extrabold text-gold-gradient tracking-wide"
          >
            Taste Royal Luxury <br />
            At Bloomon Family Restaurant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-primary-light/75 text-base md:text-lg max-w-xl mx-auto leading-relaxed"
          >
            Indulge in our wood-fired sourdough pizzas, slow-cooked royal curries, and signature tandoori delights amidst a premium garden ambiance.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6"
          >
            <Link
              href="/menu"
              className="glow-btn w-full sm:w-auto bg-gold-gradient text-bg-dark px-8 py-3.5 rounded text-sm font-bold tracking-widest hover:opacity-95 shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORE GOURMET MENU</span>
            </Link>
            <Link
              href="/reservations"
              className="w-full sm:w-auto border border-primary text-primary hover:bg-primary hover:text-bg-dark px-8 py-3.5 rounded text-sm font-bold tracking-widest transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>BOOK A PRIVATE TABLE</span>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-primary flex flex-col items-center animate-bounce">
          <span className="text-[10px] tracking-[0.2em] mb-1 font-sans text-primary-light/50">SCROLL</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* 2. THE STORY SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="space-y-6"
        >
          <motion.h4 variants={itemVariants} className="text-primary text-xs tracking-[0.2em] font-sans font-bold">
            CULINARY HERITAGE
          </motion.h4>
          <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-display font-bold leading-tight">
            From Garden Grill <br />
            To Imperial Table
          </motion.h2>
          <motion.p variants={itemVariants} className="text-primary-light/75 font-sans leading-relaxed text-sm md:text-base">
            Bloomon Family Restaurant began as a humble veg garden-style family hangout, serving traditional clay tandoors and local delights. Rooted in the rich cultural history of Warangal, we reimagined our dining space into an onyx-and-gold themed luxury retreat.
          </motion.p>
          <motion.p variants={itemVariants} className="text-primary-light/70 font-sans leading-relaxed text-sm">
            Our culinary team values farm-fresh local spices, premium imported oils, and slow hand-cooking methods, providing a luxurious experience that feels both familiar and refreshingly upscale.
          </motion.p>
          <motion.div variants={itemVariants} className="pt-4">
            <Link
              href="/menu"
              className="text-primary border-b border-primary hover:text-primary-light hover:border-primary-light transition-all pb-1 tracking-wider text-sm font-semibold"
            >
              READ CHEF’S DIARY →
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating luxury photos */}
        <div className="relative h-[480px] w-full shrink-0">
          <div className="absolute top-0 left-0 w-3/4 h-[320px] rounded-lg overflow-hidden border border-primary/20 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=500"
              alt="Plated Dish"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-3/4 h-[320px] rounded-lg overflow-hidden border-2 border-primary/30 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"
              alt="Luxury Dining Table"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* 3. FEATURED DISHES SECTION */}
      <section className="py-24 bg-bg-dark/50 border-t border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold">CHEF RECOMMENDATIONS</p>
            <h2 className="text-3xl md:text-5xl font-display font-bold">Featured Delicacies</h2>
            <div className="w-24 h-[1px] bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredDishes.map((dish, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="glass-panel rounded-lg overflow-hidden flex flex-col h-full group"
              >
                <div className="relative h-[250px] overflow-hidden">
                  <Image
                    src={dish.image}
                    alt={dish.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-4 left-4 bg-primary text-bg-dark text-xs font-bold px-3 py-1 rounded">
                    {dish.tag}
                  </span>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold font-sans text-primary-light">{dish.name}</h3>
                      <span className="text-primary font-bold">{dish.price}</span>
                    </div>
                    <p className="text-xs text-primary-light/60 font-sans leading-relaxed">
                      {dish.description}
                    </p>
                  </div>
                  <Link
                    href="/menu"
                    className="text-center bg-transparent border border-primary/40 text-primary group-hover:bg-primary group-hover:text-bg-dark py-2 rounded text-xs font-bold transition-all"
                  >
                    ADD TO CART
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE CHEF PROFILE */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative h-[480px] w-full shrink-0 rounded-lg overflow-hidden border border-primary/20">
          <Image
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=600"
            alt="Chef Devraj Profile"
            fill
            className="object-cover"
          />
        </div>
        <div className="space-y-6">
          <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold">CULINARY VISIONARY</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">Meet Executive Chef Devraj</h2>
          <blockquote className="border-l-2 border-primary pl-4 text-primary-light/80 italic font-display text-lg">
            "Food is a bridge between cultural memories and physical wellness. At Bloomon Family Restaurant, we marry the age-old heritage of Indian slow cookers with modern luxury palettes."
          </blockquote>
          <p className="text-sm text-primary-light/65 font-sans leading-relaxed">
            With over 18 years of experience at premium Michelin-tier kitchens across Hyderabad and Mumbai, Chef Devraj specializes in wood-fired sourdough baking and traditional Hyderabadi-Telangana spice fusions.
          </p>
          <div className="flex items-center space-x-6 pt-4 font-sans text-xs">
            <div>
              <p className="text-primary font-bold text-lg">100%</p>
              <p className="text-primary-light/50">Fresh Ingredients</p>
            </div>
            <div>
              <p className="text-primary font-bold text-lg">45+</p>
              <p className="text-primary-light/50">Luxury Menu Items</p>
            </div>
            <div>
              <p className="text-primary font-bold text-lg">15K+</p>
              <p className="text-primary-light/50">Happy Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-24 bg-bg-dark/50 border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold">WHAT PATRONS SAY</p>
            <h2 className="text-3xl md:text-5xl font-display font-bold">Customer Testimonials</h2>
            <div className="w-24 h-[1px] bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-lg flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex space-x-1 text-primary">
                    {Array.from({ length: test.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm font-sans text-primary-light/80 italic leading-relaxed">
                    "{test.comment}"
                  </p>
                </div>
                <div className="font-sans">
                  <p className="font-bold text-sm text-primary">{test.name}</p>
                  <p className="text-xs text-primary-light/40">Verified Dine-in Guest</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQS SECTION */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold">COMMON INQUIRIES</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold">Frequently Asked Questions</h2>
          <div className="w-24 h-[1px] bg-primary mx-auto" />
        </div>

        <div className="space-y-4 font-sans">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-primary/10 pb-4">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center py-3 text-left font-bold text-primary-light hover:text-primary transition-colors focus:outline-none"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-primary transition-transform duration-300 ${
                    activeFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-primary-light/70 leading-relaxed pb-4">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 7. LOCATION & QUICK NEWSLETTER CONTACT */}
      <section className="py-24 border-t border-primary/10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Contact Info and Newsletter */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-display font-bold">Contact Bloomon Family Restaurant</h2>
            <p className="text-sm text-primary-light/60 font-sans">
              Have questions, feedback, or need reservation assistance? Get in touch.
            </p>
          </div>

          <div className="space-y-4 font-sans text-sm">
            <div className="flex items-center space-x-3 text-primary-light/70">
              <MapPin className="w-5 h-5 text-primary" />
              <span>Geesukonda Main Road, Dharmaram, Warangal, Telangana - 506002</span>
            </div>
            <div className="flex items-center space-x-3 text-primary-light/70">
              <Phone className="w-5 h-5 text-primary" />
              <span>+91 93920 54442</span>
            </div>
          </div>

          <form className="space-y-4 font-sans max-w-md">
            <h4 className="text-sm font-bold text-primary tracking-wide">SUBSCRIBE FOR EXCLUSIVE OFFERS</h4>
            <div className="flex border border-primary/20 rounded overflow-hidden focus-within:border-primary">
              <input
                type="email"
                placeholder="Enter your email address"
                className="bg-white/5 px-4 py-3 text-sm text-primary-light w-full focus:outline-none"
              />
              <button
                type="button"
                className="bg-gold-gradient text-bg-dark px-6 py-3 font-bold hover:opacity-90 flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Styled Maps Mock */}
        <div className="relative h-[350px] w-full rounded-lg overflow-hidden border border-primary/20">
          {/* Using a styled image or iframe showing local Warangal details */}
          <div className="absolute inset-0 bg-bg-dark flex flex-col items-center justify-center p-8 space-y-4 text-center z-10">
            <MapPin className="w-12 h-12 text-primary animate-bounce" />
            <h3 className="font-display text-xl font-bold text-gold-gradient">Bloomon Family Restaurant Garden Dining</h3>
            <p className="text-xs text-primary-light/60 font-sans max-w-xs">
              Geesukonda Main Road, Dharmaram, Warangal, Telangana 506002
            </p>
            <a
              href="https://maps.app.goo.gl/WhsLm5jpqSqPcrBF7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 text-xs border border-primary text-primary hover:bg-primary hover:text-bg-dark transition-all rounded font-sans"
            >
              OPEN GOOGLE MAPS
            </a>
          </div>
          <Image
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
            alt="Interactive Map Location Layout"
            fill
            className="object-cover opacity-10 filter grayscale"
          />
        </div>
      </section>
    </div>
  );
}
