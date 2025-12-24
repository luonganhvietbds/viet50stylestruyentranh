
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { useAppStore } from '../store';
import { X, Mail, Lock, User, Loader2, AlertCircle, LogIn, UserPlus, Upload, ArrowRight, CheckCircle2, RefreshCw, LogOut, ChevronLeft } from 'lucide-react';

interface AuthModalProps {
  forceOpen?: boolean;
}

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const AuthModal: React.FC<AuthModalProps> = ({ forceOpen = false }) => {
  const { 
    isAuthModalOpen, 
    setAuthModalOpen, 
    isVerificationPending, 
    verificationEmail, 
    setVerificationPending 
  } = useAppStore();
  
  const [view, setView] = useState<AuthView>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetSent, setResetSent] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // If not forced and not open in store, don't render (unless verification is pending, which forces it open conceptually)
  if (!forceOpen && !isAuthModalOpen && !isVerificationPending) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestion(null);

    if (!auth) {
      setError("Firebase configuration is missing.");
      return;
    }

    // Validation for Register
    if (view === 'REGISTER') {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      if (view === 'REGISTER') {
        // 1. Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 2. Update Profile (DisplayName)
        if (displayName) {
          await updateProfile(user, { displayName: displayName });
        }

        // 3. Determine Role (Auto-Admin for testing if email contains 'admin')
        const initialRole = email.toLowerCase().includes('admin') ? 'admin' : 'free';

        // 4. Create User Document in Firestore
        if (db) {
           try {
             const userDocRef = doc(db, 'users', user.uid);
             const userDocSnap = await getDoc(userDocRef);

             if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                  uid: user.uid,
                  email: user.email,
                  displayName: displayName || user.email?.split('@')[0] || 'User',
                  role: initialRole, 
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
             }
           } catch (dbError) {
             console.error("Failed to create/check user document in Firestore:", dbError);
           }
        }

        // 5. Send Verification Email
        await sendEmailVerification(user);

        // 6. Switch to Verification Pending View (Even for admins on first signup, to verify email exists)
        setVerificationPending(true, email);
        
      } else {
        // --- LOGIN FLOW ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check Verification Logic
        if (!user.emailVerified) {
          // If not verified, check if they are ADMIN or Hardcoded Bypass
          let isAdmin = false;
          
          if (user.email === 'luonganhvietbds@gmail.com') {
             isAdmin = true;
          } else if (db) {
             try {
               const userDoc = await getDoc(doc(db, 'users', user.uid));
               if (userDoc.exists() && userDoc.data().role === 'admin') {
                 isAdmin = true;
               }
             } catch (e) {
               console.error("Error checking admin status on login:", e);
             }
          }

          if (!isAdmin) {
            // Not Admin? Trigger Verification Block
            setVerificationPending(true, email || user.email);
            await signOut(auth); // Sign out immediately so useAuth doesn't flash
            setLoading(false);
            return;
          }
        }
        
        // Success
        setAuthModalOpen(false);
        resetForm();
      }

    } catch (err: any) {
      console.error("Auth Error:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      console.error("Reset Error:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    let msg = "An unexpected error occurred.";
    const code = err.code;
    
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      msg = "Password or Email Incorrect";
    } else if (code === 'auth/email-already-in-use') {
      msg = "User already exists.";
      setSuggestion("Sign in?");
    } else if (code === 'auth/weak-password') {
      msg = "Password should be at least 6 characters.";
    } else if (code === 'auth/invalid-email') {
      msg = "Invalid email address.";
    } else if (code === 'auth/too-many-requests') {
      msg = "Too many attempts. Please try again later.";
    } else if (code === 'auth/network-request-failed') {
      msg = "Network error. Please check your connection.";
    } else if (err.message) {
       msg = err.message.replace('Firebase: ', '').replace(`(${code})`, '').trim();
    }
    setError(msg);
  };

  const handleResendVerification = async () => {
    if (!auth?.currentUser) return;
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) clearInterval(interval);
          return prev - 1;
        });
      }, 1000);
      setError('');
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError("Please wait before resending email.");
      } else {
        setError("Failed to resend email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    if (auth) {
      await signOut(auth);
    }
    setVerificationPending(false, null);
    setView('LOGIN');
    resetForm();
    setError('');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setPhotoFile(null);
    setError('');
    setSuggestion(null);
    setResetSent(false);
  };

  const switchToView = (newView: AuthView) => {
    setView(newView);
    setError('');
    setSuggestion(null);
    setResetSent(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  // ---------------------------------------------------------------------------
  // VIEW: VERIFICATION PENDING
  // ---------------------------------------------------------------------------
  if (isVerificationPending) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-center ring-1 ring-white/10">
          <div className="w-16 h-16 rounded-full bg-indigo-900/30 text-indigo-400 flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <Mail className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            We have sent a verification email to <br/>
            <span className="font-bold text-slate-200">{verificationEmail}</span>.
            <br/>Please verify it to continue.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/10 p-3 rounded-lg border border-red-900/20 mb-4 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
             <button
               onClick={handleResendVerification}
               disabled={resendCooldown > 0 || loading}
               className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
               {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
             </button>

             <button
               onClick={handleBackToLogin}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
             >
               <LogOut className="w-4 h-4" />
               Back to Login
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${forceOpen ? 'bg-slate-950' : 'bg-slate-950/90 backdrop-blur-sm'} animate-in fade-in duration-200`}>
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative ring-1 ring-white/10 overflow-hidden">
        
        {!forceOpen && (
          <button 
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {view === 'FORGOT_PASSWORD' && (
           <div className="animate-in slide-in-from-right duration-300">
              <div className="mb-6 text-center">
                 <button onClick={() => switchToView('LOGIN')} className="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                 </button>
                 <h2 className="text-2xl font-bold text-white mb-1">Reset Password</h2>
                 <p className="text-sm text-slate-400">Recover access to your account</p>
              </div>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-green-900/30 text-green-400 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-slate-300 text-sm mb-6">
                    We sent you a password change link to <br/>
                    <span className="font-bold text-white">{email}</span>.
                  </p>
                  <button
                    onClick={() => switchToView('LOGIN')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="name@example.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/10 p-3 rounded-lg border border-red-900/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Get Reset Link <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
           </div>
        )}

        {(view === 'LOGIN' || view === 'REGISTER') && (
          <div className="animate-in slide-in-from-left duration-300">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-1">
                {view === 'REGISTER' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-slate-400">
                {view === 'REGISTER' ? 'Join ScriptGen AI to start creating.' : 'Sign in to access your projects.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {view === 'REGISTER' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="relative group cursor-pointer">
                      <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors">
                          {photoFile ? (
                            <img src={URL.createObjectURL(photoFile)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400" />
                          )}
                      </div>
                      <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      {!photoFile && <span className="text-[10px] text-slate-500 mt-1 absolute -bottom-5 w-full text-center whitespace-nowrap">Upload Photo</span>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Password</label>
                   {view === 'LOGIN' && (
                     <button 
                       type="button"
                       onClick={() => switchToView('FORGOT_PASSWORD')}
                       className="text-xs text-indigo-400 hover:text-indigo-300"
                     >
                       Forgot Password?
                     </button>
                   )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>

              {view === 'REGISTER' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase ml-1">Repeat Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col gap-2 text-xs text-red-400 bg-red-900/10 p-3 rounded-lg border border-red-900/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {suggestion && (
                    <button 
                      type="button" 
                      onClick={() => switchToView('LOGIN')}
                      className="text-left text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1 pl-6"
                    >
                      {suggestion} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  view === 'REGISTER' ? <><UserPlus className="w-4 h-4" /> Sign Up</> : <><LogIn className="w-4 h-4" /> Sign In</>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-sm text-slate-400">
                {view === 'REGISTER' ? 'Already have an account?' : "Don't have an account?"}
                <button 
                  onClick={() => switchToView(view === 'REGISTER' ? 'LOGIN' : 'REGISTER')}
                  className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                >
                  {view === 'REGISTER' ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
