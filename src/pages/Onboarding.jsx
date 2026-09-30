import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SunMedium, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import solisFacilityImg from '../assets/images/solis-facility.jpg';
import solarMinimalImg from '../assets/images/solar-minimal.jpg';

const SLIDES = [
  {
    id: 1,
    tag: '01 / 02',
    category: 'Clean Energy Trading',
    title: 'Trade solar power across local microgrids.',
    description:
      'Connect your solar panels directly to regional nodes. Reserve generation slots and share clean renewable energy with full transparency.',
    image: solisFacilityImg,
    alt: 'Modern solar microgrid facility at dusk',
  },
  {
    id: 2,
    tag: '02 / 02',
    category: 'Instant QR Dispatch',
    title: 'Seamless verification and zero-touch dispatch.',
    description:
      'Clear your scheduled reservations in real time. Validate energy injection seamlessly at microgrid substations with secure QR dispatch passes.',
    image: solarMinimalImg,
    alt: 'High-efficiency monocrystalline solar panels in sunlight',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to reservations if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/reservations', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentSlide < SLIDES.length - 1) {
        setCurrentSlide((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <div className="operations-shell min-h-screen flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Background Image with Smooth Cross-Fade */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover object-center"
            />
            {/* Elegant Minimal Dark Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d0b] via-[#0b0d0b]/70 to-[#0b0d0b]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d0b]/85 via-[#0b0d0b]/40 to-[#0b0d0b]/70" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top Minimal Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6">
        <Link to="/" className="inline-flex items-center gap-3 text-[#f0f0e8] no-underline">
          <div className="w-9 h-9 rounded-lg bg-[#111410]/80 backdrop-blur-md border border-[#2a2f27] flex items-center justify-center text-[#e9f85b]">
            <SunMedium className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-wide">Solis microgrid</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs font-semibold text-[#92988d] hover:text-[#f0f0e8] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all no-underline"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Center / Bottom Main Content Area */}
      <main className="relative z-10 px-6 sm:px-12 lg:px-20 py-12 max-w-3xl my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-4"
          >
            {/* Minimal Tag */}
            <div className="inline-flex items-center gap-2.5 text-xs text-[#92988d]">
              <span className="px-2 py-0.5 rounded border border-[#2a2f27] font-mono text-[#e9f85b] text-[11px]">
                {slide.tag}
              </span>
              <span className="text-xs font-normal tracking-wide text-[#b1b5ac]">
                {slide.category}
              </span>
            </div>

            {/* Display Headline matching Reservation Screen editorial style */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light text-[#f0f0e8] tracking-[-0.04em] leading-[1.06]">
              {slide.id === 1 ? (
                <>
                  Trade solar power across <br className="hidden sm:inline" />
                  <em className="text-[#e9f85b] font-normal italic font-serif">local microgrids.</em>
                </>
              ) : (
                <>
                  Seamless verification &amp; <br className="hidden sm:inline" />
                  <em className="text-[#e9f85b] font-normal italic font-serif">zero-touch dispatch.</em>
                </>
              )}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#92988d] font-light leading-relaxed max-w-xl pt-2">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Minimal Control Bar */}
        <div className="flex flex-wrap items-center gap-6 pt-10">
          {/* Step Indicator Dots */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-8 bg-[#e9f85b]' : 'w-2 bg-[#41483b] hover:bg-[#92988d]'
                }`}
              />
            ))}
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-3">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="w-10 h-10 rounded-xl bg-[#111410]/80 backdrop-blur-md border border-[#2a2f27] hover:border-[#41483b] text-[#f0f0e8] flex items-center justify-center transition-all cursor-pointer"
                aria-label="Previous slide"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentSlide < SLIDES.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="px-6 py-3 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#e9f85b]/10"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl text-xs font-medium text-[#0b0d0b] bg-[#e9f85b] hover:bg-[#d6e44b] transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#e9f85b]/10 no-underline"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Minimal Footer */}
      <footer className="relative z-10 px-6 sm:px-12 py-6 flex items-center justify-between text-xs text-[#666c63]">
        <span>Solis Microgrid</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-[#92988d] hover:text-[#f0f0e8] transition-colors no-underline">
            Console sign in
          </Link>
          <Link to="/register" className="text-[#92988d] hover:text-[#f0f0e8] transition-colors no-underline">
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
