import React, { Suspense, lazy } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ShopOutletContext } from '../types';

const ProductCard = lazy(() => import('../components/ProductCard'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <Loader2 className="animate-spin text-white" size={40} />
  </div>
);

const ProductPage: React.FC = () => {
  const { id } = useParams();
  const { addToCart, products, isLoadingProducts } = useOutletContext<ShopOutletContext>();
  const product = products.find((p) => p.id === id);

  if (isLoadingProducts) return <Loading />;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-serif mb-4">Producto no encontrado</h2>
          <Link to="/shop" className="text-xs uppercase font-bold border-b border-white pb-1">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-zinc-950 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <Link
          to="/shop"
          className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors group w-fit"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Menú
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
      </Suspense>
    </div>
  );
};

export default ProductPage;
