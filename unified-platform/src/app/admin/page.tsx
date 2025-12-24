'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Shield,
    Users,
    CreditCard,
    BarChart3,
    Settings,
    Loader2,
    ArrowLeft,
    Crown,
    Star,
    User,
    Search,
    MoreVertical,
    TrendingUp,
    DollarSign,
    UserPlus,
    Activity,
    Palette,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { StylesPanel } from '@/components/admin/StylesPanel';
import { useAdminData } from '@/hooks/useAdminData';

const TABS = [
    { id: 'overview', label: 'Tổng Quan', icon: BarChart3 },
    { id: 'styles', label: 'Quản Lý Styles', icon: Palette },
    { id: 'users', label: 'Quản Lý Users', icon: Users },
    { id: 'payments', label: 'Thanh Toán', icon: CreditCard },
    { id: 'settings', label: 'Cài Đặt', icon: Settings },
];

export default function AdminPage() {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');

    // Use real data from Firebase
    const {
        users,
        loadingUsers,
        searchQuery,
        setSearchQuery,
        filteredUsers,
        stats,
        loadingStats,
        recentActivity,
        refreshData,
        changeUserRole,
    } = useAdminData();

    // Redirect if not admin
    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                <p className="text-gray-400 text-sm">Đang xác thực quyền Admin...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded border border-red-500/30">ADMIN</span>;
            case 'gold':
                return <span className="px-2 py-0.5 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30 flex items-center gap-1"><Crown className="w-3 h-3" />GOLD</span>;
            case 'silver':
                return <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 flex items-center gap-1"><Star className="w-3 h-3" />SILVER</span>;
            default:
                return <span className="px-2 py-0.5 text-xs font-bold bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">FREE</span>;
        }
    };

    // Stats cards configuration
    const statsCards = [
        { label: 'Tổng Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Gold Members', value: stats.goldMembers.toLocaleString(), icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: 'Silver Members', value: stats.silverMembers.toLocaleString(), icon: Star, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active Today', value: stats.activeToday.toLocaleString(), icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                                    <p className="text-sm text-gray-500">Quản lý toàn bộ hệ thống</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === tab.id
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Refresh Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={refreshData}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Làm mới
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {loadingStats ? (
                                Array(4).fill(0).map((_, idx) => (
                                    <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-800" />
                                        </div>
                                        <div className="h-8 bg-gray-800 rounded w-20 mb-2" />
                                        <div className="h-4 bg-gray-800 rounded w-24" />
                                    </div>
                                ))
                            ) : (
                                statsCards.map((stat, idx) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                                            <p className="text-sm text-gray-500">{stat.label}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Hoạt Động Gần Đây</h3>
                            <div className="space-y-4">
                                {recentActivity.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Chưa có hoạt động nào</p>
                                ) : (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'signup' ? 'bg-blue-500/20 text-blue-400' :
                                                    activity.type === 'upgrade' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {activity.type === 'signup' ? <UserPlus className="w-4 h-4" /> :
                                                    activity.type === 'upgrade' ? <Crown className="w-4 h-4" /> :
                                                        <CreditCard className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-white">{activity.action}</p>
                                                <p className="text-xs text-gray-500">{activity.user}</p>
                                            </div>
                                            <span className="text-xs text-gray-500">{activity.time}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Styles Tab */}
                {activeTab === 'styles' && (
                    <StylesPanel />
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm user..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <button
                                onClick={refreshData}
                                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Làm mới
                            </button>
                        </div>

                        {/* Users Table */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            {loadingUsers ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    {searchQuery ? 'Không tìm thấy user phù hợp' : 'Chưa có user nào'}
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-800/50">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Ngày Tạo</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                                                            {u.photoURL ? (
                                                                <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-gray-500" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{u.displayName}</p>
                                                            <p className="text-sm text-gray-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {u.createdAt.toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center py-20">
                        <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <h2 className="text-xl font-bold text-white mb-2">Quản Lý Thanh Toán</h2>
                        <p className="text-gray-500 mb-4">
                            Tích hợp payment gateway sẽ được thêm trong giai đoạn sau.
                        </p>
                        <p className="text-sm text-gray-600">
                            Hỗ trợ: Stripe, VNPay, MoMo, ZaloPay
                        </p>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center py-20">
                        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <h2 className="text-xl font-bold text-white mb-2">Cài Đặt Hệ Thống</h2>
                        <p className="text-gray-500">
                            Cấu hình Firebase, API keys, và các tham số hệ thống.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
