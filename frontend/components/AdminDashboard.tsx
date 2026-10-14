
import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, LogOut, Check, MapPin, Truck, AlertCircle, RefreshCw, Activity, ClipboardList, Shield, AlertTriangle, Search, DollarSign, User, Tag, Layers, Calendar, CreditCard, X, Eye, Home, Box, BarChart3, Clock, Hash, ChevronRight, FileText, Send, Save, CalendarCheck, Phone, Mail, Menu, PlusCircle, XCircle, RotateCcw, Filter, PenLine, ImagePlus, Trash2, UploadCloud, Loader2, ArrowRight, ShieldCheck, Radio } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { APP_IMAGES } from '../imagenes_url';
import type { Order, OrderStatus, Product } from '../types';
import { loginAdmin, logoutAdmin, hasAdminSession, fetchOrdersFromDB, updateOrderInDB, fetchProductsFromDB } from '../services/backend';
import { ApiError } from '../services/api';

// Definimos el tipo de contexto esperado (debe coincidir con App.tsx)
interface ContextType {
    products: Product[];
    upsertProduct: (newProduct: Product) => Promise<boolean>;
}

const AdminDashboard: React.FC = () => {
  // OBTENEMOS EL ESTADO GLOBAL DE PRODUCTOS Y LA FUNCIÓN DE AGREGAR (QUE LLAMA AL PHP)
  const { products: globalProducts, upsertProduct } = useOutletContext<ContextType>();
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('orders');
  
  // LOGIN STATES
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<'Todos' | OrderStatus>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  // Estado para el número de guía en el modal
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Estado para fecha de entrega
  const [deliveryDate, setDeliveryDate] = useState('');

  // Estado para menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const loadInventoryProducts = async () => {
      try {
          const fresh = await fetchProductsFromDB({ forceRefresh: true });
          setInventoryProducts(fresh);
      } catch (err) {
          console.error("[admin] No se pudo cargar inventario", err);
      }
  };

  // --- ESTADOS PARA NUEVO PRODUCTO ---
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false); // Estado de guardado
  const [newProductForm, setNewProductForm] = useState({
      name: '',
      price: '',
      description: '',
      category: 'Playeras', // Default category
      skuBase: 'GP-TEE-BLK-V1', // ID DEFAULT: Para editar el producto principal
      images: [] as string[],
      currentImageUrl: '', 
      stockMap: { 'S': 0, 'M': 0, 'L': 0, 'XL': 0 } as Record<string, number>,
      colorName: 'Black'
  });

  // Si la sesion del admin expira, regresa a la pantalla de acceso.
  const handleApiError = (error: unknown, fallback: string) => {
      if (error instanceof ApiError && error.status === 401) {
          setIsAuthenticated(false);
          setLoginError('Tu sesion expiro. Vuelve a iniciar sesion.');
          return;
      }
      alert(error instanceof Error ? error.message : fallback);
  };

  // CARGAR PEDIDOS
  const refreshOrders = async () => {
      setIsLoading(true);
      try {
          setOrders(await fetchOrdersFromDB());
      } catch (error) {
          handleApiError(error, 'No se pudieron cargar los pedidos.');
      } finally {
          setIsLoading(false);
      }
  };

  // Reanuda la sesion guardada en esta pestana.
  useEffect(() => {
      hasAdminSession()
          .then(setIsAuthenticated)
          .finally(() => setIsCheckingSession(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        refreshOrders();
        loadInventoryProducts();
        
        // Opcional: Polling cada 30 segundos para nuevos pedidos
        const interval = setInterval(refreshOrders, 30000);
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Resetear estados al abrir modal de orden
  useEffect(() => {
      if (selectedOrder) {
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          setDeliveryDate(now.toISOString().slice(0, 16));
          setTrackingNumber('');
      }
  }, [selectedOrder]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const error = await loginAdmin(username, password);

    if (!error) {
        setPassword('');
        setIsAuthenticated(true);
    } else {
        setLoginError(error);
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
      await logoutAdmin();
      setIsAuthenticated(false);
      setOrders([]);
  };

  const handleChangeStatus = async (orderId: string, newStatus: OrderStatus) => {
      // Optimistic Update UI
      setOrders(prevOrders => 
          prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );

      if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      try {
          await updateOrderInDB(orderId, newStatus);
      } catch (error) {
          handleApiError(error, 'No se pudo sincronizar el cambio con el servidor.');
          refreshOrders(); // Revertir cambios si falla
      }
  };
  
  const handleSaveTracking = async () => {
      if (!trackingNumber) return alert("Ingresa un número de guía");
      if (!selectedOrder) return;

      setIsSendingEmail(true);
      
      try {
          // Guarda la guia; el backend envia el correo de "pedido enviado".
          const { order, emailSent } = await updateOrderInDB(selectedOrder.id, 'Enviado', { trackingNumber });
          setOrders(prev => prev.map(o => (o.id === order.id ? order : o)));
          setSelectedOrder(order);
          alert(emailSent
              ? `Guía ${trackingNumber} guardada y correo enviado al cliente.`
              : `Guía ${trackingNumber} guardada, pero no se pudo enviar el correo.`);
      } catch (error) {
          handleApiError(error, 'No se pudo guardar la guía.');
      } finally {
          setIsSendingEmail(false);
      }
  };

  const handleConfirmDelivery = async () => {
      if (!deliveryDate) return alert("Por favor asigna una fecha de entrega");
      if (!selectedOrder) return;
      
      const formattedDate = new Date(deliveryDate).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
      
      if (confirm(`¿Confirmar recepción del pedido el ${formattedDate}?`)) {
          await handleChangeStatus(selectedOrder.id, 'Entregado');
      }
  };

  // --- LOGICA AGREGAR PRODUCTO ---
  const handleAddImage = () => {
      if (!newProductForm.currentImageUrl) return;
      if (newProductForm.images.length >= 8) return alert("Máximo 8 imágenes permitidas");
      
      setNewProductForm(prev => ({
          ...prev,
          images: [...prev.images, prev.currentImageUrl],
          currentImageUrl: ''
      }));
  };

  const handleRemoveImage = (index: number) => {
      setNewProductForm(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
      }));
  };

  const handleStockChange = (size: string, qty: string) => {
      const val = parseInt(qty) || 0;
      setNewProductForm(prev => ({
          ...prev,
          stockMap: { ...prev.stockMap, [size]: val }
      }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSavingProduct(true);
      
      const totalStock = Object.values(newProductForm.stockMap as Record<string, number>).reduce((a, b) => a + Number(b), 0);
      
      const newProd: Product = {
          id: newProductForm.skuBase || `PROD-${Date.now()}`,
          name: newProductForm.name,
          price: parseFloat(newProductForm.price),
          category: newProductForm.category as any,
          image: newProductForm.images[0] || APP_IMAGES.placeholderProduct,
          gallery: newProductForm.images,
          description: newProductForm.description,
          colors: [newProductForm.colorName],
          sizes: Object.keys(newProductForm.stockMap).filter(k => newProductForm.stockMap[k] > 0),
          variants: newProductForm.stockMap,
          stock: totalStock,
          sold: 0
      };

      const saved = await upsertProduct(newProd);
      setIsSavingProduct(false);
      if (!saved) return;

      setIsAddProductOpen(false);
      loadInventoryProducts();
      
      // Reset Form (Keeping category/base SKU for convenience)
      setNewProductForm({
        name: '', price: '', description: '', category: 'Playeras', skuBase: 'GP-TEE-BLK-V1',
        images: [], currentImageUrl: '', stockMap: { 'S': 0, 'M': 0, 'L': 0, 'XL': 0 }, colorName: 'Black'
      });
  };

  const getProductImage = (productName: string) => {
    // Buscar en la lista global de productos por nombre
    const found = globalProducts.find(p => p.name === productName);
    return found ? found.image : APP_IMAGES.placeholderProduct;
  };

  const totalSales = orders.reduce((acc, order) => {
      if (['Pagado', 'Procesando', 'Enviado', 'Entregado'].includes(order.status)) {
          return acc + Number(order.total);
      }
      return acc;
  }, 0);
  
  const pendingOrders = orders.filter(o => ['Pagado', 'Procesando', 'Pendiente'].includes(o.status)).length;
  const totalOrdersCount = orders.length;
  const totalItemsSold = orders.reduce((acc, order) => {
      const itemsCount = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      return acc + itemsCount;
  }, 0);
  // Usamos globalProducts
  const lowStockProducts = globalProducts.filter(p => p.stock < 10 && p.name !== "").length; // Filtrar el esqueleto vacío

  const filteredOrders = orders.filter(o => {
      const matchesStatus = statusFilter === 'Todos' || o.status === statusFilter;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        o.orderNumber.toLowerCase().includes(searchLower) || 
        o.customer.toLowerCase().includes(searchLower) ||
        o.email.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
  });

  // --- INVENTARIO DISPONIBLE DESCONTANDO PEDIDOS ---
  const ordersBySku = orders.reduce((acc: Record<string, number>, order) => {
      (order.items || []).forEach(it => {
          if (it.sku) {
              acc[it.sku] = (acc[it.sku] || 0) + (Number(it.quantity) || 0);
          }
      });
      return acc;
  }, {});

  // --- LÓGICA PARA APLANAR INVENTARIO (Mostrar por variantes) ---
  const getAllVariants = () => {
      const variantsList: any[] = [];
      
      // USAMOS LA LISTA GLOBAL DE PRODUCTOS
      const sourceProducts = inventoryProducts.length ? inventoryProducts : globalProducts;
      sourceProducts.forEach(product => {
          // Filtrar por categoría seleccionada
          if (selectedCategory !== 'Todos' && product.category !== selectedCategory) return;
          // Ignorar productos vacíos (esqueleto)
          if (product.name === "") return;

          product.sizes.forEach(size => {
              const skuVariant = (product as any).variantSkus?.[size] || `${product.id}-${size}`;
              // No restamos pedidos aquí; mostramos stock tal cual viene de BD
              const booked = 0;
              const baseStock = product.variants?.[size] || 0;
              const available = Math.max(0, baseStock - booked);
              variantsList.push({
                  skuReal: skuVariant,
                  productName: product.name,
                  image: product.image,
                  size: size,
                  stock: available,
                  price: product.price,
                  category: product.category,
                  color: product.colors[0] // Asumimos primer color para demo
              });
          });
      });

      return variantsList;
  };

  const inventoryVariants = getAllVariants();

  // --- HELPERS DE DIRECCIÓN ---
  const extractBetweenStreets = (address: string | undefined) => {
      if (!address) return '';
      const match = address.match(/Entre:\s*(.*?)(,|$)/i);
      return match ? match[1].trim() : '';
  };

  const getCleanAddress = (address: string | undefined) => {
      if (!address) return 'Dirección no registrada';
      const parts = address.split(',');
      const cleanParts = parts.filter(part => !part.trim().toLowerCase().startsWith('entre:'));
      return cleanParts.join(', ').replace(/,\s*,/g, ',').trim();
  };
  
  const getStatusColor = (status: OrderStatus) => {
      switch(status) {
          case 'Pagado': return 'text-emerald-400 border-emerald-400 bg-emerald-400/10 font-bold';
          case 'Procesando': return 'text-indigo-400 border-indigo-400 bg-indigo-400/10 font-bold';
          case 'Enviado': return 'text-blue-400 border-blue-400 bg-blue-400/10 font-bold';
          case 'Entregado': return 'text-zinc-400 border-zinc-400 bg-zinc-400/10 font-bold';
          case 'Pendiente': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10 font-bold';
          case 'Cancelado': return 'text-red-400 border-red-400 bg-red-400/10 font-bold';
          case 'Reembolsado': return 'text-purple-400 border-purple-400 bg-purple-400/10 font-bold';
          case 'Fallido': return 'text-orange-500 border-orange-500 bg-orange-500/10 font-bold';
          default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
      }
  };
  
  const getStatusBorderLeft = (status: OrderStatus) => {
      switch(status) {
          case 'Pagado': return 'border-l-emerald-500';
          case 'Procesando': return 'border-l-indigo-500';
          case 'Enviado': return 'border-l-blue-500';
          case 'Entregado': return 'border-l-zinc-500';
          case 'Pendiente': return 'border-l-yellow-500';
          case 'Cancelado': return 'border-l-red-500';
          case 'Reembolsado': return 'border-l-purple-500';
          case 'Fallido': return 'border-l-orange-500';
          default: return 'border-l-gray-500';
      }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md p-10 space-y-8 animate-fade-in border border-white/10 rounded-2xl bg-black shadow-2xl">
          <div className="text-center">
             <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <Shield className="text-black" size={32} />
             </div>
            <h2 className="text-3xl font-serif font-black text-white tracking-tighter uppercase">ADMIN ACCESS</h2>
          </div>
          
          {loginError && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-200 text-[10px] uppercase font-bold p-3 rounded text-center animate-shake">
                  {loginError}
              </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
                <input
                type="text"
                required
                className="w-full px-3 py-4 border border-zinc-800 bg-black text-white focus:outline-none focus:border-white text-center tracking-widest transition-all rounded text-base md:text-sm"
                placeholder="USUARIO / ADMIN ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
                <input
                type="password"
                required
                className="w-full px-3 py-4 border border-zinc-800 bg-black text-white focus:outline-none focus:border-white text-center tracking-widest transition-all rounded text-base md:text-sm"
                placeholder="CLAVE MAESTRA"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-all rounded flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Iniciar Sistema'}
            </button>
            <div className="text-center">
                <Link to="/" className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest flex items-center justify-center gap-2">
                    <Home size={12} />
                    Regresar a Tienda
                </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- MENU HANDLER ---
  const handleMenuClick = (tab: 'overview' | 'products' | 'orders') => {
      setActiveTab(tab);
      setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex overflow-hidden font-sans">
        
        {/* --- MOBILE OVERLAY (Backdrop) --- */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
        )}

        {/* --- SIDEBAR --- */}
        <div className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-white/10 flex flex-col justify-between 
            transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
             <div className="p-6">
                <div className="flex items-center justify-between mb-12 px-2">
                    <div className="flex items-center gap-3">
                        <Shield size={24} className="text-white" />
                        <span className="font-serif font-bold tracking-tighter text-xl text-white">ADMIN</span>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="lg:hidden text-zinc-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-2">
                    <button 
                        onClick={() => handleMenuClick('orders')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'orders' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <ShoppingBag size={16} />
                        Pedidos
                    </button>

                    <button 
                        onClick={() => handleMenuClick('products')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'products' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Box size={16} />
                        Inventario
                    </button>

                    <button 
                        onClick={() => handleMenuClick('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'overview' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <BarChart3 size={16} />
                        Métricas
                    </button>
                </div>
             </div>

             <div className="p-6">
                 <div className="flex items-center gap-2 px-4 py-2 opacity-50 mb-4">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${orders.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                        {orders.length > 0 ? 'DB Connected' : 'No Data'}
                    </span>
                 </div>
                 <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
                 >
                    <LogOut size={16} />
                    Salir
                </button>
             </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col h-full bg-black relative w-full">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

             {/* MOBILE HEADER */}
             <div className="lg:hidden h-16 border-b border-white/10 flex items-center px-6 bg-black z-20 shrink-0">
                 <button onClick={() => setIsMobileMenuOpen(true)} className="text-white mr-4">
                     <Menu size={24} />
                 </button>
                 <span className="font-serif font-bold tracking-tighter text-lg text-white">DREAMLIFE ADMIN</span>
             </div>

             {/* TAB: ORDERS */}
             {activeTab === 'orders' && (
                <div className="flex-1 flex flex-col h-full z-10 overflow-hidden">
                    <div className="h-auto py-6 border-b border-white/10 flex flex-col px-6 lg:px-8 bg-black/80 backdrop-blur-md shrink-0 gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl lg:text-3xl font-serif font-black uppercase tracking-tighter text-white">Pedidos</h2>
                            <div className="flex gap-4 items-center">
                                <button onClick={refreshOrders} className="p-2 bg-zinc-900 rounded-full hover:bg-white/10 transition-colors" title="Refrescar">
                                    <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                                </button>
                                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest hidden lg:block">{filteredOrders.length} Resultados</span>
                            </div>
                        </div>
                        
                        {/* Filtros Separados */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full">
                             <div className="relative group w-full lg:w-auto">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por ID, Email..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-zinc-900 border border-white/10 rounded-full py-2 pl-9 pr-4 text-base md:text-xs text-white focus:outline-none focus:border-zinc-700 w-full lg:w-64 transition-all"
                                />
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
                                {['Todos', 'Pendiente', 'Pagado', 'Enviado', 'Entregado'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status as any)}
                                        className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                                            statusFilter === status 
                                            ? 'bg-white text-black border-white' 
                                            : 'bg-zinc-900 text-zinc-500 border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Added pb-32 for better scrolling visibility */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar pb-32">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                                <RefreshCw className="animate-spin" />
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[60vh] border border-dashed border-zinc-800 rounded-2xl mx-4 lg:mx-8">
                                <ClipboardList size={48} className="text-zinc-800 mb-4" />
                                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                                    {searchTerm || statusFilter !== 'Todos' ? 'No hay coincidencias' : 'Esperando Pedidos...'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                                {filteredOrders.map(order => (
                                    <div 
                                      key={order.id} 
                                      onClick={() => setSelectedOrder(order)} 
                                      className={`group bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:bg-[#111] hover:border-white/10 transition-all duration-400 cursor-pointer shadow-xl flex flex-col gap-4 min-h-[190px] ${getStatusBorderLeft(order.status)}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-white transition-colors">
                                                    <Hash size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">Folio</p>
                                                    <h3 className="text-lg font-mono font-black text-white tracking-widest leading-tight">{order.orderNumber}</h3>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full border ${order.status === 'Pagado' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-400/10' : 'border-zinc-800 text-zinc-600 bg-zinc-950'}`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.35em]">Cliente</p>
                                                <p className="text-sm font-bold text-white uppercase truncate">{order.customer || 'Invitado'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.35em]">Destino</p>
                                                <p className="text-[10px] font-mono text-zinc-500 uppercase truncate italic">{getCleanAddress(order.address) || 'Pendiente'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-end justify-between pt-2 border-t border-white/5">
                                            <div className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors">
                                                Abrir Pedido <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.35em]">Total</p>
                                                <h4 className="text-2xl font-mono font-black text-white tracking-tighter">${Number(order.total).toFixed(2)}</h4>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
             )}

             {/* TAB: PRODUCTS (INVENTARIO REESTRUCTURADO) */}
             {activeTab === 'products' && (
                 <div className="flex-1 flex flex-col h-full z-10 overflow-hidden">
                     
                     {/* 1. Header Principal */}
        <div className="py-6 px-6 lg:px-8 border-b border-white/10 bg-black/80 backdrop-blur-md shrink-0">
           <div className="flex items-center justify-between mb-4">
               <h2 className="text-2xl lg:text-3xl font-serif font-black uppercase tracking-tighter text-white">Inventario</h2>
                <button 
                                onClick={loadInventoryProducts}
                                className="bg-white text-black px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2"
             >
                 <RefreshCw size={14} /> Refrescar Stock
             </button>
        </div>

                        {/* 2. Barra de Categorías */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-2">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mr-2 flex items-center gap-1">
                                    <Filter size={12} /> Filtrar:
                                </span>
                                {['Todos', 'Playeras', 'Hoodies'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                                            selectedCategory === cat 
                                            ? 'bg-white text-black border-white' 
                                            : 'bg-zinc-900 text-zinc-500 border-white/10 hover:border-white/30 hover:text-white'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="hidden lg:flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-widest">
                                <Layers size={14} /> {inventoryVariants.length} VARIANTS
                            </div>
                        </div>
                    </div>
                    
                    {/* 3. Grid de Variantes Independientes (Rediseñado) */}
                    {/* Added pb-32 to ensure bottom scrolling space */}
                    <div className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar pb-32">
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {inventoryVariants.map((item) => (
                                <div key={item.skuReal} className="bg-zinc-950 border border-white/10 hover:border-white/40 transition-all rounded-lg overflow-hidden flex flex-col group relative">
                                    
                                    {/* Indicador de Stock Bajo */}
                                    {item.stock < 5 && (
                                        <div className="absolute top-2 left-2 z-10">
                                            <div className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest animate-pulse">
                                                Bajo Stock
                                            </div>
                                        </div>
                                    )}

                                    {/* Imagen */}
                                    <div className="aspect-square bg-zinc-900 w-full relative">
                                        <img src={item.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                        
                                        {/* Talla Badge */}
                                        <div className="absolute bottom-2 right-2">
                                            <div className="bg-black/80 backdrop-blur-sm border border-white/20 text-white w-8 h-8 flex items-center justify-center font-bold text-xs rounded-md shadow-lg">
                                                {item.size}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Panel Detallado */}
                                    <div className="p-4 flex flex-col gap-3 flex-1">
                                        
                                        {/* Header Info */}
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate max-w-[60%]">{item.category}</p>
                                                <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest truncate">{item.color}</p>
                                            </div>
                                            <h3 className="text-xs font-bold text-white uppercase leading-tight line-clamp-2 h-8" title={item.productName}>
                                                {item.productName}
                                            </h3>
                                        </div>

                                        {/* Data Grid */}
                                        <div className="space-y-2 border-t border-white/5 pt-3">
                                            <div className="flex justify-between">
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Precio</p>
                                                <p className="text-xs text-white font-mono font-medium">${item.price}</p>
                                            </div>
                                            <div>
                                                 <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">SKU Completo</p>
                                                 <p className="text-[10px] text-zinc-400 font-mono break-all">{item.skuReal}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Stock Control Footer */}
                                        <div className="border-t border-white/5 pt-3 mt-auto flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Disponible</p>
                                                <p className={`text-xl font-mono font-bold leading-none ${item.stock === 0 ? 'text-red-500' : 'text-white'}`}>
                                                    {item.stock} <span className="text-[10px] text-zinc-600 font-sans font-normal tracking-wide">unid.</span>
                                                </p>
                                            </div>
                                            {/* Botón de edición eliminado según petición */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                 </div>
             )}

             {/* TAB: OVERVIEW */}
             {activeTab === 'overview' && (
                <div className="flex-1 p-4 lg:p-8 overflow-y-auto z-10 max-w-6xl mx-auto space-y-12">
                    {/* Radar / Escaneo */}
                    <div className="flex items-center gap-6 bg-zinc-950/50 border border-emerald-500/20 rounded-[2.5rem] p-8 mb-2 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-40"></div>
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <Radio size={32} className="text-emerald-400 animate-pulse relative z-10" />
                            <span className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping scale-150"></span>
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-white uppercase tracking-[0.5em] mb-1">Escaneo del Sistema Activo</p>
                            <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">
                                Esperando nuevas transacciones<span className="animate-pulse">...</span>
                            </p>
                        </div>
                        <div className="ml-auto hidden md:flex items-center gap-6 pr-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-zinc-600 uppercase">Uptime</span>
                                <span className="text-xs font-mono text-white">99.9%</span>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-zinc-600 uppercase">Status</span>
                                <span className="text-xs font-mono text-emerald-500">Secured</span>
                            </div>
                        </div>
                    </div>

                    {/* M�tricas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-[#0a0a0a] border border-emerald-500/20 p-10 rounded-[3rem] relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-700 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                            <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 blur-[100px] rounded-full group-hover:bg-emerald-500/15 transition-all duration-700"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-400 group-hover:text-emerald-300 transition-all duration-500 border border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]">
                                    <Activity size={28} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4">Ingresos Totales</p>
                                <h3 className="text-5xl font-mono font-black text-white tracking-tighter leading-none">
                                    ${totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </h3>
                                <div className="mt-8 flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Liquidaci�n Final
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-sky-500/20 p-10 rounded-[3rem] relative overflow-hidden group hover:border-sky-500/50 transition-all duration-700 shadow-[0_0_50px_rgba(14,165,233,0.05)]">
                            <div className="absolute top-0 right-0 p-24 bg-sky-500/5 blur-[100px] rounded-full group-hover:bg-sky-500/15 transition-all duration-700"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-8 text-sky-400 group-hover:text-sky-300 transition-all duration-500 border border-sky-500/20 shadow-[inset_0_0_15px_rgba(14,165,233,0.2)]">
                                    <Hash size={28} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4">Pedidos Registro</p>
                                <h3 className="text-7xl font-mono font-black text-white tracking-tighter leading-none">
                                    {totalOrdersCount}
                                </h3>
                                <div className="mt-8 flex items-center gap-2 text-[10px] text-sky-400 font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div> Flujo de Carga
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-violet-500/20 p-10 rounded-[3rem] relative overflow-hidden group hover:border-violet-500/50 transition-all duration-700 shadow-[0_0_50px_rgba(139,92,246,0.05)]">
                            <div className="absolute top-0 right-0 p-24 bg-violet-500/5 blur-[100px] rounded-full group-hover:bg-violet-500/15 transition-all duration-700"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-8 text-violet-400 group-hover:text-violet-300 transition-all duration-500 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.2)]">
                                    <Box size={28} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4">Volumen Stock</p>
                                <h3 className="text-7xl font-mono font-black text-white tracking-tighter leading-none">
                                    {totalItemsSold}
                                </h3>
                                <div className="mt-8 flex items-center gap-2 text-[10px] text-violet-400 font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div> Art�culos Out
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monitor Seguridad */}
                    <div className="bg-zinc-950/40 border border-white/5 p-12 rounded-[4rem] flex flex-col items-center justify-center min-h-[450px] text-center relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none"></div>
                        
                        <div className="relative mb-12">
                            <Shield size={90} className="text-zinc-800 animate-pulse" />
                            <div className="absolute inset-0 bg-white/5 blur-[60px] rounded-full scale-150 animate-pulse opacity-40"></div>
                        </div>

                        <p className="text-base text-zinc-400 font-mono uppercase tracking-[0.8em] font-black mb-6">Dreamlife Ops System</p>
                        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mb-10"></div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl px-4">
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/5 transition-colors">
                                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3 block">Base Datos</span>
                                <span className="text-sm text-emerald-500 font-black uppercase tracking-tighter flex items-center justify-center gap-2">
                                    <RefreshCw size={14} className="animate-spin" /> Conectado
                                </span>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/5 transition-colors">
                                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3 block">Seguridad</span>
                                <span className="text-sm text-white font-black uppercase tracking-tighter">SSL 256-BIT</span>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/5 transition-colors">
                                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3 block">Latencia</span>
                                <span className="text-sm text-sky-400 font-black uppercase tracking-tighter">11.4 MS</span>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/5 transition-colors">
                                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-3 block">Terminal</span>
                                <span className="text-sm text-white font-black uppercase tracking-tighter">Core 01</span>
                            </div>
                        </div>
                    </div>
                </div>
             )}

        {/* --- MODAL AGREGAR PRODUCTO --- */}
        {isAddProductOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsAddProductOpen(false)}></div>
                <div className="relative bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
                    
                    {/* Header */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-zinc-900/50">
                        <h3 className="text-xl font-serif font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <PlusCircle size={20} /> Nuevo Producto / Actualizar
                        </h3>
                        <button onClick={() => setIsAddProductOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleCreateProduct} className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        {/* COLUMNA IZQUIERDA: IMÁGENES */}
                        <div className="w-full md:w-1/3 bg-black/50 p-6 border-r border-white/10 overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                <ImagePlus size={14} /> Galería (Máx 8)
                            </h4>
                            
                            {/* Input URL Temporal / Simulación Carga */}
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="URL de Imagen (Cargada al servidor)..." 
                                        className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 text-base md:text-xs text-white focus:outline-none focus:border-white pl-8"
                                        value={newProductForm.currentImageUrl}
                                        onChange={(e) => setNewProductForm({...newProductForm, currentImageUrl: e.target.value})}
                                    />
                                    <UploadCloud size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleAddImage}
                                    className="bg-white text-black px-3 py-2 rounded text-xs font-bold hover:bg-gray-200"
                                >
                                    +
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {newProductForm.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square bg-zinc-900 rounded overflow-hidden group border border-white/10">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[9px] text-white py-1 uppercase font-bold">Portada</div>}
                                    </div>
                                ))}
                                {newProductForm.images.length < 8 && (
                                    <div className="aspect-square border border-dashed border-zinc-800 rounded flex items-center justify-center text-zinc-600 flex-col gap-2">
                                        <UploadCloud size={20} />
                                        <span className="text-[9px] uppercase">Espacio Libre</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: DATOS */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nombre del Producto</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={newProductForm.name} 
                                        onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                                        className="w-full bg-zinc-900 border border-white/10 rounded p-3 text-base md:text-sm text-white focus:outline-none focus:border-white font-serif tracking-wide"
                                        placeholder="Ej: GOD'S PLAN TEE"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">SKU Base</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={newProductForm.skuBase} 
                                        onChange={(e) => setNewProductForm({...newProductForm, skuBase: e.target.value})}
                                        className="w-full bg-zinc-900 border border-white/10 rounded p-3 text-base md:text-sm text-white focus:outline-none focus:border-white font-mono uppercase"
                                        placeholder="Ej: GP-TEE-BLK-V2"
                                    />
                                    <p className="text-[9px] text-zinc-500">Usa 'GP-TEE-BLK-V1' para editar la Playera Central.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Precio (MXN)</label>
                                    <input 
                                        required 
                                        type="number" 
                                        value={newProductForm.price} 
                                        onChange={(e) => setNewProductForm({...newProductForm, price: e.target.value})}
                                        className="w-full bg-zinc-900 border border-white/10 rounded p-3 text-base md:text-sm text-white focus:outline-none focus:border-white font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Categoría</label>
                                    <select 
                                        value={newProductForm.category}
                                        onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                                        className="w-full bg-zinc-900 border border-white/10 rounded p-3 text-base md:text-sm text-white focus:outline-none focus:border-white uppercase"
                                    >
                                        <option value="Playeras">Playeras</option>
                                        <option value="Hoodies">Hoodies</option>
                                        <option value="Accesorios">Accesorios</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Descripción</label>
                                <textarea 
                                    required 
                                    rows={4}
                                    value={newProductForm.description}
                                    onChange={(e) => setNewProductForm({...newProductForm, description: e.target.value})}
                                    className="w-full bg-zinc-900 border border-white/10 rounded p-3 text-base md:text-sm text-white focus:outline-none focus:border-white"
                                    placeholder="Detalles del producto..."
                                />
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                                    <Layers size={14} /> Inventario Inicial por Talla
                                </h4>
                                <div className="grid grid-cols-4 gap-4">
                                    {['S', 'M', 'L', 'XL'].map(size => (
                                        <div key={size} className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-zinc-500 text-center block">Talla {size}</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={newProductForm.stockMap[size]}
                                                onChange={(e) => handleStockChange(size, e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/10 rounded p-2 text-center text-white font-mono focus:border-white focus:outline-none text-base md:text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex justify-end gap-4">
                        <button 
                            onClick={() => setIsAddProductOpen(false)}
                            className="px-6 py-3 border border-white/10 text-zinc-400 font-bold uppercase tracking-widest text-xs hover:text-white hover:border-white transition-colors rounded"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCreateProduct}
                            disabled={isSavingProduct}
                            className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors rounded shadow-lg flex items-center gap-2"
                        >
                            {isSavingProduct ? <Loader2 className="animate-spin" size={14} /> : 'Guardar Producto'}
                        </button>
                    </div>

                </div>
            </div>
        )}

        {/* --- MODAL DETALLE DE ORDEN --- */}
        {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                
                <div className="relative bg-black border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl animate-fade-in-up flex flex-col max-h-[95vh] overflow-hidden">
                    
                    {/* Header Modal */}
                    <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-950">
                        <div className="flex items-center gap-4">
                            <FileText size={18} className="text-white" />
                            <span className="font-serif font-black text-white text-lg tracking-tight hidden md:inline">MANIFIESTO DE PEDIDO</span>
                            <span className="font-serif font-black text-white text-lg tracking-tight md:hidden">PEDIDO</span>
                            <div className="h-4 w-px bg-white/20"></div>
                            <span className="font-mono text-xs text-zinc-400 uppercase truncate max-w-[100px] md:max-w-none">{selectedOrder.orderNumber}</span>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white border border-white/5">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-black p-4 md:p-6 space-y-6">

                        {/* SECCIÓN PRINCIPAL: DATOS DE ENVÍO */}
                        <div className="bg-zinc-950 border border-white/20 rounded-xl p-0 overflow-hidden relative">
                             <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>
                             
                             <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between flex-wrap gap-2">
                                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                     <Truck size={14} /> Destino / Consignatario
                                 </h3>
                                 <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Fecha de Recepción</span>
                                    <div className="flex items-center gap-2 text-sm md:text-base font-mono text-white font-bold uppercase">
                                        <Clock size={16} className="text-zinc-500" /> 
                                        {new Date(selectedOrder.date).toLocaleString('es-MX', { 
                                            weekday: 'short', 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </div>
                                 </div>
                             </div>

                             <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                                 {/* Columna Contacto */}
                                 <div className="md:col-span-5 space-y-6 border-r-0 md:border-r border-white/5 md:pr-4 flex flex-col justify-center border-b md:border-b-0 pb-6 md:pb-0">
                                     <div>
                                         <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">Consignatario</label>
                                         <div className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-4 break-words">
                                             {selectedOrder.customer}
                                         </div>
                                     </div>
                                     <div className="space-y-3">
                                         <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-full text-zinc-400"><Mail size={16} /></div>
                                            <div className="text-sm md:text-base text-white font-mono break-all">{selectedOrder.email}</div>
                                         </div>
                                         <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-full text-zinc-400"><Phone size={16} /></div>
                                            <div className="text-lg text-white font-mono font-bold tracking-wide">{selectedOrder.phone || 'N/A'}</div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Columna Dirección */}
                                 <div className="md:col-span-7 flex flex-col gap-4">
                                     <div>
                                         <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">Dirección de Entrega</label>
                                         <div className="text-base md:text-lg text-white font-serif leading-relaxed border border-white/10 bg-black/50 p-4 rounded-lg">
                                             {getCleanAddress(selectedOrder.address)}
                                         </div>
                                     </div>
                                     
                                     {/* Entre Calles */}
                                     <div>
                                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">Referencia de Ubicación</label>
                                        <div className="text-xs md:text-sm text-zinc-300 font-mono border-l-2 border-white/30 pl-4 py-2 bg-white/5 rounded-r">
                                            <span className="text-[10px] text-zinc-500 block mb-1">ENTRE CALLES:</span>
                                            {extractBetweenStreets(selectedOrder.address) || 'No especificado'}
                                        </div>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* SECCIÓN SECUNDARIA: LOGÍSTICA DE SALIDA */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* SALIDA */}
                            <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-6">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                                    <Send size={14} /> Logística de Salida
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">Tracking ID (Guía)</label>
                                        <input 
                                            type="text" 
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="MXYZ-9988776655"
                                            className="w-full bg-black border border-white/20 rounded p-3 text-base md:text-sm text-white font-mono focus:border-white focus:outline-none transition-colors uppercase"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveTracking}
                                        disabled={isSendingEmail || !trackingNumber}
                                        className="w-full bg-white text-black py-3 rounded font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSendingEmail ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                                        Guardar Guía
                                    </button>
                                </div>
                            </div>

                            {/* LLEGADA / CONFIRMACIÓN */}
                            <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                                {selectedOrder.status === 'Entregado' && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="text-[9px] bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-1 rounded uppercase font-bold tracking-widest">
                                            Completado
                                        </div>
                                    </div>
                                )}
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                                    <CalendarCheck size={14} /> Confirmación de Recepción
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">Asignar Fecha de Entrega</label>
                                        <input 
                                            type="datetime-local" 
                                            value={deliveryDate}
                                            onChange={(e) => setDeliveryDate(e.target.value)}
                                            className="w-full bg-black border border-white/20 rounded p-3 text-base md:text-sm text-white font-mono focus:border-white focus:outline-none transition-colors uppercase custom-calendar-icon"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleConfirmDelivery}
                                        className="w-full bg-zinc-800 border border-white/10 text-white py-3 rounded font-bold uppercase tracking-widest text-[10px] hover:bg-green-900/20 hover:text-green-400 hover:border-green-500/50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check size={14} />
                                        Confirmar Entrega
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* SECCIÓN TERCIARIA: PRODUCTOS */}
                        <div className="border border-white/10 rounded-xl overflow-hidden">
                             <div className="bg-white/5 p-3 border-b border-white/10">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Contenido del Paquete</h3>
                             </div>
                             <div className="divide-y divide-white/5 bg-zinc-950">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="p-4 flex gap-4 items-center">
                                        <div className="w-12 h-14 bg-zinc-900 rounded border border-white/10 overflow-hidden shrink-0">
                                            <img src={getProductImage(item.title)} alt="" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-white uppercase">{item.title}</div>
                                            <div className="text-[10px] text-zinc-500 font-mono mt-1">
                                                Talla: <span className="text-zinc-300">{item.size}</span> | Color: <span className="text-zinc-300">{item.color}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Cant.</div>
                                            <div className="text-sm font-mono text-white font-bold">{item.quantity}</div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                    </div>
                    
                    {/* Footer Actions Modal */}
                    <div className="p-4 border-t border-white/10 bg-zinc-950 flex justify-between items-center">
                        <div className="text-xs text-zinc-500 font-mono uppercase">
                            Estado actual: <span className={`text-white font-bold ${getStatusColor(selectedOrder.status).split(' ')[0]}`}>{selectedOrder.status}</span>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => handleChangeStatus(selectedOrder.id, 'Cancelado')}
                                className="px-4 py-2 border border-red-900/50 text-red-500 hover:bg-red-900/20 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                             >
                                 <XCircle size={14} /> Cancelar Pedido
                             </button>
                             <button 
                                onClick={() => handleChangeStatus(selectedOrder.id, 'Reembolsado')}
                                className="px-4 py-2 border border-purple-900/50 text-purple-500 hover:bg-purple-900/20 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                             >
                                 <RotateCcw size={14} /> Reembolsar
                             </button>
                        </div>
                    </div>

                </div>
            </div>
        )}
        {/* cierre de contenedor faltante */}
        </div>
    </div>
  );
};

export default AdminDashboard;


