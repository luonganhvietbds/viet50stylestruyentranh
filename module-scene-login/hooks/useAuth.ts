
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { useAppStore } from '../store';
import { AppUser } from '../types';

export const useAuth = () => {
  const setUser = useAppStore((state) => state.setUser);
  const setLoadingAuth = useAppStore((state) => state.setLoadingAuth);
  const setVerificationPending = useAppStore((state) => state.setVerificationPending);

  useEffect(() => {
    // If auth failed to initialize (e.g. missing keys), stop loading and set no user
    if (!auth) {
      setUser(null);
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 1. Fetch User Profile & Role from Firestore FIRST
          let role: AppUser['role'] = 'free';
          let createdAt = undefined;
          let updatedAt = undefined;

          if (db) {
             try {
               const userDocRef = doc(db, 'users', firebaseUser.uid);
               const userDoc = await getDoc(userDocRef);
               
               if (userDoc.exists()) {
                 const data = userDoc.data();
                 role = data.role || 'free';
                 createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt;
                 updatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt;
               }
             } catch (e) {
               console.error("Error fetching user profile from Firestore:", e);
             }
          }

          // 2. Enforce Email Verification (EXCEPT FOR ADMINS OR YOUR SPECIFIC EMAIL)
          // Allow specific email bypass for safety: luonganhvietbds@gmail.com
          const isAdmin = role === 'admin';
          const isHardcodedAdmin = firebaseUser.email === 'luonganhvietbds@gmail.com';

          if (!firebaseUser.emailVerified && !isAdmin && !isHardcodedAdmin) {
             setVerificationPending(true, firebaseUser.email);
             // We do not set the user in the global store, keeping them 'logged out' of the app UI
             setUser(null);
             setLoadingAuth(false);
             return;
          }

          // 3. Construct AppUser Object
          const appUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: role,
            createdAt: createdAt,
            updatedAt: updatedAt
          };
          
          // 4. Update Store
          setUser(appUser);
          setVerificationPending(false, null);
        } else {
          // User is signed out
          setUser(null);
          setVerificationPending(false, null);
        }
      } catch (error) {
        console.error("Auth State Change Error:", error);
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoadingAuth, setVerificationPending]);
};
