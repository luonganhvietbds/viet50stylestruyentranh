// Styles Service - Firestore CRUD operations for UnifiedStyle

import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UnifiedStyle, StyleAgent, StyleConfig, toStyleAgent, toStyleConfig } from '@/types/styles';

const STYLES_COLLECTION = 'styles';

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get all styles from Firestore
 */
export async function getAllStyles(): Promise<UnifiedStyle[]> {
    try {
        const stylesRef = collection(db, STYLES_COLLECTION);
        const q = query(stylesRef, orderBy('name'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as UnifiedStyle[];
    } catch (error) {
        console.error('Error fetching styles:', error);
        return [];
    }
}

/**
 * Get only active styles
 */
export async function getActiveStyles(): Promise<UnifiedStyle[]> {
    try {
        const stylesRef = collection(db, STYLES_COLLECTION);
        const q = query(
            stylesRef,
            where('isActive', '==', true),
            orderBy('name')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as UnifiedStyle[];
    } catch (error) {
        console.error('Error fetching active styles:', error);
        return [];
    }
}

/**
 * Get a single style by ID
 */
export async function getStyleById(id: string): Promise<UnifiedStyle | null> {
    try {
        const docRef = doc(db, STYLES_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                ...data,
                id: docSnap.id,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as UnifiedStyle;
        }
        return null;
    } catch (error) {
        console.error('Error fetching style:', error);
        return null;
    }
}

/**
 * Get style by scene ID (PascalCase)
 */
export async function getStyleBySceneId(sceneId: string): Promise<UnifiedStyle | null> {
    try {
        const stylesRef = collection(db, STYLES_COLLECTION);
        const q = query(stylesRef, where('sceneId', '==', sceneId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as UnifiedStyle;
        }
        return null;
    } catch (error) {
        console.error('Error fetching style by sceneId:', error);
        return null;
    }
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Create a new style
 */
export async function createStyle(
    style: Omit<UnifiedStyle, 'createdAt' | 'updatedAt'>
): Promise<string> {
    try {
        const docRef = doc(db, STYLES_COLLECTION, style.id);
        await setDoc(docRef, {
            ...style,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return style.id;
    } catch (error) {
        console.error('Error creating style:', error);
        throw error;
    }
}

/**
 * Update an existing style
 */
export async function updateStyle(
    id: string,
    updates: Partial<Omit<UnifiedStyle, 'id' | 'createdAt'>>
): Promise<void> {
    try {
        const docRef = doc(db, STYLES_COLLECTION, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating style:', error);
        throw error;
    }
}

/**
 * Delete a style
 */
export async function deleteStyle(id: string): Promise<void> {
    try {
        const docRef = doc(db, STYLES_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting style:', error);
        throw error;
    }
}

/**
 * Toggle style active status
 */
export async function toggleStyleActive(id: string, isActive: boolean): Promise<void> {
    await updateStyle(id, { isActive });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Seed styles from default data (for initial setup)
 */
export async function seedStyles(styles: Omit<UnifiedStyle, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
        for (const style of styles) {
            const docRef = doc(db, STYLES_COLLECTION, style.id);
            const existing = await getDoc(docRef);

            if (!existing.exists()) {
                await setDoc(docRef, {
                    ...style,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                console.log(`Seeded style: ${style.name}`);
            }
        }
    } catch (error) {
        console.error('Error seeding styles:', error);
        throw error;
    }
}

/**
 * Check if styles collection is empty
 */
export async function isStylesCollectionEmpty(): Promise<boolean> {
    try {
        const stylesRef = collection(db, STYLES_COLLECTION);
        const snapshot = await getDocs(query(stylesRef));
        return snapshot.empty;
    } catch (error) {
        console.error('Error checking styles collection:', error);
        return true;
    }
}

// ============================================================================
// CONVERSION HELPERS (For Module Integration)
// ============================================================================

/**
 * Get all styles as StyleAgent format (for Module 1)
 */
export async function getAllStyleAgents(): Promise<StyleAgent[]> {
    const styles = await getActiveStyles();
    return styles.map(toStyleAgent);
}

/**
 * Get all styles as StyleConfig format (for Module 2)
 */
export async function getAllStyleConfigs(): Promise<StyleConfig[]> {
    const styles = await getActiveStyles();
    return styles.map(toStyleConfig);
}

/**
 * Get StyleAgent by ID
 */
export async function getStyleAgent(id: string): Promise<StyleAgent | null> {
    const style = await getStyleById(id);
    return style ? toStyleAgent(style) : null;
}

/**
 * Get StyleConfig by scene ID
 */
export async function getStyleConfig(sceneId: string): Promise<StyleConfig | null> {
    const style = await getStyleBySceneId(sceneId);
    return style ? toStyleConfig(style) : null;
}
