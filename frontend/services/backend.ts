import type { User } from 'firebase/auth';
import { API_CONFIG } from '../constants';
import { APP_IMAGES } from '../imagenes_url';
import type { Product, Order, OrderStatus } from '../types';
import { apiRequest, ApiError } from './api';

/**
 * Servicios contra la API Laravel (catalogo, pedidos, cliente y admin).
 */

type CacheEntry<T> = {
    data: T;
    expiresAt: number;
};

type FetchOptions = {
    forceRefresh?: boolean;
};

const PRODUCTS_CACHE_TTL_MS = 60_000;

let productsCache: CacheEntry<Product[]> | null = null;
let productsRequest: Promise<Product[]> | null = null;

const isFresh = <T,>(entry: CacheEntry<T> | null) => !!entry && entry.expiresAt > Date.now();

const invalidateProductCaches = () => {
    productsCache = null;
    productsRequest = null;
};

// ---------------------------------------------------------------------------
// Sesion de administrador (token Bearer de Sanctum, solo en esta pestana)
// ---------------------------------------------------------------------------

const ADMIN_TOKEN_KEY = 'dreamlife_admin_token';

const readAdminToken = (): string | null => {
    try {
        return sessionStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
        return null;
    }
};

const storeAdminToken = (token: string | null) => {
    try {
        if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
        // Almacenamiento bloqueado: la sesion dura mientras la pagina este abierta.
    }
};

const adminToken = (): string => {
    const token = readAdminToken();
    if (!token) throw new ApiError('La sesion de administrador expiro.', 401);
    return token;
};

/** Ejecuta una peticion de admin; si el token ya no sirve, lo descarta. */
const adminRequest = async <T,>(url: string, options: Parameters<typeof apiRequest>[1] = {}): Promise<T> => {
    try {
        return await apiRequest<T>(url, { ...options, token: adminToken() });
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) storeAdminToken(null);
        throw error;
    }
};

/** Inicia sesion de admin. Devuelve null si entro, o el mensaje de error. */
export const loginAdmin = async (usuario: string, clave: string): Promise<string | null> => {
    try {
        const data = await apiRequest<{ token: string }>(API_CONFIG.adminLoginEndpoint, {
            method: 'POST',
            body: { usuario, clave },
        });
        storeAdminToken(data.token);
        return null;
    } catch (error) {
        if (error instanceof ApiError && error.status === 429) return 'Demasiados intentos. Espera un minuto.';
        if (error instanceof ApiError && error.status !== 0) return error.message;
        return 'No se pudo conectar con el servidor.';
    }
};

/** Comprueba si hay una sesion de admin valida guardada. */
export const hasAdminSession = async (): Promise<boolean> => {
    if (!readAdminToken()) return false;
    try {
        await adminRequest(API_CONFIG.adminMeEndpoint);
        return true;
    } catch {
        return false;
    }
};

export const logoutAdmin = async (): Promise<void> => {
    try {
        if (readAdminToken()) await adminRequest(API_CONFIG.adminLogoutEndpoint, { method: 'POST' });
    } catch {
        // El token se descarta igual.
    } finally {
        storeAdminToken(null);
    }
};

// ---------------------------------------------------------------------------
// Catalogo
// ---------------------------------------------------------------------------

const mapCategory = (cat: any): Product['category'] => (Number(cat) === 2 ? 'Hoodies' : 'Playeras');

