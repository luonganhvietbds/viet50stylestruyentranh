'use client';

import React from 'react';
import { BookOpen, LogIn, UserPlus, Mail, ArrowLeft, KeyRound, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface AuthFormProps {
    moduleName?: string;
    onSuccess?: () => void;
}

export function AuthForm({ moduleName = 'Unified Platform', onSuccess }: AuthFormProps) {
    const {
        signIn,
        signUp,
        signInWithGoogle,
        resetPassword,
        error,
        successMessage,
        clearError,
        clearSuccessMessage,
        loading,
        user
    } = useAuth();

    const [mode, setMode] = React.useState<'login' | 'register' | 'forgot'>('login');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');

    // Call onSuccess when user is authenticated
    React.useEffect(() => {
        if (user && onSuccess) {
            onSuccess();
        }
    }, [user, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        clearSuccessMessage();

        try {
            if (mode === 'login') {
                await signIn(email, password);
            } else if (mode === 'register') {
                if (password !== confirmPassword) {
                    return;
                }
                await signUp(email, password, displayName);
            } else if (mode === 'forgot') {
                await resetPassword(email);
            }
        } catch {
            // Error is handled by context
        }
    };

    const handleGoogleSignIn = async () => {
        clearError();
        clearSuccessMessage();
        try {
            await signInWithGoogle();
        } catch {
            // Error is handled by context
        }
    };

    const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
        clearError();
        clearSuccessMessage();
        setMode(newMode);
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                    {mode === 'forgot' ? (
                        <KeyRound className="w-8 h-8 text-white" />
                    ) : (
                        <Sparkles className="w-8 h-8 text-white" />
                    )}
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{moduleName}</h1>
                <p className="text-gray-400 text-sm">
                    {mode === 'login' && 'Đăng nhập để tiếp tục'}
                    {mode === 'register' && 'Tạo tài khoản mới'}
                    {mode === 'forgot' && 'Đặt lại mật khẩu'}
                </p>
            </div>

            {/* Form */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Back button for forgot password */}
                {mode === 'forgot' && (
                    <button
                        onClick={() => switchMode('login')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Quay lại đăng nhập</span>
                    </button>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Tên hiển thị
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Nhập tên của bạn"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    )}

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Xác nhận mật khẩu
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            {password && confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-sm text-red-400">Mật khẩu không khớp</p>
                            )}
                        </div>
                    )}

                    {/* Forgot password link */}
                    {mode === 'login' && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => switchMode('forgot')}
                                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (mode === 'register' && password !== confirmPassword)}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : mode === 'login' ? (
                            <>
                                <LogIn className="w-5 h-5" />
                                Đăng Nhập
                            </>
                        ) : mode === 'register' ? (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Đăng Ký
                            </>
                        ) : (
                            <>
                                <Mail className="w-5 h-5" />
                                Gửi Email Đặt Lại
                            </>
                        )}
                    </button>
                </form>

                {/* Only show divider and Google for login/register */}
                {mode !== 'forgot' && (
                    <>
                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-gray-800" />
                            <span className="text-xs text-gray-500">hoặc</span>
                            <div className="flex-1 h-px bg-gray-800" />
                        </div>

                        {/* Google Sign In */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Đăng nhập với Google
                        </button>
                    </>
                )}

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                    {mode === 'login' && (
                        <button
                            onClick={() => switchMode('register')}
                            className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                        >
                            Chưa có tài khoản? <span className="text-indigo-400">Đăng ký ngay</span>
                        </button>
                    )}
                    {mode === 'register' && (
                        <button
                            onClick={() => switchMode('login')}
                            className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                        >
                            Đã có tài khoản? <span className="text-indigo-400">Đăng nhập</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Footer info */}
            <p className="mt-6 text-center text-xs text-gray-600">
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <Link href="/terms" className="text-indigo-400 hover:underline">Điều khoản dịch vụ</Link>
                {' '}và{' '}
                <Link href="/privacy" className="text-indigo-400 hover:underline">Chính sách bảo mật</Link>
            </p>
        </div>
    );
}
