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
    Shield,
    ChevronDown
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
        accentClass: 'accent-story',
        gradient: 'from-violet-500 to-purple-600',
        activeGradient: 'bg-gradient-to-r from-violet-500/20 to-purple-600/20',
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-400'
    },
    {
        path: '/scene-gen',
        name: 'ScriptGen AI',
        shortName: 'Scene',
        description: 'Tạo Scene JSON từ voice',
        icon: Video,
        accentClass: 'accent-scene',
        gradient: 'from-cyan-500 to-blue-600',
        activeGradient: 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20',
        iconBg: 'bg-cyan-500/10',
        iconColor: 'text-cyan-400'
    },
    {
        path: '/voice-editor',
        name: 'VietVoice Pro',
        shortName: 'Voice',
        description: 'Phân tách Voice Segments',
        icon: Mic,
        accentClass: 'accent-voice',
        gradient: 'from-emerald-500 to-green-600',
        activeGradient: 'bg-gradient-to-r from-emerald-500/20 to-green-600/20',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-400'
    },
    {
        path: '/data-tools',
        name: 'SceneJSON Pro',
        shortName: 'Data',
        description: 'Xử lý & phân tích dữ liệu',
        icon: Database,
        accentClass: 'accent-data',
        gradient: 'from-orange-500 to-amber-600',
        activeGradient: 'bg-gradient-to-r from-orange-500/20 to-amber-600/20',
        iconBg: 'bg-orange-500/10',
        iconColor: 'text-orange-400'
    },
];

export function Navbar() {
    const pathname = usePathname();
    const { user, signOut, isAdmin, isPremium, isGold } = useAuth();
    const { openModal: openApiKeyModal, hasValidKey } = useApiKey();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const getRoleBadge = () => {
        if (isAdmin) return { icon: Shield, text: 'ADMIN', className: 'badge-admin' };
        if (isGold) return { icon: Crown, text: 'GOLD', className: 'badge-gold' };
        if (isPremium) return { icon: Star, text: 'SILVER', className: 'badge-silver' };
        return { icon: User, text: 'FREE', className: 'badge-free' };
    };

    const roleBadge = getRoleBadge();

    return (
        <header className="sticky top-0 z-50 glass border-b border-[rgb(var(--border-subtle))]">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:scale-105">
                            <span className="text-white font-bold text-lg">16</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-[rgb(var(--text-primary))] text-lg">16Styles AI</h1>
                            <p className="text-xs text-[rgb(var(--text-tertiary))]">Unified Platform</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {modules.map((module) => {
                            const Icon = module.icon;
                            const isActive = pathname === module.path;
                            return (
                                <Link
                                    key={module.path}
                                    href={module.path}
                                    className={cn(
                                        'relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200',
                                        isActive
                                            ? `${module.activeGradient} border border-transparent`
                                            : 'hover:bg-[rgb(var(--hover-overlay)/0.05)] border border-transparent'
                                    )}
                                >
                                    <div className={cn(
                                        'p-1.5 rounded-md transition-colors',
                                        isActive ? module.iconBg : 'bg-transparent'
                                    )}>
                                        <Icon className={cn(
                                            'w-4 h-4 transition-colors',
                                            isActive ? module.iconColor : 'text-[rgb(var(--text-tertiary))]'
                                        )} />
                                    </div>
                                    <span className={cn(
                                        'text-sm font-medium transition-colors',
                                        isActive ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))]'
                                    )}>
                                        {module.shortName}
                                    </span>
                                    {isActive && (
                                        <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${module.gradient}`} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {/* API Key Status */}
                        {user && (
                            <button
                                onClick={openApiKeyModal}
                                className={cn(
                                    'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                                    hasValidKey
                                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 animate-pulse'
                                )}
                            >
                                <Key className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                    {hasValidKey ? 'API Key' : 'Add Key'}
                                </span>
                            </button>
                        )}

                        {/* User Menu */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border-subtle))] hover:border-[rgb(var(--border-default))] transition-all"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-white">
                                                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate max-w-[100px]">
                                            {user.displayName || 'User'}
                                        </p>
                                    </div>
                                    <span className={`badge ${roleBadge.className}`}>
                                        <roleBadge.icon className="w-3 h-3" />
                                        {roleBadge.text}
                                    </span>
                                    <ChevronDown className={cn(
                                        'w-4 h-4 text-[rgb(var(--text-tertiary))] transition-transform',
                                        userMenuOpen && 'rotate-180'
                                    )} />
                                </button>

                                {/* Dropdown */}
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 py-2 rounded-xl surface-overlay z-20">
                                            <div className="px-4 py-2 border-b border-[rgb(var(--border-subtle))]">
                                                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{user.displayName || 'User'}</p>
                                                <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">{user.email}</p>
                                            </div>

                                            {isAdmin && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    Admin Dashboard
                                                </Link>
                                            )}

                                            <button
                                                onClick={openApiKeyModal}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover-overlay)/0.05)] transition-colors"
                                            >
                                                <Key className="w-4 h-4" />
                                                Quản lý API Keys
                                            </button>

                                            <button
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover-overlay)/0.05)] transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Cài đặt
                                            </button>

                                            <div className="my-1 border-t border-[rgb(var(--border-subtle))]" />

                                            <button
                                                onClick={() => { signOut(); setUserMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="btn-primary px-4 py-2 text-sm"
                            >
                                Đăng nhập
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-elevated))] transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-[rgb(var(--border-subtle))]">
                        <div className="space-y-1">
                            {modules.map((module) => {
                                const Icon = module.icon;
                                const isActive = pathname === module.path;
                                return (
                                    <Link
                                        key={module.path}
                                        href={module.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                            isActive
                                                ? `${module.activeGradient}`
                                                : 'hover:bg-[rgb(var(--bg-elevated))]'
                                        )}
                                    >
                                        <div className={cn(
                                            'p-2 rounded-lg',
                                            isActive ? module.iconBg : 'bg-[rgb(var(--bg-elevated))]'
                                        )}>
                                            <Icon className={cn(
                                                'w-5 h-5',
                                                isActive ? module.iconColor : 'text-[rgb(var(--text-tertiary))]'
                                            )} />
                                        </div>
                                        <div>
                                            <p className={cn(
                                                'font-medium',
                                                isActive ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))]'
                                            )}>
                                                {module.name}
                                            </p>
                                            <p className="text-xs text-[rgb(var(--text-tertiary))]">{module.description}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {!user && (
                            <div className="mt-4 pt-4 border-t border-[rgb(var(--border-subtle))]">
                                <Link
                                    href="/login"
                                    className="btn-primary w-full py-3 text-center block"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Đăng nhập / Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
}
