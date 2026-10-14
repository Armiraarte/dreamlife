import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { ShopOutletContext } from '../types';

type Category = 'Playeras' | 'Hoodies';

// Foto que se muestra en el panel izquierdo segun la categoria señalada.
const CATEGORY_PHOTOS: Record<Category, string> = {
  Playeras: '/images/dreamlife2.jpeg',
  Hoodies: '/images/pv2.jpeg',
};

const ShopPage: React.FC = () => {
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>('Playeras');
  const navigate = useNavigate();
  const { products, isLoadingProducts } = useOutletContext<ShopOutletContext>();

  const openTees = () => {
    if (isLoadingProducts) return;
    const firstTee = products.find((p) => p.category === 'Playeras');
    if (firstTee) {
      navigate(`/product/${firstTee.id}`);
    } else {
      alert('La colección se está cargando o está agotada.');
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-screen animate-fade-in pt-20 lg:pt-0">
      <div className="w-full lg:w-1/2 relative bg-zinc-900 overflow-hidden hidden lg:block border-r border-white/5">
        {(Object.keys(CATEGORY_PHOTOS) as Category[]).map((cat) => (
          <img
            key={cat}
            src={CATEGORY_PHOTOS[cat]}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 ease-out ${
              hoveredCategory === cat ? 'opacity-50 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 z-10">
          <h3 key={hoveredCategory} className="text-xl font-mono text-white/50 mb-2 uppercase tracking-widest animate-fade-in">
            {hoveredCategory ? `Colección ${hoveredCategory}` : 'Seleccionar Categoría'}
          </h3>
          <div className="w-12 h-0.5 bg-white/50"></div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col bg-black overflow-y-auto lg:overflow-visible">
        <button
          type="button"
          className="relative flex-1 group overflow-hidden cursor-pointer border-b border-white/10 flex items-center justify-center min-h-[50vh] lg:min-h-0 bg-black hover:bg-zinc-900 transition-colors"
          onMouseEnter={() => setHoveredCategory('Playeras')}
          onFocus={() => setHoveredCategory('Playeras')}
          onClick={openTees}
        >
          <div className="relative z-10 px-8 text-center transition-transform duration-500 group-hover:scale-105">
            <span className="block text-[10px] font-bold tracking-[0.4em] mb-2 text-gray-400 group-hover:text-white transition-colors">
              {isLoadingProducts ? 'CONECTANDO...' : 'COLECCIÓN CENTRAL'}
            </span>
            <h3 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tighter text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-white transition-all">
              Playeras
            </h3>
            <div className="h-0.5 bg-white mt-3 w-0 group-hover:w-full transition-all duration-500 mx-auto"></div>
          </div>
        </button>

        <button
          type="button"
          className="relative flex-1 group overflow-hidden cursor-pointer flex items-center justify-center min-h-[50vh] lg:min-h-0 bg-black hover:bg-zinc-900 transition-colors"
          onMouseEnter={() => setHoveredCategory('Hoodies')}
          onFocus={() => setHoveredCategory('Hoodies')}
          onClick={() => navigate('/shop/hoodies')}
        >
          <div className="relative z-10 px-8 text-center transition-transform duration-500 group-hover:scale-105">
            <div className="flex justify-center items-center gap-4 mb-2">
              <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded uppercase tracking-wider border border-white/10 group-hover:bg-white group-hover:text-black transition-colors">
                PRÓXIMAMENTE
              </span>
            </div>
            <h3 className="text-4xl md:text-6xl font-black font-serif uppercase tracking-tighter text-zinc-500 group-hover:text-white transition-colors">
              Hoodies
            </h3>
            <div className="h-0.5 bg-zinc-500 mt-3 w-0 group-hover:w-full transition-all duration-500 mx-auto"></div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ShopPage;
