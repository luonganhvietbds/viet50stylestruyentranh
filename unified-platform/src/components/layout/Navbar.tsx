'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BookOpen,
    Video,
    Mic,
    Database,
    Menu,
    X,
    LogOut,
    Settings,
    Crown,
    Star,
    User,
    Key,
    Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { cn } from '@/lib/utils';

const modules = [
    {
        path: '/story-factory',
        name: 'AI Story Factory',
        shortName: 'Story',
        description: 'Viết truyện với 16 styles',
        icon: BookOpen,
        color: 'from-purple-500 to-indigo-600',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-400'
    },
    {
        path: '/scene-gen',
        name: 'ScriptGen AI',
        shortName: 'Scene',
        description: 'Tạo Scene JSON từ voice',
        icon: Video,
        color: 'from-cyan-500 to-blue-600',
        bgColor: 'bg-cyan-500/10',
        textColor: 'text-cyan-400'
    },
    {
        path: '/voice-editor',
        name: 'VietVoice Pro',
        shortName: 'Voice',
        description: 'Phân tách Voice Segments',
        icon: Mic,
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-400'
    },
    {
        path: '/data-tools',
        name: 'SceneJSON Pro',
        shortName: 'Data',
        description: 'Xử lý & phân tích dữ liệu',
        icon: Database,
        color: 'from-orange-500 to-amber-600',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-400'
    },
];

export function Navbar() {
    const pathname = usePathname();
    const { user, signOut, isAdmin, isPremium, isGold } = useAuth();
    const { openModal: openApiKeyModal, hasValidKey } = useApiKey();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const getRoleBadge = () => {
        if (isAdmin) return { icon: Shield, text: 'ADMIN', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
        if (isGold) return { icon: Crown, text: 'GOLD', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
        if (isPremium) return { icon: Star, text: 'SILVER', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
        return { icon: User, text: 'FREE', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    };

    const roleBadge = getRoleBadge();

    return (
        <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                            <span className="text-white font-bold text-lg">16</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-white text-lg">16Styles AI</h1>
                            <p className="text-xs text-gray-500">Unified Platform</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {modules.map((module) => {
                            const isActive = pathname.startsWith(module.path);
                            const Icon = module.icon;
                            return (
                                <Link
                                    key={module.path}
                                    href={module.path}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        isActive
                                            ? `bg-gradient-to-r ${module.color} text-white shadow-lg`
                                            : `${module.bgColor} ${module.textColor} hover:bg-gray-800`
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden lg:inline">{module.shortName}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* API Key Button */}
                        <button
                            onClick={openApiKeyModal}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                hasValidKey
                                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                    : "text-red-400 bg-red-900/20 animate-pulse"
                            )}
                            title={hasValidKey ? "Quản lý API Keys" : "Chưa có API Key!"}
                        >
                            <Key className="w-5 h-5" />
                        </button>

                        {/* Admin Link */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                title="Admin Panel"
                            >
                                <Shield className="w-5 h-5" />
                            </Link>
                        )}

                        {/* User Info */}
                        {user && (
                            <div className="hidden sm:flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
                                <div className="text-right">
                                    <p className="text-xs font-medium text-white truncate max-w-[100px]">
                                        {user.displayName || user.email?.split('@')[0]}
                                    </p>
                                    <div className={cn(
                                        "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                        roleBadge.className
                                    )}>
                                        <roleBadge.icon className="w-2.5 h-2.5" />
                                        {roleBadge.text}
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-400 hover:text-white"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-800 space-y-2">
                        {modules.map((module) => {
                            const isActive = pathname.startsWith(module.path);
                            const Icon = module.icon;
                            return (
                                <Link
                                    key={module.path}
                                    href={module.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                                        isActive
                                            ? `bg-gradient-to-r ${module.color} text-white`
                                            : "text-gray-300 hover:bg-gray-800"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <div>
                                        <p className="font-medium">{module.name}</p>
                                        <p className="text-xs opacity-70">{module.description}</p>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Mobile User Section */}
                        {user && (
                            <div className="pt-4 mt-4 border-t border-gray-800">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{user.displayName || user.email}</p>
                                            <div className={cn(
                                                "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border mt-1",
                                                roleBadge.className
                                            )}>
                                                <roleBadge.icon className="w-2.5 h-2.5" />
                                                {roleBadge.text}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
}
