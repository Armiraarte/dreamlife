
import React, { useState } from 'react';
import { X, Search, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose }) => {
  const [orderId, setOrderId] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    // Navegar a la página de rastreo con el ID como parámetro
    navigate(`/track-order?id=${encodeURIComponent(orderId.trim())}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-zinc-950 border border-white/10 w-full max-w-md p-8 rounded-2xl shadow-2xl animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Package size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">Rastreo Rápido</h2>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-2">
                Ubica tu paquete en tiempo real
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                    type="text" 
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="ID DE PEDIDO (EJ: ORD-9921)"
                    className="w-full bg-black border border-white/20 rounded-lg py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono uppercase text-center placeholder-zinc-700"
                    autoFocus
                />
            </div>
            
            <button 
                type="submit"
                disabled={!orderId.trim()}
                className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Buscar Pedido <ArrowRight size={14} />
            </button>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-4">
            <p className="text-[10px] text-zinc-600">
                ¿No encuentras tu ID? Revisa tu correo de confirmación.
            </p>
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;
