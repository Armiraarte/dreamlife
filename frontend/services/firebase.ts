import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { app, firebaseProjectId } from "./firebaseApp";
import { auth } from "./firebaseAuth";

const db = getFirestore(app);

// Inicializacion segura de Storage (evita crash si falla la carga del script)
let storage;
try {
  storage = getStorage(app);
} catch (e) {
  console.warn("Firebase Storage no pudo iniciarse. La subida de imagenes estara deshabilitada.", e);
}

// Inicializacion segura de Analytics (evita crash por AdBlockers)
let analytics;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Firebase Analytics bloqueado. La app continuara funcionando.", e);
}

console.log("Firebase conectado con proyecto:", firebaseProjectId);

export { auth, db, storage, analytics };
