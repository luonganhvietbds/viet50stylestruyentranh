'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User as FirebaseUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// User roles for the platform
export type UserRole = 'free' | 'silver' | 'gold' | 'admin';

export interface AppUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    role: UserRole;
    emailVerified: boolean;
    createdAt: Date;
}

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    error: string | null;

    // Auth methods
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;

    // Helpers
    isAdmin: boolean;
    isPremium: boolean; // silver or gold
    isGold: boolean;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user data from Firestore
    const fetchUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<AppUser> => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || data.displayName || null,
                photoURL: firebaseUser.photoURL || data.photoURL || null,
                role: data.role || 'free',
                emailVerified: firebaseUser.emailVerified,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        } else {
            // New user - create document
            const newUser: Omit<AppUser, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || null,
                photoURL: firebaseUser.photoURL || null,
                role: 'free',
                emailVerified: firebaseUser.emailVerified,
                createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newUser);
            return { ...newUser, createdAt: new Date() } as AppUser;
        }
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            try {
                if (firebaseUser) {
                    const appUser = await fetchUserData(firebaseUser);
                    setUser(appUser);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth state error:', err);
                setError('Lỗi xác thực. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [fetchUserData]);

    // Sign in with email/password
    const signIn = useCallback(async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign up with email/password
    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        setError(null);
        setLoading(true);
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName });
            await sendEmailVerification(credential.user);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        setError(null);
        try {
            await firebaseSignOut(auth);
            setUser(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng xuất thất bại';
            setError(message);
            throw err;
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const value: AuthContextType = {
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isAdmin: user?.role === 'admin',
        isPremium: user?.role === 'silver' || user?.role === 'gold' || user?.role === 'admin',
        isGold: user?.role === 'gold' || user?.role === 'admin',
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
