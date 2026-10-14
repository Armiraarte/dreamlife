import React from 'react';
import { Target, Heart, Zap } from 'lucide-react';
import { APP_IMAGES } from '../imagenes_url';
import Reveal from '../components/ui/Reveal';
import VideoBackground from '../components/VideoBackground';

const VALUES = [
  { icon: Target, title: 'CALIDAD', text: 'Algodón Heavyweight. Costuras reforzadas. Hecho para durar en las calles y en la historia.', border: '' },
  { icon: Zap, title: 'VISIÓN', text: 'Crear piezas atemporales que sobrevivan a las tendencias pasajeras. El estilo es eterno.', border: 'border-t md:border-t-0 md:border-l md:border-r border-white/10 pt-12 md:pt-0' },
  { icon: Heart, title: 'FAMILIA', text: 'Un club global de soñadores y hacedores. Cuando usas Dreamlife, no estás solo.', border: 'border-t md:border-t-0 border-white/10 pt-12 md:pt-0' },
];

const AboutPage: React.FC = () => (
  <div className="relative min-h-screen pt-32 pb-20 px-6 animate-fade-in">
    <VideoBackground src={APP_IMAGES.aboutVideo} poster={APP_IMAGES.aboutVideoPoster} textShade="bg-black/30" />
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-20 animate-slide-up">
        <span className="text-xs font-bold tracking-[0.4em] text-gray-500 uppercase mb-4 block">Est. 2025</span>
        <h1 className="text-6xl md:text-8xl font-serif font-black text-white mb-8 tracking-tighter">THE DREAM</h1>
        <div className="w-24 h-1 bg-white mx-auto"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
        <Reveal className="relative group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <img
            src={APP_IMAGES.about}
            alt="Concepto DREAMLIFE"
            className="w-full grayscale opacity-80 hover:opacity-100 transition-opacity duration-700 rounded-sm shadow-2xl"
          />
        </Reveal>
        <Reveal delay={150} className="space-y-8">
          <h2 className="text-3xl font-bold uppercase tracking-widest text-white leading-tight">
            Más que moda,<br />un propósito.
          </h2>
          <p className="text-gray-400 leading-relaxed font-mono text-xs md:text-sm tracking-wide">
            DREAM LIFE representa esa vida soñada que no se compra, se conquista y se crea.
            No con lujo vacío, sino con propósito, disciplina y fe.
            <br /><br />
            La mano no solo intenta alcanzar la corona: es todo lo que uno ha recorrido y sacrificado para llegar al límite de lo esperado.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center border-t border-white/10 pt-16">
        {VALUES.map(({ icon: Icon, title, text, border }, i) => (
          <Reveal key={title} delay={i * 120} className={`flex flex-col items-center group ${border}`}>
            <div className="p-4 rounded-full bg-zinc-900 text-white mb-6 group-hover:bg-white group-hover:text-black transition-colors duration-300">
              <Icon size={24} />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-4">{title}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">{text}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-32 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 text-9xl font-serif text-white/5 font-black opacity-50 select-none">"</div>
        <p className="text-2xl md:text-4xl font-serif italic text-white/90 relative z-10">Trust the process. Own the dream.</p>
        <p className="mt-6 text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">© Dreamlife Global Corp</p>
      </Reveal>
    </div>
  </div>
);

export default AboutPage;
