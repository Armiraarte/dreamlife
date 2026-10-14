import type { Product } from "./types";
import { PRODUCT_GALLERY } from "./imagenes_url";

// Base de la API Laravel. Vacio = mismo origen (en desarrollo Vite reenvia /api al backend).
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export const API_CONFIG = {
  base: `${API_BASE}/api`,

  // Catalogo
  productsEndpoint: `${API_BASE}/api/products`,

  // Checkout (Mercado Pago)
  checkoutEndpoint: `${API_BASE}/api/checkout`,
  checkoutConfirmEndpoint: `${API_BASE}/api/checkout/confirm`,

  // Rastreo publico por guia
  trackingEndpoint: `${API_BASE}/api/orders/track`,

  // Cliente (requiere token de Firebase)
  profileEndpoint: `${API_BASE}/api/me`,
  myOrdersEndpoint: `${API_BASE}/api/me/orders`,

  // Administracion (requiere token de admin)
  adminLoginEndpoint: `${API_BASE}/api/admin/login`,
  adminLogoutEndpoint: `${API_BASE}/api/admin/logout`,
  adminMeEndpoint: `${API_BASE}/api/admin/me`,
  adminOrdersEndpoint: `${API_BASE}/api/admin/orders`,
  adminProductsEndpoint: `${API_BASE}/api/admin/products`,
};

// Producto demo (fallback)
export const PRODUCTS: Product[] = [
  {
    id: "GP-TEE-BLK-V1",
    name: "GOD'S PLAN OVERSIZED TEE",
    price: 990.0,
    category: "Playeras",
    image: PRODUCT_GALLERY.godsPlanTee[0],
    gallery: PRODUCT_GALLERY.godsPlanTee,
    description:
      "El diseno captura ese instante entre el sacrificio y la gloria. La corona, simbolo de lo divino, se convierte en el reflejo de aquello que todos buscamos: proposito, poder y trascendencia.",
    colors: ["Black"],
    sizes: ["S", "M", "L"],
    variants: {
      S: 10,
      M: 20,
      L: 20,
    },
    details: {
      Material: "100% Algodon (305 grs)",
      Corte: "Semi Oversized",
      Tecnologia: "4 Tecnologias",
      Propiedades: "Anti-acaros, Tela fria, Antibacterial, Iones negativos",
    },
    stock: 50,
    sold: 1,
  },
];
