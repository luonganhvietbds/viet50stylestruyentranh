
import { db, functions } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  updateDoc,
  addDoc,
  where,
  deleteDoc,
  writeBatch // Import thêm writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { UserProfile, StyleAgent, UserRole, TransactionRequest } from '../types';
import { AGENTS as DEFAULT_AGENTS } from '../data/agents';

// --- USER MANAGEMENT ---

export const createUserProfile = async (user: any, name?: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    // Defensive: Ensure no undefined values are sent to Firestore
    const safeEmail = user.email || '';
    const safePhoto = user.photoURL || '';
    const safeName = name || user.displayName || 'User';

    if (!snapshot.exists()) {
      const newUser: UserProfile = {
        uid: user.uid,
        email: safeEmail,
        displayName: safeName,
        photoURL: safePhoto,
        role: 'free', // Default role
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);
    } else {
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString()
      });
    }
  } catch (error) {
    // Log error but don't crash the auth flow
    console.error("Error creating/updating user profile:", error);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  // Propagate error to let the UI know if permissions fail
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

/**
 * Calls Cloud Function 'adminUpdateUser' to securely update a user's role or status.
 * Only Admins can execute this.
 */
export const updateUserRole = async (uid: string, newRole: UserRole, status: 'active' | 'banned' = 'active'): Promise<void> => {
  // FALLBACK: Client-side update (Since Cloud Functions might not be deployed)
  // This works because Security Rules allow Admins to update 'users' collection.
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { 
      role: newRole,
      status: status
    });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    throw new Error(error.message || "Failed to update user.");
  }
};

// --- AGENT MANAGEMENT ---

export const getAgentsFromCloud = async (): Promise<StyleAgent[]> => {
  try {
    const agentsRef = collection(db, 'agents');
    const snapshot = await getDocs(agentsRef);
    
    if (snapshot.empty) {
      console.log("No agents in cloud, using default.");
      return DEFAULT_AGENTS;
    }

    const agents = snapshot.docs.map(doc => doc.data() as StyleAgent);
    return agents.length > 0 ? agents : DEFAULT_AGENTS;
  } catch (error) {
    console.warn("Could not fetch agents from cloud (likely permission or network), using defaults:", error);
    return DEFAULT_AGENTS;
  }
};

export const saveAgentToCloud = async (agent: StyleAgent): Promise<void> => {
  try {
    const agentRef = doc(db, 'agents', agent.id);
    await setDoc(agentRef, agent);
  } catch (error) {
    console.error("Error saving agent:", error);
    throw error;
  }
};

export const deleteAgentFromCloud = async (agentId: string): Promise<void> => {
  try {
    const agentRef = doc(db, 'agents', agentId);
    await deleteDoc(agentRef);
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
};

export const saveAllAgentsToCloud = async (agents: StyleAgent[]): Promise<void> => {
  const promises = agents.map(agent => saveAgentToCloud(agent));
  await Promise.all(promises);
};

// --- TRANSACTION MANAGEMENT ---

export const createTransaction = async (uid: string, email: string, plan: 'silver' | 'gold', amount: number): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      uid,
      email,
      plan,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const getPendingTransactions = async (): Promise<TransactionRequest[]> => {
    try {
      const q = query(collection(db, 'transactions'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionRequest));
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      throw error;
    }
};

/**
 * Handles upgrade logic.
 * Uses Client-side Batch Write to ensure Atomicity.
 * Requires Admin privileges via Firestore Rules.
 */
export const approveTransaction = async (transactionId: string) => {
    try {
      // 1. Get Transaction Data
      const transRef = doc(db, 'transactions', transactionId);
      const transSnap = await getDoc(transRef);
      
      if (!transSnap.exists()) {
        throw new Error("Transaction not found");
      }
      
      const transData = transSnap.data() as TransactionRequest;
      if (transData.status === 'approved') {
         return; // Already approved
      }

      // 2. Prepare Batch Write
      const batch = writeBatch(db);
      
      // Update Transaction Status
      batch.update(transRef, { 
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Update User Role
      const userRef = doc(db, 'users', transData.uid);
      batch.update(userRef, {
        role: transData.plan
      });

      // 3. Commit Batch
      await batch.commit();

      return { success: true };
    } catch (error: any) {
      console.error("Error approving transaction:", error);
      throw new Error(error.message || "Failed to approve transaction.");
    }
};
    