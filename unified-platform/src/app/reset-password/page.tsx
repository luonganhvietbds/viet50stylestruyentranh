'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { confirmReset, verifyResetCode, error, successMessage, loading, clearError, clearSuccessMessage } = useAuth();

    const [oobCode, setOobCode] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);

    // Get oobCode from URL params
    useEffect(() => {
        const code = searchParams.get('oobCode');
        if (code) {
            setOobCode(code);
        } else {
            setVerifying(false);
        }
    }, [searchParams]);

    // Verify the reset code
    useEffect(() => {
        if (oobCode && verifying) {
            verifyResetCode(oobCode)
                .then((userEmail) => {
                    setEmail(userEmail);
                    setVerified(true);
                })
                .catch(() => {
                    setVerified(false);
                })
                .finally(() => {
                    setVerifying(false);
                });
        }
    }, [oobCode, verifying, verifyResetCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        clearSuccessMessage();

        if (newPassword !== confirmPassword) {
            return;
        }

        if (!oobCode) {
            return;
        }

        try {
            await confirmReset(oobCode, newPassword);
            setResetComplete(true);
        } catch {
            // Error handled by context
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Đang xác thực link đặt lại mật khẩu...</p>
                </div>
            </div>
        );
    }

    if (!oobCode || !verified) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-900/20 border border-red-800 flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Link không hợp lệ</h1>
                    <p className="text-gray-400 mb-6">
                        Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
                    </p>
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
                    >
                        Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    if (resetComplete) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-2xl bg-green-900/20 border border-green-800 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Đặt lại mật khẩu thành công!</h1>
                    <p className="text-gray-400 mb-6">
                        Mật khẩu của bạn đã được thay đổi. Bạn có thể đăng nhập với mật khẩu mới.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all"
                    >
                        Đăng nhập ngay
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                        <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Đặt lại mật khẩu</h1>
                    <p className="text-gray-400 text-sm">
                        Nhập mật khẩu mới cho tài khoản: <span className="text-indigo-400">{email}</span>
                    </p>
                </div>

                {/* Form */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                <p className="mt-1 text-sm text-red-400">Mật khẩu không khớp</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <KeyRound className="w-5 h-5" />
                                    Đặt lại mật khẩu
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Đang tải...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
