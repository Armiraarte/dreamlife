import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Instagram } from 'lucide-react';
import { APP_IMAGES } from '../imagenes_url';

type FooterProps = {
  onTrackClick: () => void;
};

const MARQUEE = ['DREAMLIFE GLOBAL CORP', 'ENVIOS A TODO MEXICO', 'EST. 2025', "GOD'S PLAN DROP"];

const Footer: React.FC<FooterProps> = ({ onTrackClick }) => {
  return (
    <footer className="bg-black text-white border-t border-white/10 overflow-hidden relative pb-20">
      <div className="bg-white text-black border-b border-white/10 overflow-hidden flex select-none py-2" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="animate-marquee whitespace-nowrap flex-shrink-0 flex items-center">
            {MARQUEE.map((text) => (
              <React.Fragment key={text}>
                <span className="mx-6 font-bold tracking-widest uppercase text-[10px]">{text}</span>
                <span className="mx-6 font-mono text-[9px]">•</span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>

      <div className="max-w-[1920px] mx-auto p-5 md:p-8 lg:p-16 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
          <div className="max-w-xl w-full">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5 text-gray-500">Mantente Conectado</h4>
            <p className="text-lg font-serif font-bold mb-5 leading-snug">
              Síguenos para lanzamientos exclusivos, eventos privados y actualizaciones de stock.
            </p>
            <a
              href="https://www.instagram.com/dream_lifemx/"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between border-b border-white text-white py-3 text-[10px] font-bold tracking-widest uppercase hover:text-gray-300 transition-colors"
            >
              Seguir @dream_lifemx en Instagram
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </a>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="https://www.instagram.com/dream_lifemx/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 group hover:border-[#E1306C] hover:shadow-[0_0_20px_rgba(225,48,108,0.4)]"
              >
                <Instagram size={15} className="group-hover:text-[#E1306C] transition-colors" />
              </a>
              <a
                href="https://www.tiktok.com/@dream.lifemx?lang=es-419"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 group hover:border-[#00f2ea] hover:shadow-[0_0_20px_rgba(0,242,234,0.4)]"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:stroke-[#00f2ea] transition-colors group-hover:drop-shadow-[2px_2px_0px_rgba(254,44,85,1)]"
                  aria-hidden="true"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            </div>
          </div>

          <nav aria-label="Ayuda" className="grid grid-cols-2 gap-x-10 gap-y-3 text-[10px] font-bold uppercase tracking-widest">
            <Link to="/shop" className="text-gray-500 hover:text-white transition-colors">God's Plan</Link>
            <button onClick={onTrackClick} className="text-left text-gray-500 hover:text-white transition-colors uppercase">Rastrear Pedido</button>
            <Link to="/about" className="text-gray-500 hover:text-white transition-colors">Nosotros</Link>
            <Link to="/account" className="text-gray-500 hover:text-white transition-colors">Mi Cuenta</Link>
            <Link to="/contact" className="text-gray-500 hover:text-white transition-colors">Contacto</Link>
          </nav>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-white/10 mt-8 pb-8 gap-4 relative">
          <p className="text-[9px] text-white font-mono uppercase tracking-widest z-10 flex gap-1">
            © <Link to="/admin" className="hover:text-gray-300 transition-colors cursor-default">2025</Link> DREAM LIFE
          </p>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[10%] opacity-20 z-0 pointer-events-none w-[63%] select-none">
            <img src={APP_IMAGES.logo} alt="" className="w-full h-auto object-contain" />
          </div>

          <div className="flex items-center gap-8 text-[9px] text-white font-bold uppercase tracking-widest z-10 relative">
            <span className="text-gray-500">Pago seguro con Mercado Pago</span>
          </div>

          <div className="text-[9px] text-white font-mono uppercase tracking-widest flex items-center gap-2 z-10">
            <span>Diseñado en MX</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
