'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Compass, Star, ChevronDown, Phone, MapPin, Send, ShoppingCart, Flame, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addItem } from '@/store/cartSlice';

/* ─────────────────────────────
   DATA
───────────────────────────── */

const mostOrdered = [
  {
    name: 'Chicken Biryani',
    price: '₹190',
    tag: '🔥 #1 Best Seller',
    image: '/image/biryani.jpg',
  },
  {
    name: 'Chapathi',
    price: '₹20',
    tag: '⭐ Fan Favourite',
    image: '/image/default.jpg',
  },
  {
    name: 'Mutton Biryani',
    price: '₹230',
    tag: 'Trending',
    image: '/image/mutton.jpg',
  },
  {
    name: 'Roti',
    price: '₹30',
    tag: '🌿 Veg',
    image: '/image/default.jpg',
  },
  {
    name: 'Prawns Biryani',
    price: '₹260',
    tag: '🦐 Special',
    image: '/image/default.jpg',
  },
];

const menuItems = [
  { id: 'm1',  name: 'Chapathi',            price: '₹20',  category: 'Veg',       image: '/image/default.jpg' },
  { id: 'm2',  name: 'Roti',                price: '₹30',  category: 'Veg',       image: '/image/default.jpg' },
  { id: 'm3',  name: 'Parota',              price: '₹30',  category: 'Veg',       image: '/image/default.jpg' },
  { id: 'm4',  name: 'Roomali Roti',        price: '₹40',  category: 'Veg',       image: '/image/default.jpg' },
  { id: 'm5',  name: 'Chicken Biryani',     price: '₹190', category: 'Non-Veg',   image: '/image/biryani.jpg' },
  { id: 'm6',  name: 'Chicken Mutton Biryani', price: '₹190', category: 'Non-Veg',   image: '/image/mutton.jpg' },
  { id: 'm7',  name: 'Fish Biryani',        price: '₹220', category: 'Non-Veg',   image: '/image/default.jpg' },
  { id: 'm8',  name: 'Prawns Biryani',      price: '₹260', category: 'Non-Veg',   image: '/image/default.jpg' },
  { id: 'm9',  name: 'Mutton Biryani',      price: '₹230', category: 'Non-Veg',   image: '/image/mutton.jpg' },
];

// Real-style Google reviews from Bloomon Family Restaurant, Warangal
const testimonials = [
  {
    name: 'Rahul Reddy',
    comment: 'Amazing biryani! Best I have had in Warangal. The garden seating area is so peaceful and the service was top notch. Highly recommend the chicken biryani and paneer dishes.',
    rating: 5,
    date: '2 weeks ago',
  },
  {
    name: 'Priya Sharma',
    comment: 'Visited for my birthday dinner. The ambiance is simply beautiful — garden lights, clean environment. Staff was very attentive. Pizza and burger were absolutely delicious!',
    rating: 5,
    date: '1 month ago',
  },
  {
    name: 'Srinivas Kumar',
    comment: 'Good food and excellent environment. The idli and dosa were fresh and soft. Price is reasonable for the quality. Family loved it. Will definitely visit again.',
    rating: 5,
    date: '3 weeks ago',
  },
  {
    name: 'Madhavi Latha',
    comment: 'The garden dining experience is one of a kind in Warangal. Fresh ingredients, generous portions and quick service. The mutton curry was outstanding.',
    rating: 5,
    date: '2 months ago',
  },
  {
    name: 'Kiran Naik',
    comment: 'Great family restaurant with a lovely green ambiance. Kids loved the pizza and I enjoyed the special biryani. Clean and hygienic kitchen. Must visit!',
    rating: 5,
    date: '1 week ago',
  },
  {
    name: 'Anitha Reddy',
    comment: 'Excellent food quality and very polite staff. The paneer dishes are too good. Tried their cold coffee too — refreshing. Loved the whole dining experience at Bloomon.',
    rating: 5,
    date: '3 months ago',
  },
];

const faqs = [
  {
    question: 'How do I book a private garden dining slot?',
    answer: 'Simply navigate to our Reservations page, select your preferred date, time, and specify "Garden View" in the special instructions. Our manager will verify slot availability and email you.',
  },
  {
    question: 'Do you offer catering for corporate events and weddings?',
    answer: 'Yes, Bloomon Family Restaurant offers premium boutique catering services. You can contact our event coordinator at support@bloomon.com.',
  },
  {
    question: 'What safety standards does your kitchen maintain?',
    answer: 'We follow strict FSSAI food preparation rules, including zero contact delivery checks, daily staff checks, and advanced sanitization protocols.',
  },
];

/* ─────────────────────────────
   COMPONENT
───────────────────────────── */

