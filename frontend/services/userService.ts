
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, User } from "firebase/auth";
import { db, storage } from "./firebase";
import { UserProfile } from "../types";

/**
 * Obtiene el perfil del usuario desde Firestore.
 * Si no existe, lo crea usando los datos básicos de la autenticación (Google/Email).
 */
export const getOrCreateUserProfile = async (user: User): Promise<UserProfile | null> => {
  if (!db) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Usuario Nuevo",
        photoURL: user.photoURL || "",
        phoneNumber: user.phoneNumber || "",
        role: "customer",
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error: any) {
    console.warn("⚠️ Error obteniendo perfil (Firestore API disabled/offline?):", error.message);
    // Retornamos un perfil "dummy" basado en el usuario de Auth para que la UI no falle
    return {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Usuario (Sin BD)",
        photoURL: user.photoURL || "",
        phoneNumber: user.phoneNumber || "",
        role: "customer",
        createdAt: new Date().toISOString()
      };
  }
};

/**
 * Actualiza los campos editables del perfil del usuario en Firestore.
 */
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  if (!db) throw new Error("Base de datos no conectada");
  
  try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
  } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
  }
};

/**
 * Sube una imagen de perfil a Firebase Storage y actualiza el usuario
 */
export const uploadProfileImage = async (user: User, file: File): Promise<string> => {
    if (!storage) throw new Error("El servicio de almacenamiento no está disponible temporalmente.");

    try {
        // Crear referencia: users/UID/profile.jpg
        const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}`);
        
        // Subir archivo
        const snapshot = await uploadBytes(storageRef, file);
        
        // Obtener URL pública
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 1. Actualizar Auth de Firebase (User object)
        await updateProfile(user, { photoURL: downloadURL });

        // 2. Actualizar Firestore (Database)
        if (db) {
            try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, { photoURL: downloadURL });
            } catch (dbError) {
                console.warn("No se pudo actualizar Firestore con la nueva imagen (API disabled?)");
            }
        }

        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};
