'use client';

import { useState, useEffect, useCallback } from 'react';
import { FirestoreUser, AdminStats, getAllUsers, getAdminStats, updateUserRole, searchUsers } from '@/services/usersService';

interface RecentActivity {
    id: string;
    action: string;
    user: string;
    time: string;
    type: 'signup' | 'upgrade' | 'payment';
}

interface UseAdminDataReturn {
    // Users
    users: FirestoreUser[];
    loadingUsers: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredUsers: FirestoreUser[];

    // Stats
    stats: AdminStats;
    loadingStats: boolean;

    // Recent Activity
    recentActivity: RecentActivity[];

    // Actions
    refreshData: () => Promise<void>;
    changeUserRole: (userId: string, newRole: 'free' | 'silver' | 'gold' | 'admin') => Promise<boolean>;
}

export function useAdminData(): UseAdminDataReturn {
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<FirestoreUser[]>([]);

    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        goldMembers: 0,
        silverMembers: 0,
        activeToday: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    // Fetch all data
    const fetchData = useCallback(async () => {
        // Fetch users
        setLoadingUsers(true);
        try {
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
            setFilteredUsers(fetchedUsers);

            // Generate recent activity from users
            const activity: RecentActivity[] = fetchedUsers.slice(0, 5).map((user, idx) => ({
                id: `activity_${idx}`,
                action: user.role === 'gold' ? 'Upgrade lên Gold' :
                    user.role === 'silver' ? 'Upgrade lên Silver' : 'User mới đăng ký',
                user: user.email,
                time: formatTimeAgo(user.createdAt),
                type: user.role === 'gold' || user.role === 'silver' ? 'upgrade' : 'signup',
            }));
            setRecentActivity(activity);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }

        // Fetch stats
        setLoadingStats(true);
        try {
            const fetchedStats = await getAdminStats();
            setStats(fetchedStats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter users when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(
                users.filter(user =>
                    user.email.toLowerCase().includes(query) ||
                    user.displayName.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, users]);

    // Refresh data
    const refreshData = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    // Change user role
    const changeUserRole = useCallback(async (userId: string, newRole: 'free' | 'silver' | 'gold' | 'admin'): Promise<boolean> => {
        const success = await updateUserRole(userId, newRole);
        if (success) {
            // Update local state
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
            // Refresh stats
            const newStats = await getAdminStats();
            setStats(newStats);
        }
        return success;
    }, []);

    return {
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
    };
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
}
