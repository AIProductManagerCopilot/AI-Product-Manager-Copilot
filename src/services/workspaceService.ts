import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductType =
  | 'AI Product'
  | 'Web Application'
  | 'Mobile App'
  | 'Healthcare'
  | 'Finance'
  | 'Education'
  | 'E-Commerce'
  | 'Gaming'
  | 'Travel';

export type ProductStage =
  | 'Idea'
  | 'Research'
  | 'Planning'
  | 'Development'
  | 'Testing'
  | 'Production';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Workspace {
  id: string;
  ownerId: string;
  workspaceName: string;
  description: string;
  productType: ProductType;
  stage: ProductStage;
  priority: Priority;
  businessGoal?: string;
  targetAudience?: string;
  teamSize?: number;
  documentsCount: number;
  chatCount: number;
  status: 'active' | 'archived';
  progress: number; // 0-100
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  ownerName?: string;
  ownerAvatar?: string;
}

export type WorkspaceFormData = Omit<
  Workspace,
  'id' | 'ownerId' | 'documentsCount' | 'chatCount' | 'status' | 'progress' | 'createdAt' | 'updatedAt'
>;

// ─── PRODUCT TYPE ICONS ───────────────────────────────────────────────────────

export const PRODUCT_TYPE_ICONS: Record<ProductType, string> = {
  'AI Product': '🤖',
  'Web Application': '🌐',
  'Mobile App': '📱',
  'Healthcare': '🏥',
  'Finance': '💰',
  'Education': '📚',
  'E-Commerce': '🛒',
  'Gaming': '🎮',
  'Travel': '✈️',
};

export const STAGE_COLORS: Record<ProductStage, string> = {
  Idea: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Research: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Planning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Development: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  Testing: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Production: 'text-green-400 bg-green-400/10 border-green-400/20',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  Low: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  Medium: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  High: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Critical: 'text-red-400 bg-red-400/10 border-red-400/20',
};

// ─── Firestore Collection Reference ──────────────────────────────────────────

const COLLECTION = 'workspaces';

// ─── Service Methods ─────────────────────────────────────────────────────────

export const workspaceService = {
  /**
   * Subscribe to real-time workspace updates for the logged-in user.
   */
  subscribeToUserWorkspaces(
    userId: string,
    onData: (workspaces: Workspace[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', userId),
      where('status', '!=', 'archived'),
      orderBy('status'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const workspaces: Workspace[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Workspace, 'id'>),
        }));
        onData(workspaces);
      },
      (error) => {
        console.error('Workspace listener error:', error);
        onError?.(error as Error);
      }
    );
  },

  /**
   * Create a new workspace for the user.
   */
  async createWorkspace(
    userId: string,
    formData: WorkspaceFormData,
    ownerName: string,
    ownerAvatar: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...formData,
      ownerId: userId,
      ownerName,
      ownerAvatar,
      documentsCount: 0,
      chatCount: 0,
      status: 'active',
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Get a single workspace by ID (validates ownership).
   */
  async getWorkspace(workspaceId: string, userId: string): Promise<Workspace | null> {
    const docRef = doc(db, COLLECTION, workspaceId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data() as Omit<Workspace, 'id'>;
    if (data.ownerId !== userId) {
      console.warn('Access denied: workspace does not belong to this user.');
      return null;
    }

    return { id: docSnap.id, ...data };
  },

  /**
   * Update workspace fields.
   */
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<WorkspaceFormData>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION, workspaceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Soft-delete: archive a workspace.
   */
  async archiveWorkspace(workspaceId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, workspaceId);
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Hard-delete a workspace document.
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, workspaceId);
    await deleteDoc(docRef);
  },

  /**
   * Duplicate a workspace (creates a copy with "(Copy)" appended to name).
   */
  async duplicateWorkspace(workspace: Workspace): Promise<string> {
    const { id, createdAt, updatedAt, ...rest } = workspace;
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...rest,
      workspaceName: `${workspace.workspaceName} (Copy)`,
      documentsCount: 0,
      chatCount: 0,
      progress: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Get all archived workspaces for a user.
   */
  async getArchivedWorkspaces(userId: string): Promise<Workspace[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', userId),
      where('status', '==', 'archived'),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Workspace, 'id'>),
    }));
  },
};
