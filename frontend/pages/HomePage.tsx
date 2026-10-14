import React from 'react';
import { Truck, ShieldCheck, Package } from 'lucide-react';
import Hero from '../components/Hero';
import Reveal from '../components/ui/Reveal';

const BENEFITS = [
  { icon: Truck, title: 'ENVÍO GRATIS', text: 'A todo México en cada pedido.' },
  { icon: ShieldCheck, title: 'PAGO SEGURO', text: 'Tarjeta, OXXO y más con Mercado Pago.' },
  { icon: Package, title: 'RASTREO', text: 'Sigue tu pedido con tu número de guía.' },
];

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />

      {/* Beneficios */}
      <section id="mas" className="bg-black py-20 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
          {BENEFITS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 100} className="flex flex-col items-center group">
              <div className="p-4 rounded-full bg-zinc-900 text-white mb-6 group-hover:bg-white group-hover:text-black transition-colors duration-300">
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-3">{title}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
