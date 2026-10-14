import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useOutletContext } from "react-router-dom";
import { CheckCircle, ShoppingBag, ArrowRight, ShieldCheck, Copy, Clock, XCircle, Loader2 } from "lucide-react";
import { confirmCheckout } from "../services/backend";
import type { Order } from "../types";

// Mercado Pago agrega sus parametros a la URL de regreso: pueden quedar dentro
// del hash (#/order-confirmation/...?payment_id=) o antes de el (?payment_id=...#/...).
const readPaymentId = (hashSearch: string): string | null => {
  for (const search of [hashSearch, window.location.search]) {
    const params = new URLSearchParams(search);
    const id = params.get("payment_id") || params.get("collection_id");
    if (id && id !== "null") return id;
  }
  return null;
};

const MAX_REINTENTOS = 5;

const OrderSuccess: React.FC = () => {
  const { orderId: reference } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useOutletContext<{ clearCart?: () => void }>() || {};

  useEffect(() => {
    if (!reference) return;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;
    const paymentId = readPaymentId(location.search);

    const consultar = async (intento: number) => {
      try {
        const result = await confirmCheckout(reference, paymentId);
        if (cancelado) return;
        setOrder(result);
        setError("");
        // Si el pago sigue en proceso, vuelve a consultar unos segundos despues.
        if (result.status === "Pendiente" && intento < MAX_REINTENTOS) {
          timer = setTimeout(() => consultar(intento + 1), 4000);
        }
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudo consultar tu pedido.");
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    };

    consultar(1);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [reference, location.search]);

  const pagado = order && ["Pagado", "Procesando", "Enviado", "Entregado"].includes(order.status);

  // Pago confirmado: el carrito ya se compro.
  useEffect(() => {
    if (pagado) clearCart?.();
  }, [pagado, clearCart]);
  const fallido = order && ["Fallido", "Cancelado", "Reembolsado"].includes(order.status);

  const icono = isLoading ? (
    <Loader2 size={40} className="text-gray-400 animate-spin" />
  ) : pagado ? (
    <CheckCircle size={40} className="text-emerald-500" />
  ) : fallido || error ? (
    <XCircle size={40} className="text-red-500" />
  ) : (
    <Clock size={40} className="text-amber-500" />
  );

  const titulo = isLoading
    ? "Verificando pago..."
    : pagado
      ? "Pago exitoso!"
      : fallido
        ? "Pago no completado"
        : error
          ? "Pedido no encontrado"
          : "Pago en proceso";

  const subtitulo = isLoading
    ? "Estamos confirmando tu pago con Mercado Pago"
    : pagado
      ? "Tu orden ha sido procesada correctamente"
      : fallido
        ? "El pago fue rechazado o cancelado"
        : error
          ? error
          : "Te avisaremos por correo en cuanto se acredite";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-emerald-200/50 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-96 h-96 bg-slate-200 blur-3xl rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 md:p-12 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100">
          {icono}
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-black uppercase tracking-tight mb-2 text-gray-900">
          {titulo}
        </h1>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-8">{subtitulo}</p>

        {order && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-left relative group shadow-inner">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Numero de orden</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl text-gray-900 font-bold">{order.orderNumber}</span>
              <button
                onClick={() => navigator.clipboard.writeText(order.orderNumber)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
                title="Copiar numero de orden"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-700 font-mono">Total: ${order.total.toFixed(2)} MXN</p>
            {pagado && (
              <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-600 font-mono bg-emerald-100 w-fit px-2 py-1 rounded">
                <ShieldCheck size={12} />
                Pago verificado con Mercado Pago
              </div>
            )}
          </div>
        )}

        {pagado && (
          <p className="text-sm text-gray-700 leading-relaxed mb-8">
            Hemos enviado un correo de confirmacion con los detalles de tu pedido.
            Te notificaremos cuando tu paquete este en camino.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {fallido ? (
            <Link
              to="/checkout"
              className="w-full bg-gray-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-black transition-all rounded-sm flex items-center justify-center gap-2"
            >
              Intentar de nuevo <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              to="/account"
              className="w-full bg-gray-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-black transition-all rounded-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} /> Ver mis Pedidos
            </Link>
          )}
          <Link
            to="/shop"
            className="w-full bg-white border border-gray-300 text-gray-900 py-4 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-all rounded-sm flex items-center justify-center gap-2"
          >
            Seguir Comprando <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
