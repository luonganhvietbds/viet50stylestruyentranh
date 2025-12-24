
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { createUserProfile } from '../services/db';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification, 
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { User, Mail, Lock, Image as ImageIcon, ArrowRight, Loader2, AlertCircle, BookOpen, MailCheck, KeyRound, Shield } from 'lucide-react';

interface Props {
  verificationEmail: string | null;
  setVerificationEmail: (email: string | null) => void;
  onAdminClick?: () => void;
}

const Auth: React.FC<Props> = ({ verificationEmail, setVerificationEmail, onAdminClick }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup only fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSentEmail(email);
    } catch (err: any) {
      console.error("Reset password error:", err);
      let msg = "Failed to send reset email.";
      if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Create user profile in Firestore
      await createUserProfile(result.user, result.user.displayName || undefined);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      
      let msg = err.message;
      
      // Xử lý các lỗi phổ biến bằng tiếng Việt/Hướng dẫn cụ thể
      if (err.code === 'auth/unauthorized-domain') {
        msg = "Lỗi tên miền: Domain này chưa được cấp quyền trong Firebase Console (Authentication -> Settings -> Authorized Domains).";
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = "Bạn đã hủy đăng nhập Google.";
      } else if (err.code === 'auth/popup-blocked') {
        msg = "Trình duyệt chặn cửa sổ popup. Vui lòng cho phép popup để đăng nhập.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = "Yêu cầu đăng nhập bị hủy do có yêu cầu khác đè lên.";
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Check verification
        if (!userCredential.user.emailVerified) {
          try {
            await sendEmailVerification(userCredential.user);
          } catch (verifyError: any) {
            console.warn("Could not send verification email", verifyError);
          }
          await signOut(auth);
          setVerificationEmail(userCredential.user.email);
        } else {
           // Create/Update profile on login just in case
           await createUserProfile(userCredential.user);
        }
      } else {
        // Registration
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update display name if provided
        if (name) {
          await updateProfile(userCredential.user, {
            displayName: name
          });
        }

        // --- FIRESTORE INTEGRATION ---
        // Create the user document in Firestore
        await createUserProfile(userCredential.user, name);

        // Send Verification Email
        await sendEmailVerification(userCredential.user);
        
        // Sign out immediately
        await signOut(auth);
        
        // Show verification screen
        setVerificationEmail(userCredential.user.email);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = "An unexpected error occurred.";
      const errorCode = err.code;
      
      if (isLogin) {
         if (
            errorCode === 'auth/invalid-credential' || 
            errorCode === 'auth/user-not-found' || 
            errorCode === 'auth/wrong-password' || 
            errorCode === 'auth/invalid-email' ||
            errorCode === 'auth/invalid-login-credentials'
         ) {
           msg = "Email hoặc mật khẩu không chính xác.";
         } else {
           msg = err.message;
         }
      } else {
         if (errorCode === 'auth/email-already-in-use') {
           msg = "Email này đã được sử dụng. Vui lòng đăng nhập.";
         } else if (err.message === "Passwords do not match") {
           msg = "Mật khẩu nhập lại không khớp.";
         } else {
           msg = err.message;
         }
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setSelectedFile(null);
  };

  // 1. Verification Email Sent View
  if (verificationEmail) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-900/20 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Verification Sent</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            We have sent you a verification email to <span className="text-white font-medium">{verificationEmail}</span>.
            <br />
            Please verify it and log in.
          </p>
          <button
            onClick={() => {
              setVerificationEmail(null);
              setIsLogin(true);
            }}
            className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all shadow-lg shadow-primary-900/50"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // 2. Password Reset Link Sent View
  if (resetSentEmail) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-blue-900/20 border border-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Check Your Inbox</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            We have sent you a password change link to <span className="text-white font-medium">{resetSentEmail}</span>.
          </p>
          <button
            onClick={() => {
              setResetSentEmail(null);
              setShowForgotPassword(false);
              setIsLogin(true);
              setError(null);
            }}
            className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all shadow-lg shadow-primary-900/50"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // 3. Main Auth View
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative">
      
      <div className="absolute bottom-4 right-4">
        <button 
          onClick={onAdminClick}
          className="text-gray-600 hover:text-gray-400 text-xs flex items-center gap-1 transition-colors"
        >
          <Shield className="w-3 h-3" /> Admin Access
        </button>
      </div>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="h-2 w-full bg-gradient-to-r from-primary-500 to-indigo-600"></div>
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
              {showForgotPassword ? (
                <KeyRound className="w-8 h-8 text-primary-500" />
              ) : (
                <BookOpen className="w-8 h-8 text-primary-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {showForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
            </h2>
            <p className="text-gray-400 text-sm">
              {showForgotPassword 
                ? 'Enter your email to receive a password reset link'
                : (isLogin ? 'Enter your credentials to access your stories' : 'Join AI Story Factory Pro today')
              }
            </p>
          </div>

          <form onSubmit={showForgotPassword ? handlePasswordReset : handleSubmit} className="space-y-4">
            {error && (
              <div 
                className={`p-3 rounded-lg text-sm flex items-center gap-2 ${error.includes("Sign in?") ? "bg-amber-900/20 border border-amber-800 text-amber-300" : "bg-red-900/20 border border-red-800 text-red-300"}`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {error === "Email này đã được sử dụng. Vui lòng đăng nhập." ? (
                    <>
                      Email đã tồn tại. <button type="button" onClick={() => setIsLogin(true)} className="underline font-bold hover:text-white">Đăng nhập ngay?</button>
                    </>
                  ) : error}
                </span>
              </div>
            )}

            {!showForgotPassword && !isLogin && (
              <>
                 <div className="flex items-center gap-4 mb-2">
                    <div className="relative w-16 h-16 bg-gray-800 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 group cursor-pointer">
                      {selectedFile ? (
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-500" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        title="Upload Profile Photo"
                      />
                    </div>
                    <div className="text-sm text-gray-400">
                      <p className="font-medium text-gray-300">Profile Photo</p>
                      <p className="text-xs">Click to upload</p>
                    </div>
                 </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {!showForgotPassword && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}

            {!showForgotPassword && !isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat Password"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}
            
            {!showForgotPassword && isLogin && (
              <div className="flex justify-end -mt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(null);
                  }} 
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-primary-900/50 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {showForgotPassword ? 'Get Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}
                  {!showForgotPassword && <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          {!showForgotPassword && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-lg transition-all flex items-center justify-center gap-3"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-5 h-5" 
                />
                Sign in with Google
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            {showForgotPassword ? (
              <button 
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                }}
                className="text-sm text-gray-400 hover:text-white font-medium transition-colors"
              >
                Back to Sign In
              </button>
            ) : (
              <p className="text-sm text-gray-400">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={toggleMode}
                  className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
