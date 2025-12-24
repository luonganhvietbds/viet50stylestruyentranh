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
    sendPasswordResetEmail,
    updateProfile,
    confirmPasswordReset,
    verifyPasswordResetCode,
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
    successMessage: string | null;

    // Auth methods
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;

    // Password reset
    resetPassword: (email: string) => Promise<void>;
    confirmReset: (oobCode: string, newPassword: string) => Promise<void>;
    verifyResetCode: (oobCode: string) => Promise<string>;

    // Email verification
    resendVerificationEmail: () => Promise<void>;

    // Helpers
    isAdmin: boolean;
    isPremium: boolean; // silver or gold
    isGold: boolean;
    clearError: () => void;
    clearSuccessMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to translate Firebase errors to Vietnamese
function translateFirebaseError(errorCode: string): string {
    const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.',
        'auth/invalid-email': 'Email không hợp lệ. Vui lòng kiểm tra lại.',
        'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được kích hoạt.',
        'auth/weak-password': 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn (ít nhất 6 ký tự).',
        'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa. Liên hệ hỗ trợ để biết thêm chi tiết.',
        'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
        'auth/wrong-password': 'Mật khẩu không chính xác. Vui lòng thử lại.',
        'auth/invalid-credential': 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra email và mật khẩu.',
        'auth/too-many-requests': 'Quá nhiều lần thử không thành công. Vui lòng thử lại sau.',
        'auth/popup-closed-by-user': 'Cửa sổ đăng nhập đã bị đóng. Vui lòng thử lại.',
        'auth/cancelled-popup-request': 'Yêu cầu đăng nhập đã bị hủy.',
        'auth/popup-blocked': 'Cửa sổ popup bị chặn. Vui lòng cho phép popup và thử lại.',
        'auth/network-request-failed': 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
        'auth/expired-action-code': 'Link đặt lại mật khẩu đã hết hạn.',
        'auth/invalid-action-code': 'Link đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.',
        'auth/requires-recent-login': 'Vui lòng đăng nhập lại để thực hiện thao tác này.',
    };

    return errorMessages[errorCode] || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setSuccessMessage(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setSuccessMessage('Đăng nhập thành công!');
        } catch (err: unknown) {
            const errorCode = (err as { code?: string })?.code || '';
            setError(translateFirebaseError(errorCode));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign up with email/password
    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName });
            await sendEmailVerification(credential.user);
            setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        } catch (err: unknown) {
            const errorCode = (err as { code?: string })?.code || '';
            setError(translateFirebaseError(errorCode));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign in with Google
    const signInWithGoogle = useCallback(async () => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            setSuccessMessage('Đăng nhập Google thành công!');
        } catch (err: unknown) {
            const errorCode = (err as { code?: string })?.code || '';
            setError(translateFirebaseError(errorCode));
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
            setSuccessMessage('Đăng xuất thành công!');
        } catch (err: unknown) {
            const errorCode = (err as { code?: string })?.code || '';
            setError(translateFirebaseError(errorCode));
            throw err;
        }
    }, []);

    // Reset password - sends email
    const resetPassword = useCallback(async (email: string) => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage('Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.');
        } catch (err: unknown) {
            const errorCode = (err as { code?: string })?.code || '';
            setError(translateFirebaseError(errorCode));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Confirm password reset with code
    const confirmReset = useCallback(async (oobCode: string, newPassword: string) => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccessMessage('Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.');
        } catch (err: unknown) {
            const errorCode = (err as { code?: string })?.code || '';
            setError(translateFirebaseError(errorCode));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Verify password reset code
    const verifyResetCode = useCallback(async (oobCode: string): Promise<string> => {
        setError(null);
        try {
            return await verifyPasswordResetCode(auth, oobCode);
        } catch (err: unknown) {
            const errorCode = (err as { code?: string })?.code || '';
            setError(translateFirebaseError(errorCode));
            throw err;
        }
    }, []);

    // Resend verification email
    const resendVerificationEmail = useCallback(async () => {
        setError(null);
        setSuccessMessage(null);
        if (auth.currentUser) {
            try {
                await sendEmailVerification(auth.currentUser);
                setSuccessMessage('Email xác thực đã được gửi lại!');
            } catch (err: unknown) {
                const errorCode = (err as { code?: string })?.code || '';
                setError(translateFirebaseError(errorCode));
                throw err;
            }
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);
    const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

    const value: AuthContextType = {
        user,
        loading,
        error,
        successMessage,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        confirmReset,
        verifyResetCode,
        resendVerificationEmail,
        isAdmin: user?.role === 'admin',
        isPremium: user?.role === 'silver' || user?.role === 'gold' || user?.role === 'admin',
        isGold: user?.role === 'gold' || user?.role === 'admin',
        clearError,
        clearSuccessMessage,
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
