import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, User, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_IMAGES } from '../imagenes_url';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onLoginClick: () => void;
  onTrackClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onLoginClick, onTrackClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cierra el menu movil al cambiar de pagina.
  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  // Mientras el menu movil esta abierto: sin scroll de fondo y cierre con Escape.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMobileMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isMobileMenuOpen]);

  const handleUserClick = () => {
    if (user) {
      navigate('/account');
    } else {
      onLoginClick();
    }
  };

  const isHomePage = location.pathname === '/';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/shop') return location.pathname.startsWith('/shop') || location.pathname.startsWith('/product');
    return location.pathname === path;
  };

  const getLinkClass = (path: string) =>
    isActive(path)
      ? 'relative text-white scale-105 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
      : 'relative text-gray-500 hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]';

  const mobileLinks = [
    { to: '/', label: 'INICIO' },
    { to: '/shop', label: "GOD'S PLAN" },
    { to: '/about', label: 'NOSOTROS' },
    { to: '/contact', label: 'CONTACTO' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled || !isHomePage || isMobileMenuOpen ? 'bg-black/90 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden text-white -ml-2 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="block w-28 md:w-32" aria-label="DREAMLIFE, ir al inicio">
            <img src={APP_IMAGES.logo} alt="DREAMLIFE" className="w-full h-auto object-contain" />
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-bold tracking-[0.2em] uppercase">
          <Link to="/" className={getLinkClass('/')}>INICIO</Link>
          <Link to="/shop" className={getLinkClass('/shop')}>GOD'S PLAN</Link>
          <Link to="/about" className={getLinkClass('/about')}>NOSOTROS</Link>
          <Link to="/contact" className={getLinkClass('/contact')}>CONTACTO</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onTrackClick}
            className="p-2 text-white hover:text-gray-300 transition-all hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] hidden md:block"
            aria-label="Rastrear pedido"
            title="Rastrear Pedido"
          >
            <Package size={22} />
          </button>

          <button
            onClick={handleUserClick}
            className="p-2 text-white hover:text-gray-300 transition-all hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
            aria-label={user ? 'Mi cuenta' : 'Iniciar sesión'}
            title={user ? 'Mi Cuenta' : 'Iniciar Sesión'}
          >
            {user && user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full border border-white/50" />
            ) : (
              <User size={22} />
            )}
          </button>

          <button
            onClick={onCartClick}
            className="relative p-2 text-white hover:text-gray-300 hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all"
            aria-label={`Carrito, ${cartCount} artículos`}
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="absolute top-0 right-0 bg-white text-black text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center animate-pop"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-black border-t border-white/10 p-6 flex flex-col gap-6 animate-fade-in lg:hidden h-screen z-40">
          {mobileLinks.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-2xl font-bold uppercase tracking-widest hover:text-white animate-fade-in-up ${isActive(link.to) ? 'text-white' : 'text-gray-500'}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onTrackClick();
            }}
            className="text-2xl font-bold uppercase tracking-widest hover:text-white flex items-center gap-2 text-gray-500 text-left animate-fade-in-up"
            style={{ animationDelay: '240ms' }}
          >
            <Package size={24} /> RASTREAR PEDIDO
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleUserClick();
            }}
            className="text-2xl font-bold text-left text-gray-500 uppercase tracking-widest hover:text-white flex items-center gap-2 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <User size={24} /> {user ? 'Mi Cuenta' : 'Iniciar Sesión'}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
