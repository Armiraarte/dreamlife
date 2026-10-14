import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Lock } from 'lucide-react';

const HoodiesPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center pt-20 bg-zinc-950">
    <div className="text-center animate-fade-in flex flex-col items-center p-12 border border-white/5 bg-black/50 rounded-2xl backdrop-blur-sm max-w-2xl m-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full"></div>
        <Lock size={64} className="text-white relative z-10" />
      </div>
      <h3 className="text-4xl md:text-6xl font-serif font-black uppercase tracking-tighter mb-4 text-white">
        Acceso<br />Restringido
      </h3>
      <p className="font-mono text-xs text-gray-400 max-w-xs leading-relaxed tracking-widest uppercase mb-8">
        La colección de Hoodies está actualmente en producción. Síguenos en Instagram para enterarte primero del lanzamiento.
      </p>
      <div className="border border-white/20 px-6 py-3 rounded-full flex items-center gap-2 text-xs font-bold tracking-widest text-gray-300">
        <Clock size={14} />
        <span>DROP CONFIDENCIAL</span>
      </div>
      <a
        href="https://www.instagram.com/dream_lifemx/"
        target="_blank"
        rel="noreferrer"
        className="mt-8 bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
      >
        Seguir @dream_lifemx
      </a>
      <Link to="/shop" className="mt-6 text-xs underline text-gray-500 hover:text-white uppercase tracking-widest">
        Volver
      </Link>
    </div>
  </div>
);

export default HoodiesPage;
