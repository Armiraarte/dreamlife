
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, KeyRound, User, Save, Loader2, ShoppingBag, Camera, LayoutGrid, Settings, ShieldCheck, ArrowRight, X, MapPin, Calendar, CreditCard, Home, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseAuth';
import { getOrCreateUserProfile, updateUserProfile, uploadProfileImage } from '../services/userService';
import { fetchUserOrdersFromDB, syncCustomerProfile } from '../services/backend';
import { APP_IMAGES } from '../imagenes_url';
import { PRODUCTS } from '../constants';
import { Order, OrderStatus } from '../types';

const UserDashboard: React.FC = () => {
    // Auth Context actualizado
    const { user, logout, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
    
    const navigate = useNavigate();
    // Nuevo estado por defecto: 'overview' (Bienvenida)
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'settings'>('overview');
    
    // --- ESTADOS PARA LOGIN (Si no hay usuario) ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState(''); 
    const [isSignUp, setIsSignUp] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Estados Perfil
    const [fullName, setFullName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    
    // Estados Pedidos
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Estados UI
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- MANEJO DE LOGOUT ---
    const handleLogout = async () => {
        await logout();
        navigate('/'); // Redirigir al inicio para evitar pantalla rota
    };

    // --- MANEJO DE LOGIN ---
    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setAuthLoading(true);

        try {
            if (isSignUp) {
                if(name.trim().length < 2) throw new Error("El nombre es muy corto.");
                if(phone.trim().length < 10) throw new Error("El teléfono debe tener 10 dígitos.");
                
                await registerWithEmail(name, email, password, phone);
            } else {
                await loginWithEmail(email, password);
            }
        } catch (err: any) {
            console.error(err);
            if (err.message) {
                 setAuthError(err.message);
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setAuthError("Credenciales incorrectas.");
            } else if (err.code === 'auth/email-already-in-use') {
                setAuthError("El correo ya está registrado.");
            } else if (err.code === 'auth/weak-password') {
                setAuthError("Contraseña muy débil (min 6 caracteres).");
            } else {
                setAuthError("Error de autenticación.");
            }
        } finally {
            setAuthLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            await loginWithGoogle();
        } catch (e) {
            setAuthError("No se pudo iniciar con Google.");
        } finally {
            setAuthLoading(false);
        }
    };

    // Cargar datos del perfil
    useEffect(() => {
        const loadUserData = async () => {
            if (user) {
                try {
                    const profile = await getOrCreateUserProfile(user);
                    if (profile) {
                        setFullName(profile.displayName || user.displayName || '');
                        setUserPhone(profile.phoneNumber || '');
                        setPhotoURL(profile.photoURL || user.photoURL || '');
                    }
                } catch (error) {
                    console.error("Error cargando perfil", error);
                } finally {
                    setIsLoadingData(false);
                }
            }
        };
        loadUserData();
    }, [user]);

    // Cargar pedidos del cliente (la API identifica al usuario por su token de Firebase)
    useEffect(() => {
        let abort = false;
        const loadOrders = async () => {
            if (user && !user.isAnonymous) {
                setIsLoadingOrders(true);
                const userOrders = await fetchUserOrdersFromDB(user);
                if (!abort) {
                    setOrders(userOrders);
                    setIsLoadingOrders(false);
                }
            } else {
                setOrders([]);
                setIsLoadingOrders(false);
            }
        };
        loadOrders();
        return () => { abort = true; };
    }, [user]);

    // Handlers Dashboard
    const handlePasswordReset = async () => {
        if (user && user.email) {
            try {
                await sendPasswordResetEmail(auth, user.email);
                setResetSent(true);
                setTimeout(() => setResetSent(false), 5000);
            } catch (error) {
                alert("Error al enviar correo.");
            }
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await syncCustomerProfile(user, { nombre: fullName, telefono: userPhone });
            await updateUserProfile(user.uid, {
                displayName: fullName,
                phoneNumber: userPhone
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            alert("Error al guardar cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingPhoto(true);
        try {
            const newUrl = await uploadProfileImage(user, file);
            setPhotoURL(newUrl);
        } catch (error) {
            console.error(error);
            alert("No se pudo subir la imagen.");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const getProductImage = (productName: string, image?: string) => {
        if (image) return image;
        const found = PRODUCTS.find(p => p.name === productName);
        return found ? found.image : APP_IMAGES.placeholderProduct;
    };

    const getStatusColor = (status: OrderStatus) => {
        switch(status) {
            case 'Pagado': return 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10';
            case 'Procesando': return 'border-indigo-500/30 text-indigo-500 bg-indigo-500/10';
            case 'Enviado': return 'border-blue-500/30 text-blue-500 bg-blue-500/10';
            case 'Entregado': return 'border-zinc-500/30 text-zinc-300 bg-zinc-500/10';
            case 'Pendiente': return 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10';
            case 'Cancelado': return 'border-red-500/30 text-red-500 bg-red-500/10';
            case 'Reembolsado': return 'border-purple-500/30 text-purple-500 bg-purple-500/10';
            case 'Fallido': return 'border-orange-500/30 text-orange-500 bg-orange-500/10';
            default: return 'border-gray-500 text-gray-500';
        }
    };

    // --- RENDERIZADO DE FOTO DE USUARIO (HELPER) ---
    const renderUserAvatar = (url: string, sizeClass: string = "w-12 h-12") => {
        if (url && url !== '') {
            return <img src={url} className={`${sizeClass} rounded-full object-cover border border-white/20`} alt="Avatar" />;
        }
        return (
            <div className={`${sizeClass} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center`}>
                <User className="text-white w-1/2 h-1/2" />
            </div>
        );
    };

    // --- VISTA DE LOGIN (SI NO HAY USUARIO) ---
    if (!user) {
        return (
            <div className="min-h-screen bg-black pt-20 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-8 md:p-12 relative z-10 shadow-2xl animate-fade-in-up">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                            <User size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-serif font-black uppercase tracking-tighter text-white mb-2">
                            {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
                        </h2>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                            {isSignUp ? 'Únete a la comunidad Dreamlife' : 'Accede a tu panel personal'}
                        </p>
                    </div>

                    {authError && (
                        <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 text-red-200 text-[10px] font-bold uppercase tracking-wide rounded text-center">
                            {authError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button 
                            onClick={handleGoogleLogin}
                            disabled={authLoading}
                            className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 text-xs rounded-sm disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                            </svg>
                            Continuar con Google
                        </button>

                        <div className="relative flex py-2 items-center opacity-50">
                            <div className="flex-grow border-t border-zinc-800"></div>
                            <span className="flex-shrink-0 mx-4 text-zinc-600 text-[9px] uppercase tracking-widest">O usa tu correo</span>
                            <div className="flex-grow border-t border-zinc-800"></div>
                        </div>

                        <form onSubmit={handleAuthSubmit} className="space-y-3">
                            {isSignUp && (
                                <div className="space-y-3 animate-fade-in">
                                    <input 
                                        type="text" 
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-xs text-center tracking-wide uppercase placeholder-zinc-700 rounded-sm"
                                        placeholder="Nombre Completo"
                                    />
                                    <input 
                                        type="tel" 
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-black border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-xs text-center tracking-wide uppercase placeholder-zinc-700 rounded-sm"
                                        placeholder="Teléfono (10 dígitos)"
                                        maxLength={10}
                                    />
                                </div>
                            )}
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-xs text-center tracking-wide uppercase placeholder-zinc-700 rounded-sm"
                                placeholder="Correo Electrónico"
                            />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-xs text-center tracking-wide uppercase placeholder-zinc-700 rounded-sm"
                                placeholder="Contraseña"
                            />
                            <button 
                                type="submit"
                                disabled={authLoading}
                                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 font-bold uppercase tracking-widest py-4 transition-all flex items-center justify-center gap-2 text-xs mt-4 rounded-sm disabled:opacity-50"
                            >
                                {authLoading ? <Loader2 className="animate-spin" size={16}/> : (isSignUp ? 'Registrar' : 'Entrar')}
                            </button>
                        </form>

                        <div className="mt-4 text-center">
                            <button 
                                onClick={() => { 
                                    setIsSignUp(!isSignUp); 
                                    setAuthError(null); 
                                    setName('');
                                    setPhone('');
                                }}
                                className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-white pb-0.5"
                            >
                                {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : "Crear una cuenta nueva"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA DASHBOARD (SI HAY USUARIO) ---
    return (
        <div className="min-h-screen bg-black pt-24 pb-20 px-4 md:px-8 animate-fade-in text-white flex flex-col md:flex-row gap-8 w-full">
            
            {/* --- SIDEBAR MENU --- */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6">
                
                {/* User Card Mini */}
                <div className="flex items-center gap-4 p-4 bg-black border border-white/10 rounded-xl">
                    {renderUserAvatar(photoURL, "w-12 h-12")}
                    <div className="overflow-hidden flex-1">
                        <h3 className="font-bold text-sm truncate text-white">{fullName || 'Usuario'}</h3>
                        <p className="text-[10px] text-gray-500 font-mono truncate">{user.email}</p>
                    </div>
                    {/* Botón de Engrane para ir a Configuración (Editar Perfil) */}
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'}`}
                        title="Configuración"
                    >
                        <Settings size={16} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-all ${
                            activeTab === 'overview' ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Home size={18} /> Inicio
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-all ${
                            activeTab === 'orders' ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <ShoppingBag size={18} /> Mis Pedidos
                    </button>
                    
                    <div className="h-px bg-white/10 my-2 mx-4"></div>
                    
                    <button 
                        onClick={handleLogout}
                        className="text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-3 text-red-500 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA (FULL WIDTH) --- */}
            <div className="flex-1 bg-black border border-white/10 rounded-2xl p-6 md:p-10 relative overflow-hidden flex flex-col w-full min-h-[600px]">
                <div className="absolute top-0 right-0 p-32 bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

                {/* TAB: OVERVIEW (HOME / WELCOME) */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in relative z-10 flex flex-col justify-center h-full items-center text-center">
                        <div className="max-w-2xl">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                                <User size={40} className="text-white" />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-serif font-black uppercase tracking-tighter text-white mb-6">
                                BIENVENIDO
                            </h1>
                            <p className="text-sm md:text-base text-gray-400 font-mono leading-relaxed mb-6 max-w-lg mx-auto">
                                Hola, <span className="text-white font-bold text-lg">{fullName || 'Miembro'}</span>.
                            </p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">
                                Estamos preparando nuevas sorpresas para ti.
                            </p>
                        </div>
                    </div>
                )}

                {/* TAB: SETTINGS (EDIT PROFILE) */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in space-y-10 w-full relative z-10">
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-6">
                            <div>
                                <h2 className="text-2xl font-serif font-black uppercase tracking-tighter text-white">Editar Perfil</h2>
                                <p className="text-xs text-gray-500 font-mono mt-1">Gestiona tu identidad pública</p>
                            </div>
                            <button onClick={() => setActiveTab('overview')} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Photo Upload Section */}
                        <div className="flex flex-col items-center sm:items-start gap-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Foto de Perfil</span>
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-zinc-800 group-hover:border-white transition-colors relative flex items-center justify-center bg-zinc-900">
                                    {photoURL ? (
                                        <img src={photoURL} alt="Profile" className={`w-full h-full object-cover ${isUploadingPhoto ? 'opacity-50 grayscale' : ''}`} />
                                    ) : (
                                        <User size={64} className="text-zinc-700" />
                                    )}
                                    
                                    {isUploadingPhoto && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                            <Loader2 size={24} className="animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingPhoto}
                                    className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                                    title="Cambiar Foto"
                                >
                                    <Camera size={16} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-[10px] text-zinc-600">
                                Recomendado: 500x500px JPG o PNG.
                            </p>
                        </div>

                        {/* Form Fields - Full Width Layout */}
                        <div className="space-y-6 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nombre Visible</label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                            type="text" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Teléfono</label>
                                    <div className="relative">
                                        <LayoutGrid size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                            type="tel" 
                                            value={userPhone}
                                            onChange={(e) => setUserPhone(e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 transition-colors font-mono"
                                            placeholder="+52..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Correo Electrónico</label>
                                <div className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-sm text-gray-400 font-mono cursor-not-allowed flex items-center gap-2">
                                    <ShieldCheck size={14} />
                                    {user.email}
                                </div>
                                <p className="text-[9px] text-zinc-600">* El correo no se puede cambiar por seguridad.</p>
                            </div>

                            <div className="pt-4 flex gap-4 w-full">
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="flex-1 bg-white text-black py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {isSaving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar Cambios'}
                                </button>
                                
                                <button 
                                    onClick={handlePasswordReset}
                                    disabled={resetSent}
                                    className="flex-1 border border-white/10 text-gray-400 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <KeyRound size={16} />
                                    {resetSent ? 'Correo Enviado' : 'Cambiar Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: ORDERS */}
                {activeTab === 'orders' && (
                    <div className="animate-fade-in space-y-8 relative z-10 w-full">
                         <div className="flex items-center justify-between border-b border-white/10 pb-6">
                            <div>
                                <h2 className="text-3xl font-serif font-black uppercase tracking-tighter text-white">Historial</h2>
                                <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-widest">Tus compras recientes</p>
                            </div>
                            <div className="p-2 bg-white/5 rounded-full">
                                <ShoppingBag className="text-zinc-400" size={20} />
                            </div>
                        </div>

                        {isLoadingOrders ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-white" size={32} />
                                <p className="text-xs font-mono text-gray-500">Cargando tus pedidos...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="relative overflow-hidden border border-dashed border-zinc-800 rounded-3xl p-8 min-h-[500px] flex flex-col items-center justify-center text-center bg-zinc-950/50 w-full">
                                {/* Background Effects */}
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>

                                {/* Floating Icon Top Right */}
                                <div className="absolute top-6 right-6 text-zinc-700 opacity-50">
                                    <ShoppingBag size={24} />
                                </div>

                                <div className="relative z-10 max-w-sm mx-auto flex flex-col items-center">
                                    <h3 className="text-2xl font-serif font-black text-white mb-4">Aún no tienes pedidos</h3>
                                    <p className="text-xs text-gray-500 font-mono mb-10 leading-relaxed uppercase tracking-widest">
                                        Tu historial está limpio. Comienza tu colección adquiriendo piezas exclusivas de nuestro drop actual.
                                    </p>
                                    <Link 
                                        to="/shop" 
                                        className="inline-block bg-white text-black px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4"
                                    >
                                        Ir a la Tienda
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                                {orders.map((order) => {
                                    const mainItem = order.items[0];
                                    const itemImage = getProductImage(mainItem.title, mainItem.image);

                                    return (
                                        <div 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)}
                                            className="group relative bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/30 transition-all duration-300"
                                        >
                                            {/* Image Background / Section */}
                                            <div className="h-48 w-full relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10"></div>
                                                <img 
                                                    src={itemImage} 
                                                    alt="Order Preview" 
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105 transform"
                                                />
                                                
                                                {/* Status Badge */}
                                                <div className="absolute top-4 right-4 z-20">
                                                     <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-lg ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>

                                                {/* Order Number */}
                                                <div className="absolute bottom-4 left-4 z-20">
                                                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mb-1">Orden</p>
                                                    <h3 className="text-xl font-serif font-bold text-white tracking-tight">{order.orderNumber}</h3>
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="p-6">
                                                <div className="flex justify-between items-end mb-4">
                                                     <div>
                                                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Fecha</p>
                                                        <p className="text-sm text-zinc-300 font-mono">
                                                            {new Date(order.date).toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                     </div>
                                                     <div className="text-right">
                                                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Total</p>
                                                        <p className="text-lg text-white font-mono font-bold">${Number(order.total).toFixed(2)}</p>
                                                     </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                                                    <div className="flex -space-x-2">
                                                        {order.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="w-8 h-8 rounded-full border border-zinc-900 bg-zinc-800 overflow-hidden relative z-0">
                                                                <img src={getProductImage(item.title, item.image)} className="w-full h-full object-cover opacity-80" alt="" />
                                                            </div>
                                                        ))}
                                                        {order.items.length > 3 && (
                                                            <div className="w-8 h-8 rounded-full border border-zinc-900 bg-zinc-800 flex items-center justify-center text-[9px] text-zinc-400 font-bold z-10">
                                                                +{order.items.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide ml-auto flex items-center gap-1 group-hover:text-white transition-colors">
                                                        Ver Detalle <ArrowRight size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- ORDER DETAILS MODAL (Reutilizado) --- */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        
                        {/* Header */}
                        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-md p-6 border-b border-white/10 flex items-center justify-between z-10">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Detalle de Orden</p>
                                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-3">
                                    {selectedOrder.orderNumber}
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </h3>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            
                            {/* Items Grid */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                    <ShoppingBag size={14} /> Productos
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="w-16 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={getProductImage(item.title, item.image)} 
                                                    alt={item.title} 
                                                    className="w-full h-full object-cover opacity-80"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="text-sm font-bold text-white leading-tight">{item.title}</h5>
                                                    <span className="font-mono text-sm text-white">${Number(item.price).toFixed(2)}</span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[10px] bg-black px-2 py-0.5 rounded text-zinc-400 border border-white/10 uppercase font-mono">
                                                        Talla: {item.size}
                                                    </span>
                                                    <span className="text-[10px] bg-black px-2 py-0.5 rounded text-zinc-400 border border-white/10 uppercase font-mono">
                                                        {item.color}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                                                        Cant: {item.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-b border-white/10">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 mb-4">
                                        <MapPin size={14} /> Envío
                                    </h4>
                                    <div className="text-sm text-zinc-400 leading-relaxed font-mono">
                                        <p className="text-white font-bold mb-1">{selectedOrder.customer}</p>
                                        <p>{selectedOrder.address}</p>
                                        <p className="mt-2">{selectedOrder.email}</p>
                                        <p>{selectedOrder.phone}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2 mb-4">
                                        <CreditCard size={14} /> Pago
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Subtotal</span>
                                            <span className="font-mono">${Number(selectedOrder.total).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-400">
                                            <span>Envío</span>
                                            <span className="font-mono text-green-500">GRATIS</span>
                                        </div>
                                        <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10 mt-2">
                                            <span>Total Pagado</span>
                                            <span className="font-mono text-lg">${Number(selectedOrder.total).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} />
                                    {new Date(selectedOrder.date).toLocaleString()}
                                </div>
                                <div>ID: {selectedOrder.id}</div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
