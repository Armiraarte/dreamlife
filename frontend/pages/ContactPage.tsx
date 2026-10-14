import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Instagram, Package } from 'lucide-react';
import Reveal from '../components/ui/Reveal';
import VideoBackground from '../components/VideoBackground';
import { APP_IMAGES } from '../imagenes_url';

const TikTokIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const CHANNELS = [
  { icon: <Instagram size={24} />, title: 'INSTAGRAM', handle: '@dream_lifemx', text: 'Dudas de tallas, pedidos y colaboraciones.', href: 'https://www.instagram.com/dream_lifemx/' },
  { icon: <TikTokIcon />, title: 'TIKTOK', handle: '@dream.lifemx', text: 'Lanzamientos y detrás de cámaras.', href: 'https://www.tiktok.com/@dream.lifemx?lang=es-419' },
];

const ContactPage: React.FC = () => (
  <div className="relative min-h-screen pt-32 pb-20 px-6 animate-fade-in">
    <VideoBackground
      src={APP_IMAGES.productVideo}
      poster={APP_IMAGES.productVideoPoster}
      textShade="bg-black/30"
    />
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-20 animate-slide-up">
        <span className="text-xs font-bold tracking-[0.4em] text-gray-500 uppercase mb-4 block">Contacto</span>
        <h1 className="text-6xl md:text-8xl font-serif font-black text-white mb-8 tracking-tighter uppercase">Hablemos</h1>
        <div className="w-24 h-1 bg-white mx-auto"></div>
        <p className="mt-8 font-mono text-xs text-gray-400 uppercase tracking-widest leading-relaxed">
          La forma más rápida de contactarnos es por redes sociales.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CHANNELS.map((c, i) => (
          <Reveal key={c.title} delay={i * 120}>
            <a
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col justify-between border border-white/10 bg-zinc-950/80 backdrop-blur-sm p-8 md:p-10 transition-all duration-300 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]"
            >
              <div className="flex items-start justify-between text-white">
                {c.icon}
                <ArrowUpRight size={20} className="text-gray-500 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <div className="mt-16">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">{c.title}</p>
                <p className="mt-2 text-3xl font-serif font-black text-white tracking-tighter">{c.handle}</p>
                <p className="mt-3 text-xs font-mono uppercase tracking-widest text-gray-500">{c.text}</p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <Link
          to="/track-order"
          className="group mt-4 flex items-center justify-between gap-6 border border-white/10 bg-zinc-950/80 backdrop-blur-sm p-8 md:p-10 transition-all duration-300 hover:border-white/40"
        >
          <div className="flex items-center gap-5">
            <Package size={24} className="shrink-0 text-white" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-white">¿Ya hiciste un pedido?</p>
              <p className="mt-1 text-xs font-mono text-gray-500 uppercase tracking-wide">Rastréalo con tu número de guía.</p>
            </div>
          </div>
          <ArrowUpRight size={20} className="shrink-0 text-gray-500 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
        </Link>
      </Reveal>
    </div>
  </div>
);

export default ContactPage;