const mapProduct = (item: any): Product => {
    const photos: any[] = Array.isArray(item.fotos) ? item.fotos : [];
    const principal = photos.find((p) => p.is_principal) || photos[0];
    const gallery = photos.map((p) => p.url).filter(Boolean);
    const variants: any[] = Array.isArray(item.variantes) ? item.variantes : [];

    const bySize = <T,>(pick: (v: any) => T) =>
        variants.reduce<Record<string, T>>((acc, v: any) => {
            if (v.talla) acc[v.talla] = pick(v);
            return acc;
        }, {});

    const stockBySize = variants.reduce<Record<string, number>>((acc, v: any) => {
        if (v.talla) acc[v.talla] = (acc[v.talla] || 0) + (Number(v.stock) || 0);
        return acc;
    }, {});

    const sizes = Array.from(new Set(variants.map((v) => v.talla).filter(Boolean))) as string[];
    const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];
    const details = item.detalles && typeof item.detalles === 'object' && Object.keys(item.detalles).length
        ? item.detalles
        : undefined;

    return {
        id: String(item.idProducto),
        skuBase: item.sku_base || undefined,
        name: item.nombre,
        price: Number(item.precio),
        category: mapCategory(item.categoria),
        image: principal?.url || APP_IMAGES.placeholderProduct,
        gallery: gallery.length ? gallery : [APP_IMAGES.placeholderProduct],
        description: item.descripcion || '',
        colors: colors.length ? colors : ['Unico'],
        sizes,
        variants: stockBySize,
        variantSkus: bySize((v) => String(v.sku)),
        variantIds: bySize((v) => String(v.idVariante)),
        details,
        stock: Object.values(stockBySize).reduce((a, b) => a + b, 0),
        sold: 0,
    };
};

export const fetchProductsFromDB = async (options: FetchOptions = {}): Promise<Product[]> => {
    const { forceRefresh = false } = options;

    if (!forceRefresh && isFresh(productsCache)) return productsCache!.data;
    if (!forceRefresh && productsRequest) return productsRequest;

    productsRequest = (async () => {
        try {
            const rows = await apiRequest<any[]>(API_CONFIG.productsEndpoint);
            const products = (Array.isArray(rows) ? rows : []).map(mapProduct);
            productsCache = { data: products, expiresAt: Date.now() + PRODUCTS_CACHE_TTL_MS };
            return products;
        } catch (error) {
            console.error('No se pudieron cargar los productos:', error);
            return [];
        } finally {
            productsRequest = null;
        }
    })();

    return productsRequest;
};

/** Crea o actualiza un producto (admin). Devuelve el producto guardado. */
export const saveProductToDB = async (product: Product): Promise<Product> => {
    const saved = await adminRequest<any>(API_CONFIG.adminProductsEndpoint, {
        method: 'POST',
        body: {
            sku_base: product.skuBase || product.id,
            nombre: product.name,
            precio: product.price,
            categoria: product.category,
            descripcion: product.description,
            color: product.colors[0] || 'Black',
            stock: product.variants || {},
            imagenes: product.gallery || [],
        },
    });
    invalidateProductCaches();
    return mapProduct(saved);
};

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

// Estatus de BD (CREADO, PAGADO, ENVIADO, ENTREGADO, CANCELADO) -> UI
const mapDbStatusToUi = (status: string, paymentStatus?: string): OrderStatus => {
    switch ((status || '').toUpperCase()) {
        case 'PAGADO':
            return 'Pagado';
        case 'ENVIADO':
            return 'Enviado';
        case 'ENTREGADO':
            return 'Entregado';
        case 'CANCELADO':
            return (paymentStatus || '').toUpperCase() === 'REEMBOLSADO' ? 'Reembolsado' : 'Cancelado';
        default:
            return (paymentStatus || '').toUpperCase() === 'RECHAZADO' ? 'Fallido' : 'Pendiente';
    }
};

// Estatus de UI -> BD
const mapUiStatusToDb = (status: OrderStatus): string => {
    switch (status) {
        case 'Pagado':
        case 'Procesando':
            return 'PAGADO';
        case 'Enviado':
            return 'ENVIADO';
        case 'Entregado':
            return 'ENTREGADO';
        case 'Cancelado':
        case 'Reembolsado':
            return 'CANCELADO';
        default:
            return 'CREADO';
    }
};

