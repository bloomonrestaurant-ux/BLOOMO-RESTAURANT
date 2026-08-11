'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

export default function ScrollingFoodAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the global window scroll
  const { scrollYProgress } = useScroll();

  // Background fade in/out
  const bgOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Center Plate (Biryani) Animation
  const centerScale = useTransform(scrollYProgress, [0, 0.4, 1], [0.8, 1.2, 1.5]);
  const centerOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const centerRotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  // Left Ingredient (Chicken 65) Animation
  const leftX = useTransform(scrollYProgress, [0, 0.5, 1], ['-50vw', '-20vw', '10vw']);
  const leftY = useTransform(scrollYProgress, [0, 0.5, 1], ['20vh', '0vh', '-20vh']);
  const leftRotate = useTransform(scrollYProgress, [0, 1], [-45, 45]);
  const leftOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], [0, 1, 1, 0]);
  const leftScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 1, 1.2]);

  // Right Ingredient (Mutton) Animation
  const rightX = useTransform(scrollYProgress, [0, 0.5, 1], ['50vw', '25vw', '-5vw']);
  const rightY = useTransform(scrollYProgress, [0, 0.5, 1], ['-20vh', '10vh', '30vh']);
  const rightRotate = useTransform(scrollYProgress, [0, 1], [45, -45]);
  const rightOpacity = useTransform(scrollYProgress, [0.2, 0.4, 0.8, 1], [0, 1, 1, 0]);
  const rightScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1.1, 1.3]);

  // Bottom Ingredient (Paneer) Animation
  const bottomY = useTransform(scrollYProgress, [0, 0.6, 1], ['30vh', '5vh', '-30vh']);
  const bottomOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.8, 1], [0, 1, 1, 0]);
  const bottomScale = useTransform(scrollYProgress, [0, 0.6, 1], [0.7, 1.2, 0.8]);

  // Floating Particles or Text
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.6, 0.7], [0, 1, 1, 0]);
  const textScale = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.8, 1, 1.1]);
  const textY = useTransform(scrollYProgress, [0.3, 0.7], ['10vh', '-5vh']);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none w-full h-full overflow-hidden flex items-center justify-center">

        {/* Text Element */}
        <motion.div
          className="absolute z-30 text-center pointer-events-none"
          style={{ opacity: textOpacity, scale: textScale, y: textY }}
        >
          <h2 className="text-4xl md:text-6xl font-display font-extrabold text-gold-gradient drop-shadow-2xl mb-4 tracking-wider">
            Symphony of Spices
          </h2>
          <p className="text-primary-light/80 text-lg md:text-xl font-sans tracking-wide max-w-lg mx-auto">
            Experience the authentic aroma and rich flavors crafted perfectly for you.
          </p>
        </motion.div>

        {/* Left Floating Element (Chicken 65) */}
        <motion.div
          className="absolute z-10 w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          style={{
            x: leftX,
            y: leftY,
            rotate: leftRotate,
            opacity: leftOpacity,
            scale: leftScale,
          }}
        >
          <Image
            src="/image/chicken65.jpg"
            alt="Chicken 65"
            fill
            className="object-cover"
          />
        </motion.div>

        {/* Right Floating Element (Mutton) */}
        <motion.div
          className="absolute z-10 w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-2 border-primary/20 shadow-[0_0_40px_rgba(212,175,55,0.15)]"
          style={{
            x: rightX,
            y: rightY,
            rotate: rightRotate,
            opacity: rightOpacity,
            scale: rightScale,
          }}
        >
          <Image
            src="/image/mutton.jpg"
            alt="Mutton"
            fill
            className="object-cover"
          />
        </motion.div>

        {/* Bottom Floating Element (Paneer) */}
        <motion.div
          className="absolute z-10 w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border border-primary/40 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
          style={{
            y: bottomY,
            opacity: bottomOpacity,
            scale: bottomScale,
          }}
        >
          <Image
            src="/image/paneer.jpg"
            alt="Paneer"
            fill
            className="object-cover"
          />
        </motion.div>

        {/* Center Main Element (Biryani) */}
        <motion.div
          className="relative z-20 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full overflow-hidden border-4 border-primary/50 shadow-[0_0_60px_rgba(212,175,55,0.4)]"
          style={{
            scale: centerScale,
            opacity: centerOpacity,
            rotate: centerRotate,
          }}
        >
          <Image
            src="/image/biryani.jpg"
            alt="Signature Biryani"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] pointer-events-none" />
        </motion.div>
        
      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(10,10,10,0.9)_100%)]" />
    </div>
  );
}
