
import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserRole, UserProfile } from '../types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  
  const isMounted = useRef(true);

  // 1. Lắng nghe trạng thái đăng nhập (Auth State)
  useEffect(() => {
    isMounted.current = true;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!isMounted.current) return;

      if (user) {
        if (!user.emailVerified) {
          setVerificationEmail(user.email);
          await firebaseSignOut(auth);
          setCurrentUser(null);
          setLoading(false);
        } else {
          setCurrentUser(user);
          setVerificationEmail(null);
          // Lưu ý: Chưa set loading = false ở đây, đợi Firestore trả về Role
        }
      } else {
        setCurrentUser(null);
        setUserRole('free');
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribeAuth();
    };
  }, []);

  // 2. Lắng nghe Profile Real-time (Chỉ chạy khi có User)
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const userDocRef = doc(db, 'users', currentUser.uid);

    // Sử dụng onSnapshot thay vì getDoc để cập nhật quyền ngay lập tức
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (!isMounted.current) return;

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        
        // BẢO MẬT: Kiểm tra nếu user bị Ban thì đá ra ngay lập tức
        if (data.status === 'banned') {
          firebaseSignOut(auth).then(() => {
            alert("Tài khoản của bạn đã bị khóa quyền truy cập bởi quản trị viên.");
            window.location.reload();
          });
          return;
        }

        setUserRole(data.role);
        setIsAdmin(data.role === 'admin');
      } else {
        // Fallback cho user mới chưa có profile
        setUserRole('free');
        setIsAdmin(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Lỗi đồng bộ Profile:", error);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [currentUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // State sẽ tự cập nhật nhờ onAuthStateChanged
    } catch (e) {
      console.error("Error signing out", e);
    }
  }, []);

  return {
    currentUser,
    userRole,
    isAdmin,
    setIsAdmin, // Vẫn giữ hàm này để AdminLogin có thể update state cục bộ nếu cần
    loading,
    verificationEmail,
    setVerificationEmail,
    handleSignOut
  };
}
