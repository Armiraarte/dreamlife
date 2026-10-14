import React, { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_IMAGES } from '../imagenes_url';

// Cada palabra es un cubo con 4 caras que alternan sus dos textos (giro continuo).
const WORD_CUBES: { words: [string, string]; delay: number }[] = [
  { words: ["GOD'S", 'DREAM'], delay: 0 },
  { words: ['PLAN', 'LIFE'], delay: 350 },
];

const gradientText =
  'text-transparent bg-clip-text bg-gradient-to-b';

/** Una palabra que gira como cubo (estilos .text-cube en index.html). */
const WordCube: React.FC<{ words: [string, string]; delay: number; gradient: string }> = ({ words, delay, gradient }) => (
  <span className="text-cube block w-full">
    <span className="text-cube__inner block" style={{ animationDelay: `${delay}ms` }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="text-cube__face" style={{ animationDelay: `${delay}ms` }}>
          <span className={`text-cube__word ${gradientText} ${gradient}`}>{words[i % 2]}</span>
        </span>
      ))}
    </span>
  </span>
);

const Hero: React.FC = () => {
  const [hasVideo, setHasVideo] = useState(true);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background clean container */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-zinc-900"></div>
      </div>

      {/* Video en flashazos (si existe public/videos/hero.mp4) */}
      {hasVideo && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <video
            className="hero-flash-video absolute inset-0 w-full h-full object-cover grayscale contrast-125"
            src={APP_IMAGES.heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setHasVideo(false)}
          />
          <div className="hero-flash-white absolute inset-0 bg-white mix-blend-overlay" />
          {/* Viñeta para que el titular siempre se lea */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.85)_75%)]" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
        <span className="inline-block border border-white/30 px-4 py-2 rounded-full text-xs font-bold tracking-[0.3em] text-gray-300 mb-8 animate-fade-in backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          DROP EXCLUSIVO POR DREAMLIFE
        </span>

        {/* GOD'S PLAN <-> DREAM LIFE, palabra por palabra */}
        <h1 className="w-full mb-12 animate-slide-up text-8xl md:text-[11rem] lg:text-[13rem] font-serif font-black leading-[0.8] tracking-tighter">
          <span className="sr-only">GOD'S PLAN — DREAM LIFE</span>
          {/* El brillo va aqui, fuera del recorte de cada palabra, para que siga la forma de las letras */}
          <span aria-hidden="true" className="block drop-shadow-[0_0_35px_rgba(255,255,255,0.3)]">
            <WordCube words={WORD_CUBES[0].words} delay={WORD_CUBES[0].delay} gradient="from-white to-gray-200" />
            <WordCube words={WORD_CUBES[1].words} delay={WORD_CUBES[1].delay} gradient="from-gray-200 to-gray-500" />
          </span>
        </h1>

        <Link
          to="/shop"
          className="group bg-white text-black px-10 py-4 font-bold tracking-widest uppercase hover:bg-gray-200 transition-all animate-slide-up inline-block shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          style={{ animationDelay: '400ms' }}
        >
          Ver Colección
        </Link>
      </div>

      <button
        onClick={() => document.getElementById('mas')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50 hover:text-white transition-colors p-2 z-10"
        aria-label="Ver más"
      >
        <ArrowDown size={24} />
      </button>
    </section>
  );
};

export default Hero;
