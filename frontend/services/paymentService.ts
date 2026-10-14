import { CartItem, ShippingDetails } from '../types';
import { API_CONFIG } from '../constants';
import { apiRequest } from './api';
import { auth } from './firebaseAuth';

type CheckoutResponse = {
  orderId: string;
  orderNumber: string;
  reference: string;
  total: number;
  init_point: string;
};

/**
 * Crea el pedido en el backend y devuelve la URL de pago de Mercado Pago.
 * Solo se envian variantes y cantidades: precios y total los calcula el servidor.
 */
export const initiateCheckout = async (items: CartItem[], shipping: ShippingDetails): Promise<string> => {
  const sinVariante = items.find((item) => !item.idVariante);
  if (sinVariante) {
    throw new Error(`No se encontro la talla de "${sinVariante.name}". Quitalo del carrito y vuelve a agregarlo.`);
  }

  // Si el cliente inicio sesion, el pedido queda ligado a su cuenta.
  let token: string | null = null;
  try {
    token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch {
    token = null;
  }

  const data = await apiRequest<CheckoutResponse>(API_CONFIG.checkoutEndpoint, {
    method: 'POST',
    token,
    body: {
      items: items.map((item) => ({ idVariante: Number(item.idVariante), cantidad: item.quantity })),
      cliente: {
        nombre: shipping.fullName.trim(),
        email: shipping.email.trim(),
        telefono: shipping.phone.trim() || undefined,
      },
      entrega: {
        cp: shipping.zipCode.trim(),
        estado: shipping.state.trim(),
        ciudad: shipping.city.trim(),
        colonia: shipping.colonia.trim(),
        calle: shipping.street.trim(),
        num_ext: (shipping.exteriorNumber || '').trim(),
        num_int: (shipping.interiorNumber || '').trim() || undefined,
        entre_calles: shipping.betweenStreets.trim() || undefined,
      },
    },
  });

  if (!data.init_point) {
    throw new Error('Mercado Pago no devolvio la liga de pago.');
  }

  return data.init_point;
};
