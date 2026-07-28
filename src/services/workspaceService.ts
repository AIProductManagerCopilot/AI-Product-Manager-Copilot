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
<<<<<<< HEAD
import { db, auth } from '../config/firebase';
=======
import { db } from '../config/firebase';
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d

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
<<<<<<< HEAD
  targetAudience?: string; // Standard string input from UI forms
=======
  targetAudience?: string;
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
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

<<<<<<< HEAD
// ─── FastAPI Payload Schemas ──────────────────────────────────────────────────

export interface CreateProjectPayload {
  name: string;
  description?: string;
  target_audience?: string[];
}

=======
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
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

<<<<<<< HEAD
// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLLECTION = 'workspaces';
const BASE_URL = '/api/v1';

async function getAuthHeader(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) return {};
  const token = await currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
=======
// ─── Firestore Collection Reference ──────────────────────────────────────────

const COLLECTION = 'workspaces';
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d

// ─── Service Methods ─────────────────────────────────────────────────────────

export const workspaceService = {
<<<<<<< HEAD
  // ── FastAPI Integrated Endpoints ──────────────────────────────────────────

  /**
   * Fetch all projects directly from FastAPI backend.
   */
  async getWorkspacesFromApi() {
    const headers = await getAuthHeader();
    const response = await fetch(`${BASE_URL}/projects`, { headers });
    if (!response.ok) throw new Error('Failed to fetch workspaces from backend');
    return await response.json();
  },

  /**
   * Create a new project via FastAPI backend (supports target_audience list).
   */
  async createWorkspaceApi(payload: CreateProjectPayload) {
    const headers = await getAuthHeader();
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create workspace via backend');
    return await response.json();
  },

  /**
   * Fetch analytics for a given project from FastAPI backend.
   */
  async getWorkspaceAnalytics(projectId: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${BASE_URL}/analytics/${projectId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch analytics from backend');
    return await response.json();
  },

  // ── Firestore / Real-Time Client Operations ────────────────────────────────

=======
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
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
<<<<<<< HEAD
   * Create a new workspace (syncs both to Firestore and FastAPI backend).
=======
   * Create a new workspace for the user.
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
   */
  async createWorkspace(
    userId: string,
    formData: WorkspaceFormData,
    ownerName: string,
    ownerAvatar: string
  ): Promise<string> {
<<<<<<< HEAD
    // 1. Sync to FastAPI Backend
    try {
      const targetAudienceList = formData.targetAudience
        ? formData.targetAudience.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await this.createWorkspaceApi({
        name: formData.workspaceName,
        description: formData.description,
        target_audience: targetAudienceList,
      });
    } catch (apiError) {
      console.warn('FastAPI backend sync warning during creation:', apiError);
    }

    // 2. Persist in Firestore for local UI real-time listeners
=======
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
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
<<<<<<< HEAD
};
=======
};
>>>>>>> 42b4670d97b915d3bb70c75a65efdc71f3a87b1d
