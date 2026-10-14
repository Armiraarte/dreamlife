
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    User, 
    onAuthStateChanged, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebaseAuth';
import { APP_IMAGES } from '../imagenes_url';
import { syncCustomerProfile } from '../services/backend';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    registerWithEmail: (name: string, email: string, pass: string, phone?: string) => Promise<void>;
    loginAsGuest: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // Only update if we are not in guest mode
            if (currentUser) {
                setUser(currentUser);
            } else {
                // Conserva al invitado: Firebase no lo conoce.
                setUser(prev => (prev?.isAnonymous ? prev : null));
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []); // eslint-disable-line

    const loginWithGoogle = async () => {
        if (!auth) throw new Error("Firebase no configurado");
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        // Registra/actualiza al cliente en la BD (el backend toma uid y correo del token).
        syncCustomerProfile(cred.user);
    };

    const loginWithEmail = async (email: string, pass: string) => {
        if (!auth) throw new Error("Firebase no configurado");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const registerWithEmail = async (name: string, email: string, pass: string, phone: string = ''): Promise<void> => {
        if (!auth) throw new Error("Firebase no configurado");
        // 1) Registro en Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (name) {
            await updateProfile(cred.user, { displayName: name }).catch(() => undefined);
        }
        // 2) Registro del cliente en la BD. La contrasena nunca sale de Firebase.
        await syncCustomerProfile(cred.user, { nombre: name, telefono: phone });
    };

    const loginAsGuest = () => {
        const guestUser: any = {
            uid: 'guest-demo-123',
            displayName: 'Guest Architect',
            email: 'guest@dreamlife.com',
            photoURL: APP_IMAGES.defaultUser,
            phoneNumber: '+52 55 1234 5678',
            emailVerified: true,
            isAnonymous: true,
        };
        setUser(guestUser);
    };

    const logout = async () => {
        if (user?.isAnonymous) {
            setUser(null);
            return;
        }
        if (!auth) return;
        await signOut(auth);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, loginAsGuest, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
