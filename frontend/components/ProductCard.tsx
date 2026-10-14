
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Truck, Check, ChevronLeft, ChevronRight, X, Maximize2, AlertTriangle, ShieldCheck, Plus, Minus, Ruler, Info, ImageOff } from 'lucide-react';
import { formatPrice } from '../utils/format';
import type { Product, CartItem } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (item: CartItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  
  // Accordion State
  const [expandedSection, setExpandedSection] = useState<string | null>('description');
  
  // Lightbox & Modal States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Swipe State
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fallback si la galería está vacía o el nombre está vacío (estado inicial)
  const hasData = product.name !== "" && product.price > 0;
  
  const galleryImages = product.gallery && product.gallery.length > 0 
    ? product.gallery 
    : product.image ? [product.image] : [];

  // STOCK LOGIC
  const getStockForSize = (size: string) => {
      if (product.variants && typeof product.variants[size] === 'number') {
          return product.variants[size];
      }
      return 0; // Si no hay info, asumimos 0
  };

  const currentSizeStock = selectedSize ? getStockForSize(selectedSize) : 0;
  const isGlobalOutOfStock = hasData && product.stock <= 0;
  const maxQty = Math.max(1, Math.min(10, currentSizeStock || 10));

  useEffect(() => setQuantity((q) => Math.min(q, maxQty)), [maxQty]);

  // Barra de compra fija en movil cuando el boton principal sale de pantalla.
  useEffect(() => {
    const node = buyButtonRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // --- NAVIGATION LOGIC ---
  const nextImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation?.();
    if (galleryImages.length > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  }, [galleryImages.length]);

  const prevImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation?.();
    if (galleryImages.length > 0) {
        setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    }
  }, [galleryImages.length]);

  // KEYBOARD NAVIGATION (solo con el visor abierto)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage(e);
      if (e.key === 'ArrowLeft') prevImage(e);
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, nextImage, prevImage]);

  // SWIPE LOGIC
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleAddToCart = () => {
    if (isGlobalOutOfStock) return;

    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 600);
      return;
    }

    if (currentSizeStock <= 0) {
        alert("Lo sentimos, esta talla se acaba de agotar.");
        return;
    }

    const variantId = product.variantIds?.[selectedSize];
    const variantSku = product.variantSkus?.[selectedSize];
    if (!variantId && !variantSku) {
        alert("No se encontró la variante para la talla seleccionada.");
        return;
    }

    setIsAdding(true);

    setTimeout(() => {
      onAddToCart({
        ...product,
        cartId: `${product.id}-${selectedSize}`, 
        selectedColor: product.colors[0] || 'Unico', 
        selectedSize,
        quantity,
        idVariante: variantId,
        sku: variantSku || product.id
      });
      
      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 3000);
    }, 500);
  };

  const toggleSection = (section: string) => {
      setExpandedSection(expandedSection === section ? null : section);
  };

  const openLightbox = (index: number) => {
    if (galleryImages.length === 0) return;
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-12 animate-fade-in pt-0">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: IMAGES */}
          <div className="w-full lg:w-[60%] flex flex-col-reverse lg:flex-row gap-2 lg:sticky lg:top-24 select-none">
             
             {/* Thumbnails Strip */}
             {galleryImages.length > 0 && (
                 <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto w-full lg:w-20 shrink-0 no-scrollbar pb-2 lg:pb-0 lg:max-h-[600px]">
                    {galleryImages.map((img, idx) => (
                      <button 
                        key={idx} 
                        className={`relative w-20 h-20 aspect-square bg-zinc-900 rounded-sm overflow-hidden flex-shrink-0 transition-all duration-300 group ${
                            currentImageIndex === idx 
                            ? 'ring-1 ring-white opacity-100' 
                            : 'opacity-50 hover:opacity-100'
                        }`}
                        onMouseEnter={() => setCurrentImageIndex(idx)}
                        onClick={() => setCurrentImageIndex(idx)}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                 </div>
             )}

             {/* Main Image View */}
             <div 
                className="flex-1 aspect-[4/5] lg:h-[700px] bg-zinc-900 rounded-sm overflow-hidden relative group cursor-zoom-in flex items-center justify-center touch-pan-y"
                onClick={() => openLightbox(currentImageIndex)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
             >
                {galleryImages.length > 0 ? (
                    <img 
                      src={galleryImages[currentImageIndex]} 
                      alt={`${product.name} Main View`}
                      className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${isGlobalOutOfStock ? 'grayscale' : ''}`}
                      draggable="false"
                    />
                ) : (
                    <div className="flex flex-col items-center text-zinc-700">
                        <ImageOff size={48} className="mb-2" />
                        <span className="text-xs uppercase tracking-widest font-bold">Esperando Imágenes...</span>
                    </div>
                )}
                
                {isGlobalOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="border-2 border-white px-6 py-2 text-2xl font-black text-white uppercase tracking-widest -rotate-12">
                      Sold Out
                    </span>
                  </div>
                )}
                
                {/* Navigation Arrows (Desktop Hover) */}
                {galleryImages.length > 1 && (
                    <>
                        <button 
                            onClick={(e) => prevImage(e)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm hidden lg:block"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={(e) => nextImage(e)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm hidden lg:block"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                {/* Mobile Dots Indicator */}
                {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                        {galleryImages.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/40'}`} 
                            />
                        ))}
                    </div>
                )}
                
                {galleryImages.length > 0 && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full text-white backdrop-blur-sm pointer-events-none hidden lg:block">
                        <Maximize2 size={20} />
                    </div>
                )}
             </div>
          </div>

          {/* RIGHT COLUMN: INFO (Sticky) */}
          <div className="w-full lg:w-[40%] relative">
            <div className="sticky top-24 flex flex-col gap-8">
              
              {/* 1. Header Info Section */}
              <div className="border-b border-white/10 pb-6">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                     {product.category}
                   </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-serif font-black text-white uppercase tracking-tighter leading-[0.9] mb-4 min-h-[3rem]">
                  {product.name || <span className="animate-pulse bg-zinc-800 text-transparent rounded">CARGANDO...</span>}
                </h1>
                
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-mono text-white font-medium">
                    {hasData ? formatPrice(product.price) : '$0'}
                  </span>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300 font-mono">
                    MXN
                  </span>
                </div>
                
                {currentSizeStock < 5 && currentSizeStock > 0 && (
                    <div className="mt-4 text-[10px] text-red-500 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1">
                      <AlertTriangle size={12} />
                      ¡Stock Bajo: Solo quedan {currentSizeStock}!
                    </div>
                )}
              </div>

              {/* 2. Selection Section */}
              <div className="space-y-6">
                 {/* Color */}
                 <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-3">
                      Color Seleccionado: <span className="text-white ml-1">{product.colors[0] || '...'}</span>
                    </span>
                    <div className="flex gap-3">
                        {product.colors.length > 0 ? product.colors.map(color => (
                            <button key={color} className="w-10 h-10 rounded-full bg-zinc-900 border border-white ring-1 ring-white ring-offset-2 ring-offset-black transition-transform hover:scale-110"></button>
                        )) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 animate-pulse"></div>
                        )}
                    </div>
                 </div>

                 {/* Size */}
                 <div>
                    <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${sizeError ? 'text-red-500' : 'text-gray-500'}`}>
                            {sizeError ? 'Selecciona una talla' : 'Talla'}
                        </span>
                        <button 
                            onClick={() => setIsSizeGuideOpen(true)}
                            className="text-[10px] underline text-gray-500 hover:text-white uppercase tracking-wider flex items-center gap-1"
                        >
                            <Ruler size={12} /> Guía de Tallas
                        </button>
                    </div>
                    
                    {/* TALLAS GRID */}
                    <div className={`grid grid-cols-4 gap-2 ${sizeError ? 'animate-shake' : ''}`}>
                      {product.sizes.length > 0 ? product.sizes.map(size => {
                        const isSizeStockout = getStockForSize(size) <= 0;
                        return (
                            <button
                            key={size}
                            onClick={() => {
                                if (!isSizeStockout) {
                                // Tocar la talla seleccionada otra vez la deselecciona.
                                setSelectedSize((current) => (current === size ? '' : size));
                                setSizeError(false);
                                }
                            }}
                            aria-pressed={selectedSize === size}
                            disabled={isSizeStockout}
                            className={`h-12 border transition-all duration-200 text-xs font-bold uppercase tracking-wider relative overflow-hidden ${
                                selectedSize === size
                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                : sizeError 
                                    ? 'border-red-500 text-red-500 bg-red-500/10' 
                                    : isSizeStockout
                                    // ESTILO ROJO + CRUZ PARA AGOTADO
                                    ? 'border-red-900/50 bg-red-900/10 text-red-700 cursor-not-allowed'
                                    : 'bg-transparent text-gray-400 border-white/10 hover:border-white hover:text-white'
                            }`}
                            >
                            {size}
                            
                            {/* Cruz Roja Overlay */}
                            {isSizeStockout && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <X className="text-red-600/80 w-full h-full p-2" strokeWidth={1} />
                                </div>
                            )}
                            </button>
                        );
                      }) : (
                          // Skeletons si no hay datos
                          ['S','M','L','XL'].map(s => (
                              <div key={s} className="h-12 border border-zinc-800 bg-zinc-900/50 rounded-sm animate-pulse"></div>
                          ))
                      )}
                    </div>
                 </div>
              </div>

              {/* 3. Action Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cantidad</span>
                  <div className="flex items-center border border-white/10">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
                      aria-label="Quitar uno"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-10 text-center text-sm font-mono text-white" aria-live="polite">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty || isGlobalOutOfStock}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
                      aria-label="Agregar uno"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <button
                  ref={buyButtonRef}
                  onClick={handleAddToCart}
                  disabled={!hasData || isAdding || isGlobalOutOfStock || (selectedSize !== '' && currentSizeStock <= 0)}
                  className={`w-full py-5 font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 relative overflow-hidden group ${
                    !hasData || isGlobalOutOfStock
                      ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
                      : isAdded 
                        ? 'bg-zinc-800 text-white border border-zinc-700' 
                        : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {!hasData ? (
                       <span>ESPERANDO STOCK...</span>
                    ) : isGlobalOutOfStock ? (
                       <span>AGOTADO</span>
                    ) : isAdding ? (
                       <span className="animate-pulse">Procesando...</span>
                    ) : isAdded ? (
                       <>
                         <Check size={18} /> AÑADIDO A LA BOLSA
                       </>
                    ) : (
                       <>AGREGAR AL CARRITO</>
                    )}
                  </div>
                </button>
                
                {/* Benefits */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex flex-col items-center justify-center gap-2 p-4 border border-white/5 bg-zinc-900/30 rounded-sm text-center">
                        <Truck size={16} className="text-gray-400" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Envío Gratis</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 p-4 border border-white/5 bg-zinc-900/30 rounded-sm text-center">
                        <ShieldCheck size={16} className="text-gray-400" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Pago Seguro</span>
                    </div>
                </div>
              </div>

              {/* 4. Details Sections (Accordion) - STATIC */}
              <div className="border-t border-white/10 mt-4">
                
                {/* Description */}
                <div className="border-b border-white/10">
                    <button 
                        onClick={() => toggleSection('description')}
                        className="w-full flex items-center justify-between py-4 text-xs font-bold uppercase tracking-widest hover:text-gray-300 transition-colors"
                    >
                        <span>Descripción</span>
                        {expandedSection === 'description' ? <Minus size={14} /> : <Plus size={14} />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSection === 'description' ? 'max-h-48 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                        <p className="text-gray-400 text-xs leading-relaxed font-mono">
                            {product.description || "Información del producto pendiente de carga..."}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="border-b border-white/10">
                    <button 
                        onClick={() => toggleSection('details')}
                        className="w-full flex items-center justify-between py-4 text-xs font-bold uppercase tracking-widest hover:text-gray-300 transition-colors"
                    >
                        <span>Especificaciones</span>
                        {expandedSection === 'details' ? <Minus size={14} /> : <Plus size={14} />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSection === 'details' ? 'max-h-64 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-3">
                           {product.details && Object.entries(product.details).map(([key, value]) => (
                             <div key={key} className="flex justify-between items-start text-xs gap-4">
                               <span className="uppercase tracking-widest text-gray-500 shrink-0">{key}</span>
                               <span className="text-white font-mono text-right">{value}</span>
                             </div>
                           ))}
                        </div>
                    </div>
                </div>

                {/* Envios */}
                <div className="border-b border-white/10">
                    <button
                        onClick={() => toggleSection('shipping')}
                        className="w-full flex items-center justify-between py-4 text-xs font-bold uppercase tracking-widest hover:text-gray-300 transition-colors"
                    >
                        <span>Envíos</span>
                        {expandedSection === 'shipping' ? <Minus size={14} /> : <Plus size={14} />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSection === 'shipping' ? 'max-h-48 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                        <p className="text-gray-400 text-xs leading-relaxed font-mono">
                            Envío gratis a todo México. Al confirmarse tu pago recibirás un correo, y otro con tu número de guía cuando el paquete salga.
                        </p>
                    </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE COMPRA FIJA (MOVIL) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 backdrop-blur-md px-4 py-3 transition-transform duration-500 lg:hidden ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!showStickyBar}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-white truncate">{product.name}</p>
            <p className="text-xs font-mono text-gray-400">{formatPrice(product.price)}{selectedSize ? ` · Talla ${selectedSize}` : ''}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!hasData || isAdding || isGlobalOutOfStock}
            tabIndex={showStickyBar ? 0 : -1}
            className={`shrink-0 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] ${isGlobalOutOfStock ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-black'}`}
          >
            {isGlobalOutOfStock ? 'AGOTADO' : isAdded ? 'AÑADIDO' : selectedSize ? 'AGREGAR' : 'ELEGIR TALLA'}
          </button>
        </div>
      </div>

      {/* LIGHTBOX OVERLAY - KEYBOARD ENABLED */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-fade-in" onClick={() => setIsLightboxOpen(false)}>
           <button 
             onClick={() => setIsLightboxOpen(false)}
             className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
           >
             <X size={32} />
           </button>

           <button 
             onClick={(e) => prevImage(e)}
             className="absolute left-4 md:left-8 text-white/50 hover:text-white transition-colors p-4 hover:bg-white/10 rounded-full hidden md:block"
           >
             <ChevronLeft size={40} />
           </button>

           <div 
             className="w-full h-full max-w-5xl max-h-[85vh] p-4 flex items-center justify-center" 
             onClick={(e) => e.stopPropagation()}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
           >
             <img 
               src={galleryImages[currentImageIndex]} 
               alt="Zoom view"
               key={currentImageIndex}
               className="max-w-full max-h-full object-contain shadow-2xl animate-scale-in"
               draggable="false"
             />
           </div>

           <button 
             onClick={(e) => nextImage(e)}
             className="absolute right-4 md:right-8 text-white/50 hover:text-white transition-colors p-4 hover:bg-white/10 rounded-full hidden md:block"
           >
             <ChevronRight size={40} />
           </button>

           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {galleryImages.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/60'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                />
              ))}
           </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSizeGuideOpen(false)}></div>
            <div className="relative bg-zinc-950 border border-white/20 w-full max-w-2xl rounded-xl p-8 shadow-2xl animate-fade-in-up">
                <button 
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif font-black uppercase text-white tracking-tight mb-2">
                        Playera Semi Oversize
                    </h3>
                    <p className="text-xs text-gray-500 font-bold tracking-[0.2em] font-mono">305 grs</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Talla</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Largo</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ancho</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Hombro</th>
                                <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Manga</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 text-sm font-bold text-white font-mono">S</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">70 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">114 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">56.8 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">20 cm</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 text-sm font-bold text-white font-mono">M</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">72 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">119 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">57.8 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">21 cm</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 text-sm font-bold text-white font-mono">L</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">74 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">124 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">58.8 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">22 cm</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 text-sm font-bold text-white font-mono">XL</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">76 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">129 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">60.3 cm</td>
                                <td className="py-4 text-sm text-gray-300 font-mono">23 cm</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex items-start gap-3 bg-white/5 p-4 rounded-lg">
                    <Info size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wide leading-relaxed">
                        NOTA: Medidas tomadas a mano, por favor permita un margen de error de 1-3 cm. El fit es Semi Oversize, recomendamos pedir tu talla habitual para el look deseado.
                    </p>
                </div>
            </div>
        </div>
      )}
      
    </>
  );
};

export default ProductCard;
