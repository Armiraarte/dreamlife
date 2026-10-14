import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import type { CartItem, Product } from '../types';
import { formatPrice } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onProceedToCheckout: () => void;
  products?: Product[];
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemove,
  onProceedToCheckout,
  products = [],
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Precio y stock vigentes del catalogo (el cobro final lo calcula el servidor).
  const priceOf = (item: CartItem) => products.find((p) => p.id === item.id)?.price ?? item.price;
  const stockOf = (item: CartItem) => products.find((p) => p.id === item.id)?.variants?.[item.selectedSize];
  const total = cartItems.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0);
  const units = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Mientras esta abierto: sin scroll de fondo y cierre con Escape.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu bolsa"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 z-[70] shadow-2xl transform transition-transform duration-500 ease-out-expo flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-black flex items-center justify-between">
          <h2 className="text-xl font-serif font-black uppercase text-white tracking-wider flex items-center gap-2">
            Tu Bolsa <span className="text-zinc-500 text-sm font-sans">({units})</span>
          </h2>
          <button ref={closeRef} onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto relative p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-600">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-mono uppercase tracking-widest text-center">Tu bolsa está vacía.</p>
              <Link
                to="/shop"
                onClick={onClose}
                className="mt-8 border border-white/20 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Explorar Colección
              </Link>
            </div>
          ) : (
            cartItems.map((item, i) => {
              const stock = stockOf(item);
              const atMax = typeof stock === 'number' && item.quantity >= stock;
              return (
                <div
                  key={item.cartId}
                  className="flex gap-4 group animate-fade-in-up"
                  style={{ animationDelay: isOpen ? `${150 + i * 70}ms` : '0ms' }}
                >
                  <Link to={`/product/${item.id}`} onClick={onClose} className="w-24 h-32 bg-zinc-900 overflow-hidden flex-shrink-0 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider leading-tight">{item.name}</h3>
                        <button onClick={() => onRemove(item.cartId)} className="text-zinc-600 hover:text-red-500 transition-colors p-1" aria-label="Eliminar del carrito">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 font-mono uppercase">
                        {item.selectedColor} | {item.selectedSize}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-zinc-800 rounded-sm">
                        <button
                          onClick={() => (item.quantity > 1 ? onUpdateQuantity(item.cartId, -1) : onRemove(item.cartId))}
                          className="p-1 px-2 hover:bg-zinc-800 text-zinc-400 transition-colors"
                          aria-label="Quitar uno"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-mono text-white w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.cartId, 1)}
                          disabled={atMax}
                          className="p-1 px-2 hover:bg-zinc-800 text-zinc-400 transition-colors disabled:opacity-30"
                          aria-label="Agregar uno"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="text-sm font-mono text-white font-medium">{formatPrice(priceOf(item) * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-zinc-950 pb-8">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs text-zinc-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{formatPrice(total)} MXN</span>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-400 uppercase tracking-widest">
                <span>Envío</span>
                <span className="text-white">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-white/5">
              <span className="text-sm font-bold uppercase tracking-widest text-white">Total</span>
              <span className="text-xl font-bold font-serif text-white">{formatPrice(total)}</span>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="group w-full bg-white text-black py-4 font-bold uppercase tracking-[0.2em] text-xs md:text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              PROCEDER AL PAGO <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