const mapOrder = (item: any): Order => ({
    id: String(item.id),
    orderNumber: item.orderNumber,
    reference: item.reference || undefined,
    customer: item.customer || 'Cliente',
    email: item.email || '',
    phone: item.phone || '',
    total: Number(item.total || 0),
    status: mapDbStatusToUi(item.status, item.paymentStatus),
    date: item.date || new Date().toISOString(),
    items: (Array.isArray(item.items) ? item.items : []).map((it: any) => ({
        title: it.title || 'Producto',
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
        size: it.size || '',
        color: it.color || '',
        sku: it.sku || undefined,
        image: it.image || undefined,
    })),
    address: item.address || '',
    paymentId: item.paymentId || '',
    preferenceId: item.preferenceId || '',
    trackingNumber: item.trackingNumber || '',
    shippingCarrier: item.shippingCarrier || '',
    trackingUrl: item.trackingUrl || '',
});

/** Todos los pedidos (admin). */
export const fetchOrdersFromDB = async (): Promise<Order[]> => {
    const rows = await adminRequest<any[]>(API_CONFIG.adminOrdersEndpoint);
    return (Array.isArray(rows) ? rows : []).map(mapOrder);
};

/** Actualiza estatus y/o guia (admin). Al pasar a "Enviado" el backend envia el correo. */
export const updateOrderInDB = async (
    orderId: string,
    status: OrderStatus,
    shipping: { trackingNumber?: string; carrier?: string; trackingUrl?: string } = {},
): Promise<{ order: Order; emailSent: boolean }> => {
    const data = await adminRequest<any>(`${API_CONFIG.adminOrdersEndpoint}/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        body: {
            status: mapUiStatusToDb(status),
            tracking_number: shipping.trackingNumber || undefined,
            shipping_carrier: shipping.carrier || undefined,
            tracking_url: shipping.trackingUrl || undefined,
        },
    });
    return { order: mapOrder(data), emailSent: Boolean(data.email_sent) };
};

/** Pedidos del cliente con sesion de Firebase. */
export const fetchUserOrdersFromDB = async (user: User | null): Promise<Order[]> => {
    if (!user || typeof user.getIdToken !== 'function') return [];
    try {
        const token = await user.getIdToken();
        const rows = await apiRequest<any[]>(API_CONFIG.myOrdersEndpoint, { token });
        return (Array.isArray(rows) ? rows : []).map(mapOrder);
    } catch (error) {
        console.error('No se pudieron cargar tus pedidos:', error);
        return [];
    }
};

/** Rastreo publico por numero de guia. */
export const fetchOrderByTracking = async (tracking: string): Promise<Order | null> => {
    const clean = tracking.trim();
    if (!clean) return null;
    try {
        return mapOrder(await apiRequest<any>(`${API_CONFIG.trackingEndpoint}/${encodeURIComponent(clean)}`));
    } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) {
            console.error('Error rastreando pedido:', error);
        }
        return null;
    }
};

/**
 * Consulta el pedido al volver de Mercado Pago. Si llega el payment_id, el
 * backend verifica el pago directamente con Mercado Pago.
 */
export const confirmCheckout = async (reference: string, paymentId?: string | null): Promise<Order> => {
    const data = await apiRequest<any>(API_CONFIG.checkoutConfirmEndpoint, {
        method: 'POST',
        body: { reference, payment_id: paymentId && /^\d+$/.test(paymentId) ? paymentId : undefined },
    });
    return mapOrder(data);
};

// ---------------------------------------------------------------------------
// Perfil del cliente
// ---------------------------------------------------------------------------

/** Registra/actualiza el cliente en la BD. El uid y correo salen del token. */
export const syncCustomerProfile = async (user: User, data: { nombre?: string; telefono?: string } = {}): Promise<void> => {
    if (typeof user.getIdToken !== 'function') return;
    try {
        const token = await user.getIdToken();
        await apiRequest(API_CONFIG.profileEndpoint, {
            method: 'POST',
            token,
            body: {
                nombre: data.nombre || user.displayName || undefined,
                telefono: data.telefono || undefined,
            },
        });
    } catch (error) {
        console.warn('No se pudo sincronizar el perfil con el servidor:', error);
    }
};
