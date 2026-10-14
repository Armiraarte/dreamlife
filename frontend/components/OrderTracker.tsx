
import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, MapPin, Calendar, ArrowRight, Loader2, AlertCircle, ShoppingBag, Truck, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { PRODUCTS } from '../constants';
import { APP_IMAGES } from '../imagenes_url';
import { useSearchParams } from 'react-router-dom';
import { fetchOrderByTracking } from '../services/backend';

const OrderTracker: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchId, setSearchId] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const hasAutoSearched = useRef(false);

    // AUTO-SEARCH SI VIENE ID EN URL
    useEffect(() => {
        const urlId = searchParams.get('id');
        if (urlId && !hasAutoSearched.current) {
            setSearchId(urlId);
            executeSearch(urlId);
            hasAutoSearched.current = true;
        }
    }, [searchParams]);

    const executeSearch = async (id: string) => {
        if (!id.trim()) return;

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const cleanId = id.trim();
            const result = await fetchOrderByTracking(cleanId);

            if (result) {
                setOrder(result);
            } else {
                setError("Guia no encontrada. Verifica el numero e intenta de nuevo.");
            }
        } catch (err) {
            setError("Error al conectar con el servidor de rastreo.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(searchId);
    };

    const getProductImage = (productName: string, image?: string) => {
        if (image) return image;
        // Busca primero en constantes, si no, usa placeholder
        const found = PRODUCTS.find(p => p.name === productName);
        return found ? found.image : APP_IMAGES.placeholderProduct;
    };

    // Timeline Helper
    const getProgressStep = (status: OrderStatus) => {
        switch (status) {
            case 'Pendiente': return 1;
            case 'Pagado': return 2;
            case 'Procesando': return 2; // Procesando y Pagado en paso 2 visual
            case 'Enviado': return 3;
            case 'Entregado': return 4;
            case 'Cancelado': return 0;
            default: return 1;
        }
    };

    const currentStep = order ? getProgressStep(order.status) : 0;
    const isDelivered = order?.status === 'Entregado';

    const steps = [
        { label: 'Confirmado', icon: Package },
        { label: 'En Proceso', icon: Loader2 },
        { label: 'En Ruta', icon: Truck },
        { label: 'Entregado', icon: CheckCircle }
    ];

    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-4 flex flex-col items-center">
            
            <div className="max-w-3xl w-full">
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="inline-block border border-white/20 px-4 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] text-zinc-400 mb-6 uppercase">
                        Logística Global
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif font-black text-white uppercase tracking-tighter mb-4">
                        Rastrear Envío
                    </h1>
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                        Ingresa tu número de guía (Tracking ID) para localizar tu paquete en tiempo real.
                    </p>
                </div>

                {/* SEARCH FORM */}
                <form onSubmit={handleSearch} className="relative mb-12 animate-fade-in-up max-w-xl mx-auto">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-gray-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <input 
                            type="text" 
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            placeholder="EJ: MX-8821-GL..."
                            className="relative w-full bg-black border border-white/20 text-white px-6 py-5 rounded-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-center font-mono uppercase tracking-widest placeholder-zinc-700 text-sm"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading || !searchId}
                        className="absolute right-2 top-2 bottom-2 bg-white text-black px-6 rounded-md font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wide animate-fade-in mb-8 justify-center">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {order && (
                    <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden animate-fade-in-up shadow-2xl relative">
                        
                        {/* Status Bar Top */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out ${isDelivered ? 'bg-green-500' : 'bg-white'}`}
                                style={{ width: `${(currentStep / 4) * 100}%` }}
                            ></div>
                        </div>

                        {/* HEADER - ESTATUS ESPECIAL ENTREGADO */}
                        {isDelivered ? (
                            <div className="p-8 bg-green-900/10 border-b border-green-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                <div className="z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-bounce">
                                        <CheckCircle size={32} className="text-black" />
                                    </div>
                                    <h2 className="text-2xl font-serif font-black text-green-400 uppercase tracking-tight mb-2">Misión Completada</h2>
                                    <p className="text-[10px] text-green-200/70 font-mono uppercase tracking-widest">
                                        Paquete entregado el {new Date().toLocaleDateString('es-MX', {weekday: 'long', day: 'numeric'})}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 md:p-8 border-b border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Guía</p>
                                        <span className="px-2 py-0.5 bg-white text-black text-[9px] font-bold rounded-full uppercase tracking-widest">
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xl md:text-2xl text-white font-mono font-bold tracking-tight">{order.orderNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Estimado</p>
                                    <p className="text-white font-mono font-bold text-sm">
                                        Llegada: {new Date(new Date(order.date).getTime() + 86400000 * 3).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* PROGRESS TIMELINE */}
                        <div className="p-8 border-b border-white/10 bg-zinc-900/30 overflow-x-auto">
                            <div className="flex items-center justify-between min-w-[300px] relative">
                                {/* Connecting Line */}
                                <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-800 -z-0"></div>
                                
                                {steps.map((step, idx) => {
                                    const stepNum = idx + 1;
                                    const isActive = stepNum <= currentStep;
                                    const isCurrent = stepNum === currentStep;
                                    const Icon = step.icon;

                                    return (
                                        <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                                isActive 
                                                    ? isDelivered 
                                                        ? 'bg-green-500 border-green-500 text-black' 
                                                        : 'bg-white border-white text-black' 
                                                    : 'bg-black border-zinc-800 text-zinc-600'
                                            }`}>
                                                <Icon size={16} className={isCurrent && !isDelivered ? 'animate-pulse' : ''} />
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? (isDelivered ? 'text-green-400' : 'text-white') : 'text-zinc-600'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            
                            {/* SHIPPING INFO & CARRIER */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
                                        <MapPin size={12} /> Destino
                                    </h5>
                                    <div className="space-y-1">
                                        <p className="text-sm text-white font-bold">{order.customer}</p>
                                        <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-xs">
                                            {order.address}
                                        </p>
                                    </div>
                                    {order.phone && (
                                        <p className="text-xs text-zinc-500 font-mono">Tel: {order.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                     <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Truck size={12} /> Datos de Paquetería
                                    </h5>
                                    {(order.status === 'Enviado' || order.status === 'Entregado') ? (
                                        <div className={`border rounded-lg p-4 ${isDelivered ? 'bg-green-900/10 border-green-500/20' : 'bg-white/5 border-white/5'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-white font-bold">DHL Express</span>
                                                <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${isDelivered ? 'bg-green-500 text-black' : 'bg-white text-black'}`}>
                                                    {isDelivered ? 'Entregado' : 'En Tránsito'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Guía Oficial</p>
                                            <p className="font-mono text-sm text-white tracking-wide">MX-88219002</p>
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 p-4">
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                                <Clock size={12} /> Esperando recolección
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ITEMS */}
                            <div className="pt-8 border-t border-white/10">
                                <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShoppingBag size={12} /> Contenido
                                </h5>
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center bg-zinc-900/30 p-2 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                            <div className="w-12 h-14 bg-zinc-900 rounded border border-white/10 overflow-hidden flex-shrink-0">
                                                <img src={getProductImage(item.title, item.image)} alt="" className="w-full h-full object-cover opacity-80" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-white uppercase tracking-wide">{item.title}</h4>
                                                <div className="flex gap-3 mt-1 text-[10px] text-zinc-500 font-mono uppercase">
                                                    <span>{item.size}</span>
                                                    <span className="text-zinc-700">|</span>
                                                    <span>{item.color}</span>
                                                </div>
                                            </div>
                                            <div className="px-4 text-xs font-mono text-white">x{item.quantity}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                        
                        {/* Footer */}
                        <div className="bg-black p-4 border-t border-white/10 text-center flex items-center justify-center gap-2">
                            <ShieldCheck size={12} className="text-zinc-600" />
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
                                Envío Asegurado por Dreamlife Global Corp
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracker;


