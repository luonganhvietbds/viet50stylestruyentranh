// Users Service - Firestore CRUD operations for users collection
import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// User interface matching Firestore structure
export interface FirestoreUser {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'free' | 'silver' | 'gold' | 'admin';
    createdAt: Date;
    lastLoginAt?: Date;
    isActive?: boolean;
}

// Admin Stats interface
export interface AdminStats {
    totalUsers: number;
    goldMembers: number;
    silverMembers: number;
    activeToday: number;
    // Revenue would come from transactions collection
}

const USERS_COLLECTION = 'users';

/**
 * Get all users from Firestore
 */
export async function getAllUsers(): Promise<FirestoreUser[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                uid: data.uid || doc.id,
                email: data.email || '',
                displayName: data.displayName || 'Unknown User',
                photoURL: data.photoURL,
                role: data.role || 'free',
                createdAt: data.createdAt?.toDate() || new Date(),
                lastLoginAt: data.lastLoginAt?.toDate(),
                isActive: data.isActive !== false,
            };
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<FirestoreUser | null> {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        return {
            id: snapshot.id,
            uid: data.uid || snapshot.id,
            email: data.email || '',
            displayName: data.displayName || 'Unknown User',
            photoURL: data.photoURL,
            role: data.role || 'free',
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLoginAt: data.lastLoginAt?.toDate(),
            isActive: data.isActive !== false,
        };
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: 'free' | 'silver' | 'gold' | 'admin'): Promise<boolean> {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, {
            role: newRole,
            updatedAt: Timestamp.now(),
        });
        return true;
    } catch (error) {
        console.error('Error updating user role:', error);
        return false;
    }
}

/**
 * Get admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);

        // Total users count
        const totalSnapshot = await getCountFromServer(usersRef);
        const totalUsers = totalSnapshot.data().count;

        // Gold members count
        const goldQuery = query(usersRef, where('role', '==', 'gold'));
        const goldSnapshot = await getCountFromServer(goldQuery);
        const goldMembers = goldSnapshot.data().count;

        // Silver members count
        const silverQuery = query(usersRef, where('role', '==', 'silver'));
        const silverSnapshot = await getCountFromServer(silverQuery);
        const silverMembers = silverSnapshot.data().count;

        // Active today (users who logged in today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeQuery = query(
            usersRef,
            where('lastLoginAt', '>=', Timestamp.fromDate(today))
        );
        const activeSnapshot = await getCountFromServer(activeQuery);
        const activeToday = activeSnapshot.data().count;

        return {
            totalUsers,
            goldMembers,
            silverMembers,
            activeToday,
        };
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return {
            totalUsers: 0,
            goldMembers: 0,
            silverMembers: 0,
            activeToday: 0,
        };
    }
}

/**
 * Get recent users
 */
export async function getRecentUsers(count: number = 5): Promise<FirestoreUser[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, orderBy('createdAt', 'desc'), limit(count));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                uid: data.uid || doc.id,
                email: data.email || '',
                displayName: data.displayName || 'Unknown User',
                photoURL: data.photoURL,
                role: data.role || 'free',
                createdAt: data.createdAt?.toDate() || new Date(),
                lastLoginAt: data.lastLoginAt?.toDate(),
                isActive: data.isActive !== false,
            };
        });
    } catch (error) {
        console.error('Error fetching recent users:', error);
        return [];
    }
}

/**
 * Search users by email or name
 */
export async function searchUsers(searchQuery: string): Promise<FirestoreUser[]> {
    try {
        // Firestore doesn't support full-text search, so we fetch all and filter client-side
        // For production, consider using Algolia or ElasticSearch
        const allUsers = await getAllUsers();
        const query = searchQuery.toLowerCase();

        return allUsers.filter(user =>
            user.email.toLowerCase().includes(query) ||
            user.displayName.toLowerCase().includes(query)
        );
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: 'free' | 'silver' | 'gold' | 'admin'): Promise<FirestoreUser[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('role', '==', role), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                uid: data.uid || doc.id,
                email: data.email || '',
                displayName: data.displayName || 'Unknown User',
                photoURL: data.photoURL,
                role: data.role || 'free',
                createdAt: data.createdAt?.toDate() || new Date(),
                lastLoginAt: data.lastLoginAt?.toDate(),
                isActive: data.isActive !== false,
            };
        });
    } catch (error) {
        console.error('Error fetching users by role:', error);
        return [];
    }
}