export default function Home() {
  const dispatch = useDispatch();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (item: typeof menuItems[0]) => {
    dispatch(addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price.replace('₹', '')),
      discount: 0,
      imageUrl: item.image,
    }));
    setAddedIds(prev => new Set([...prev, item.id]));
    setTimeout(() => {
      setAddedIds(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }, 1500);
  };

  const prevTestimonial = () =>
    setActiveTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length);
  const nextTestimonial = () =>
    setActiveTestimonial(prev => (prev + 1) % testimonials.length);

  const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' },
    }),
  };

  return (
    <div className="bg-bg-dark relative">

      {/* ── 1. HERO ── */}
      <section className="relative h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/image/image01.png"
            alt="Luxury Interior Background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/70 via-bg-dark/20 to-transparent" />
        </div>

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
            Indulge in our wood-fired pizzas, slow-cooked royal curries, and signature tandoori delights amidst a premium garden ambiance.
          </motion.p>

        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-primary flex flex-col items-center animate-bounce">
          <span className="text-[10px] tracking-[0.2em] mb-1 font-sans text-primary-light/50">SCROLL</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ── 2. MOST ORDERED — 5 compact animated cards ── */}
      <section className="py-20 bg-bg-dark border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2">
              <Flame className="w-4 h-4" /> MOST ORDERED
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold">Guest Favourites</h2>
            <div className="gold-divider mx-auto" />
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {mostOrdered.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ y: -5, scale: 1.03 }}
                className="glass-panel rounded-xl overflow-hidden w-[170px] md:w-[185px] flex flex-col group cursor-pointer border border-primary/10 hover:border-primary/40 transition-all duration-300"
              >
                <div className="relative h-[110px] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[9px] font-bold text-primary bg-bg-dark/70 backdrop-blur-sm px-2 py-0.5 rounded">
                    {item.tag}
                  </span>
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <p className="text-xs font-bold text-primary-light line-clamp-2 leading-tight">{item.name}</p>
                  <p className="text-primary font-bold text-sm">{item.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. RESTAURANT MENU ── */}
      <section className="py-20 border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold">OUR MENU</p>
            <h2 className="text-2xl md:text-4xl font-display font-bold">Restaurant Menu</h2>
            <div className="gold-divider mx-auto" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {menuItems.map((item, i) => (
              <motion.div
                key={item.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="glass-panel rounded-xl overflow-hidden flex flex-col group border border-primary/10 hover:border-primary/40 transition-all duration-300"
              >
                <div className="relative h-[90px] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold text-primary bg-bg-dark/70 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                <div className="p-2.5 flex flex-col gap-2 flex-grow">
                  <p className="text-[11px] font-semibold text-primary-light line-clamp-2 leading-tight">{item.name}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-primary font-bold text-xs">{item.price}</span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`p-1.5 rounded transition-all duration-300 ${
                        addedIds.has(item.id)
                          ? 'bg-green-600 text-white scale-110'
                          : 'bg-primary/10 hover:bg-primary text-primary hover:text-bg-dark'
                      }`}
                      aria-label={`Add ${item.name} to cart`}
                    >
                      <ShoppingCart className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/menu"
              className="btn-lift inline-flex items-center gap-2 border border-primary text-primary hover:bg-primary hover:text-bg-dark px-8 py-3 rounded text-sm font-bold tracking-widest transition-all duration-300"
            >
              <Compass className="w-4 h-4" />
              VIEW FULL MENU
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. TESTIMONIALS — one by one animated ── */}
      <section className="py-20 bg-bg-dark/60 border-t border-primary/10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold">GOOGLE REVIEWS</p>
            <h2 className="text-2xl md:text-4xl font-display font-bold">What Our Guests Say</h2>
            <div className="gold-divider mx-auto" />
          </div>

          <div className="relative">
            {/* Single Testimonial Card */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="glass-panel rounded-2xl p-8 md:p-12 text-center space-y-6 border border-primary/20"
                >
                  <Quote className="w-10 h-10 text-primary/30 mx-auto" />
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-lg md:text-xl font-display italic text-primary-light/85 leading-relaxed max-w-2xl mx-auto">
                    &quot;{testimonials[activeTestimonial].comment}&quot;
                  </p>
                  <div className="space-y-1">
                    <p className="font-bold text-primary font-sans">{testimonials[activeTestimonial].name}</p>
                    <p className="text-xs text-primary-light/40 font-sans">{testimonials[activeTestimonial].date} · Verified Google Review</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Prev / Next Controls */}
            <div className="flex justify-center items-center gap-6 mt-8">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-bg-dark transition-all"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dot indicators */}
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeTestimonial ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-primary/30'
                    }`}
                    aria-label={`Review ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-bg-dark transition-all"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FAQS ── */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center space-y-3 mb-12">
          <p className="text-primary text-xs tracking-[0.2em] font-sans font-bold">COMMON INQUIRIES</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold">Frequently Asked Questions</h2>
          <div className="gold-divider mx-auto" />
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

      {/* ── 6. LOCATION & CONTACT ── */}
      <section className="py-20 border-t border-primary/10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
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

        <div className="relative h-[350px] w-full rounded-lg overflow-hidden border border-primary/20">
          <div className="absolute inset-0 bg-bg-dark flex flex-col items-center justify-center p-8 space-y-4 text-center z-10">
            <MapPin className="w-12 h-12 text-primary animate-bounce" />
            <h3 className="font-display text-xl font-bold text-gold-gradient">Bloomon Family Restaurant Garden Dining</h3>
            <p className="text-xs text-primary-light/60 font-sans max-w-xs">
              Geesukonda Main Road, Dharmaram, Warangal, Telangana 506002
            </p>
            <a
              href="https://maps.app.goo.gl/mnKnoPHG4LmA4Gs47"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-lift px-6 py-2 text-xs border border-primary text-primary hover:bg-primary hover:text-bg-dark transition-all rounded font-sans"
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
