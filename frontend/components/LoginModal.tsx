
import React, { useState } from 'react';
import { X, User, ShieldAlert, LogIn, UserPlus, Ghost } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [phone, setPhone] = useState(''); 
  const [isSignUp, setIsSignUp] = useState(false);
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [showGuestSuggestion, setShowGuestSuggestion] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        if (isSignUp) {
            if(name.trim().length < 2) throw new Error("El nombre es muy corto.");
            if(phone.trim().length < 10) throw new Error("El teléfono debe tener 10 dígitos.");
            
            await registerWithEmail(name, email, password, phone);
        } else {
            await loginWithEmail(email, password);
        }
        onClose();
    } catch (err: any) {
        console.error(err);
        if (err.message === "El nombre es muy corto.") {
            setError(err.message);
        } else if (err.message === "El teléfono debe tener 10 dígitos.") {
            setError(err.message);
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError("Correo o contraseña incorrectos.");
        } else if (err.code === 'auth/email-already-in-use') {
            setError("Este correo ya está registrado.");
        } else if (err.code === 'auth/weak-password') {
            setError("La contraseña debe tener al menos 6 caracteres.");
        } else {
            setError("Error al conectar.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      setError(null);
      setDomainError(null);
      setShowGuestSuggestion(false);
      try {
          await loginWithGoogle();
          onClose();
      } catch (e: any) {
          console.error("Login Error Full Object:", e);
          
          const isDomainError = 
            e.code === 'auth/unauthorized-domain' || 
            e.code === 'auth/operation-not-allowed' ||
            (e.message && e.message.includes('unauthorized-domain'));

          if (isDomainError) {
              const currentHostname = window.location.hostname;
              setError("DOMINIO NO AUTORIZADO (FIREBASE)");
              setDomainError(currentHostname);
          } else if (e.code === 'auth/popup-closed-by-user') {
              setError("Ventana cerrada antes de terminar.");
          } else {
              setError("No se pudo iniciar con Google.");
          }
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative bg-zinc-950 border border-white/10 w-full max-w-sm p-8 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8 mt-2">
          <h2 className="text-2xl font-serif font-bold tracking-tighter text-white mb-2 uppercase">
            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            {isSignUp ? 'Únete al club Dreamlife' : 'Acceso exclusivo a miembros'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
            <div className={`mb-6 p-4 border rounded-lg flex flex-col gap-3 text-[10px] ${domainError ? 'bg-orange-900/20 border-orange-500/30 text-orange-200' : 'bg-red-900/20 border-red-500/30 text-red-200'}`}>
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                    <ShieldAlert size={16} className={domainError ? "text-orange-400" : "text-red-500"} />
                    {error}
                </div>
                {domainError && (
                    <div className="bg-black/40 p-3 rounded border border-orange-500/20 mt-2">
                         <p className="mb-2 font-bold text-white">PARA SOLUCIONARLO:</p>
                        <ol className="list-decimal pl-4 space-y-2 text-zinc-400 leading-relaxed">
                            <li>Ve a tu consola de Firebase ({'>'} Auth {'>'} Settings).</li>
                            <li>Agrega este dominio a "Authorized Domains":</li>
                        </ol>
                        <div className="mt-3 flex items-center gap-2 bg-black border border-zinc-700 p-2 rounded text-white font-mono select-all break-all">
                            {domainError}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 1. GOOGLE LOGIN */}
        <div className="space-y-3 mb-6">
            <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 text-[10px] group relative overflow-hidden disabled:opacity-50"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Continuar con Google
            </button>
        </div>

        <div className="relative flex py-2 items-center mb-6 opacity-50">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-600 text-[9px] uppercase tracking-widest">
                {isSignUp ? 'O Regístrate con correo' : 'O usa tu correo'}
            </span>
            <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* 2. EMAIL FORM */}
        <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
                <div className="animate-fade-in-up space-y-3">
                    <input 
                        type="text" 
                        name="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className="w-full bg-transparent border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder-zinc-700 font-mono text-base md:text-xs text-center tracking-wide hover:border-zinc-700 uppercase"
                        placeholder="NOMBRE COMPLETO"
                    />
                    <input 
                        type="tel" 
                        name="phone"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        className="w-full bg-transparent border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder-zinc-700 font-mono text-base md:text-xs text-center tracking-wide hover:border-zinc-700 uppercase"
                        placeholder="TELÉFONO (10 DÍGITOS)"
                        maxLength={10}
                    />
                </div>
            )}

            <input 
                type="email" 
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder-zinc-700 font-mono text-base md:text-xs text-center tracking-wide hover:border-zinc-700 uppercase"
                placeholder="CORREO ELECTRÓNICO"
            />
            <input 
                type="password" 
                name="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors placeholder-zinc-700 font-mono text-base md:text-xs text-center tracking-wide hover:border-zinc-700 uppercase"
                placeholder="CONTRASEÑA"
            />

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 font-bold uppercase tracking-widest py-4 transition-all flex items-center justify-center gap-2 text-[10px] mt-4 disabled:opacity-50"
            >
                {loading ? 'Procesando...' : (isSignUp ? 'Registrar Cuenta' : 'Acceder')}
                {isSignUp ? <UserPlus size={14} /> : <LogIn size={14} />}
            </button>
        </form>

        {/* TOGGLE LOGIN/REGISTER */}
        <div className="mt-6 text-center space-y-4">
            <button 
                onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setDomainError(null);
                    setShowGuestSuggestion(false);
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
  );
};

export default LoginModal;
