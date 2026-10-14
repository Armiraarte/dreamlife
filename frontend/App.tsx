import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SparkleOverlay from './components/SparkleOverlay';
import { AuthProvider } from './context/AuthContext';
import { fetchProductsFromDB, saveProductToDB } from './services/backend';
import type { Product, CartItem, ShippingDetails, ShopOutletContext } from './types';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HoodiesPage = lazy(() => import('./pages/HoodiesPage'));
const CartDrawer = lazy(() => import('./components/CartDrawer'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const TrackingModal = lazy(() => import('./components/TrackingModal'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));
const OrderSuccess = lazy(() => import('./components/OrderSuccess'));
const OrderTracker = lazy(() => import('./components/OrderTracker'));

const CART_STORAGE_KEY = 'dreamlife_cart';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <Loader2 className="animate-spin text-white" size={36} />
  </div>
);

// El carrito se guarda en el navegador para sobrevivir recargas y el regreso de Mercado Pago.
const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.cartId && i.quantity > 0) : [];
  } catch {
    return [];
  }
};

const Layout = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasOpenedCart, setHasOpenedCart] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // El stock viene de la BD: el backend lo descuenta cuando Mercado Pago aprueba el pago.
  useEffect(() => {
    fetchProductsFromDB().then((backendProducts) => {
      if (backendProducts.length > 0) setProducts(backendProducts);
      setIsLoadingProducts(false);
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Almacenamiento no disponible: el carrito vive solo en memoria.
    }
  }, [cartItems]);

  const openCart = useCallback(() => {
    setHasOpenedCart(true);
    setIsCartOpen(true);
  }, []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const handleUpsertProduct = async (newProduct: Product): Promise<boolean> => {
    try {
      const saved = await saveProductToDB(newProduct);
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
      });
      return true;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar en la base de datos.');
      return false;
    }
  };

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.cartId === item.cartId);
      if (existing) {
        return prev.map((i) => (i.cartId === item.cartId ? { ...i, quantity: Math.min(10, i.quantity + item.quantity) } : i));
      }
      return [...prev, item];
    });
    openCart();
  };

  const handleUpdateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, quantity: Math.max(1, Math.min(10, item.quantity + delta)) } : item)),
    );
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = useCallback(() => setCartItems([]), []);

  const handleCheckout = async (shippingData: ShippingDetails) => {
    setIsCheckingOut(true);
    try {
      const { initiateCheckout } = await import('./services/paymentService');
      const initPoint = await initiateCheckout(cartItems, shippingData);
      window.location.href = initPoint;
      return;
    } catch (error) {
      console.error('[checkout] Error iniciando checkout:', error);
      alert(error instanceof Error ? error.message : 'No se pudo iniciar el pago. Intenta nuevamente.');
    }
    setIsCheckingOut(false);
  };

  const proceedToCheckoutPage = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  // Paginas con su propio encabezado (sin menu ni pie de la tienda).
  const isSimpleLayout = ['/admin', '/checkout', '/order-confirmation'].some((p) => location.pathname.startsWith(p));
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const context: ShopOutletContext & { clearCart: () => void } = {
    cartItems,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    updateQuantity: handleUpdateQuantity,
    handleCheckout,
    isCheckingOut,
    openLoginModal: () => setIsLoginOpen(true),
    products,
    upsertProduct: handleUpsertProduct,
    isLoadingProducts,
    clearCart,
  };

  return (
    <div className={`min-h-screen selection:bg-white selection:text-black relative ${isSimpleLayout ? 'bg-gray-100 text-black' : 'bg-black text-white'}`}>
      {!isSimpleLayout && <div className="bg-noise"></div>}
      {!isSimpleLayout && <SparkleOverlay />}

      <div className="relative z-10 flex flex-col min-h-screen">
        {!isSimpleLayout && (
          <Navbar
            cartCount={cartCount}
            onCartClick={openCart}
            onLoginClick={() => setIsLoginOpen(true)}
            onTrackClick={() => setIsTrackingOpen(true)}
          />
        )}

        <main className="flex-1">
          {/* La clave por ruta reinicia la animacion de entrada en cada pagina. */}
          <div key={location.pathname} className="animate-fade-in">
            <Suspense fallback={<PageFallback />}>
              <Outlet context={context} />
            </Suspense>
          </div>
        </main>

        {!isSimpleLayout && <Footer onTrackClick={() => setIsTrackingOpen(true)} />}

        {hasOpenedCart && (
          <Suspense fallback={null}>
            <CartDrawer
              isOpen={isCartOpen}
              onClose={closeCart}
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveFromCart}
              onProceedToCheckout={proceedToCheckoutPage}
              products={products}
            />
          </Suspense>
        )}

        {isLoginOpen && (
          <Suspense fallback={null}>
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
          </Suspense>
        )}

        {isTrackingOpen && (
          <Suspense fallback={null}>
            <TrackingModal isOpen={isTrackingOpen} onClose={() => setIsTrackingOpen(false)} />
          </Suspense>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/hoodies" element={<HoodiesPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="account" element={<UserDashboard />} />
          <Route path="track-order" element={<OrderTracker />} />
          <Route path="order-confirmation/:orderId" element={<OrderSuccess />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
