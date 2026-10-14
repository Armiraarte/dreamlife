// ==========================================
// 📸 CENTRAL DE IMÁGENES - DREAMLIFE
// ==========================================
// INSTRUCCIONES:
// 1. Sube tu imagen a internet (Imgur, Cloudinary, o tu hosting).
// 2. Copia el link directo de la imagen (debe terminar en .jpg o .png usualmente).
// 3. Reemplaza el link entre comillas abajo.
// ==========================================

export const APP_IMAGES = {
  // 1. LOGO DE LA MARCA
  logo: "/images/DREAM-LIFE-WHITE.png",

  // VIDEOS (en frontend/public/videos, mp4 H.264 sin audio).
  // Si un archivo no existe, la pagina se ve igual pero sin video.
  heroVideo: "/videos/home.mp4",              // Home: aparece en "flashazos" detras de GOD'S PLAN
  productVideo: "/videos/producto.mp4",       // Fondo de la pagina de Contacto
  productVideoPoster: "/videos/producto-poster.jpg",
  aboutVideo: "/videos/nosotros.mp4",           // Fondo de la pagina Nosotros
  aboutVideoPoster: "/videos/nosotros-poster.jpg",

  // 2. FOTO GIGANTE DEL HOME (Portada Principal)
  // Recomendado: Oscura, horizontal, alta calidad.
  hero: "/images/pv2.jpeg",
  
  // 3. FOTO DE LA SECCIÓN 'NOSOTROS' (About)
  about: "/images/pv2.jpeg",
  
  // 4. FOTO DE PERFIL POR DEFECTO (Para usuarios sin foto)
  defaultUser: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  
  // 5. FOTO GENÉRICA (Por si falla alguna imagen)
  placeholderProduct: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=200&auto=format&fit=crop"
};

// ==========================================
// 📂 PORTADAS DE CATEGORÍAS (Menú Principal)
// ==========================================
export const CATEGORY_IMAGES = {
  playeras: "/images/dreamlife2.jpeg", 
  hoodies: "https://images.unsplash.com/photo-1556906781-9a412961d289?q=80&w=2000&auto=format&fit=crop" 
};

// ==========================================
// 👕 GALERÍA DE PRODUCTOS
// ==========================================
export const PRODUCT_GALLERY = {
    // PRODUCTO: GOD'S PLAN OVERSIZED TEE
    // NOTA: La primera imagen de la lista será la PORTADA del producto.
    godsPlanTee: [
      "/images/playera.jpeg", // [6] Extra
       "/images/img5.jpg", // [6] Extra
       "/images/img2.jpg", // [3] DETALLE (Espalda/Textura)
       "/images/img3.jpg", // [4] MODELO (Puesto)
       "/images/img7.jpg", // [5] Extra
       "/images/img4.jpg"  // [7] Extra
    ]
};