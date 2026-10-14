
export interface ProductDetails {
  [key: string]: string;
}

export type Product = {
  id: string;
  skuBase?: string; // SKU base en BD (identifica el producto al guardarlo desde el admin)
  name: string;
  price: number;
  category: 'Playeras' | 'Hoodies';
  image: string;
  gallery?: string[]; 
  description: string;
  colors: string[];
  sizes: string[];
  // Mapa de stock por talla. Ej: { 'S': 10, 'M': 20 }
  variants?: { [key: string]: number };
  variantSkus?: { [key: string]: string };
  variantIds?: { [key: string]: string };
  details?: ProductDetails;
  stock: number; // Stock total (suma de variantes)
  sold: number;  
}

export type CartItem = Product & {
  cartId: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  idVariante?: string;
  sku?: string;
}

// Incluimos variaciones usadas en UI y mapeos de BD
export type OrderStatus = 
  'Pendiente' |
  'En espera' |
  'Pagado' |
  'Procesando' |
  'Enviado' |
  'Entregado' |
  'Cancelado' |
  'Reembolsado' |
  'Fallido';

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  betweenStreets: string;
  colonia: string;
  city: string;
  state: string;
  zipCode: string;
}

export type Order = {
  id: string; // idPedido en BD
  orderNumber: string; // ID legible ej: GDS-001
  reference?: string; // external_reference de Mercado Pago
  customer: string;
  email: string;
  phone?: string;
  total: number;
  status: OrderStatus;
  date: string; // ISO String
  items: {
      title: string;
      quantity: number;
      price: number;
      size: string;
      color: string;
      sku?: string;
      image?: string;
  }[];
  address?: string; // Dirección de envío
  paymentId?: string; // ID de Mercado Pago
  preferenceId?: string;
  trackingNumber?: string; // Guía logística
  shippingCarrier?: string;
  trackingUrl?: string;
}

/** Datos y acciones que el Layout comparte con las paginas (useOutletContext). */
export interface ShopOutletContext {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  handleCheckout: (details: ShippingDetails) => void;
  isCheckingOut: boolean;
  openLoginModal: () => void;
  products: Product[];
  upsertProduct: (newProduct: Product) => Promise<boolean>;
  isLoadingProducts: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: string;
  role: 'customer' | 'admin';
}
