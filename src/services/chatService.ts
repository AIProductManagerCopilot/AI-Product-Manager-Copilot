import { auth } from '../config/firebase';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'https://aipm-copilot-backend.onrender.com';
const CLEAN_BASE = RAW_BASE.replace(/\/+$/, '');
const BASE_URL = `${CLEAN_BASE}/api/v1`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return {};
    const token = await currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    console.warn('Failed to retrieve Firebase auth token:', err);
    return {};
  }
}

export interface ChatSession {
  id: string;
  user_id: string;
  workspace_id?: string | null;
  title: string | null;
  summary?: string | null;
  summary_token_count?: number;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionListItem {
  id: string;
  title: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  token_count?: number | null;
  is_summarized?: boolean;
  created_at: string;
}

export interface RAGSource {
  id: string;
  score?: number | null;
  snippet?: string;
  source_type?: string;
}

export interface MemoryCitation {
  fact: string;
  fact_type: string;
}

export interface CopilotStreamOptions {
  prompt: string;
  sessionId?: string;
  workspaceId?: string;
  onChunk: (chunk: string) => void;
  onStatus?: (status: string) => void;
  onMetadata?: (meta: { sources: RAGSource[]; memories: MemoryCitation[] }) => void;
  signal?: AbortSignal;
}

export const chatService = {
  /**
   * Create a new chat session.
   * Endpoint: POST /api/v1/sessions
   */
  async createSession(title?: string, workspaceId?: string): Promise<ChatSession> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        title: title || null,
        workspace_id: workspaceId || null,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create session: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * List sessions for current authenticated user.
   * Endpoint: GET /api/v1/sessions
   */
  async listSessions(includeArchived = false, skip = 0, limit = 50): Promise<ChatSessionListItem[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      include_archived: String(includeArchived),
      skip: String(skip),
      limit: String(limit),
    });

    const res = await fetch(`${BASE_URL}/sessions?${params.toString()}`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list sessions: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Get single session details.
   * Endpoint: GET /api/v1/sessions/:id
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, { headers });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to get session ${sessionId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Update session title or archived status.
   * Endpoint: PATCH /api/v1/sessions/:id
   */
  async updateSession(sessionId: string, payload: { title?: string; is_archived?: boolean }): Promise<ChatSession> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to update session ${sessionId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Delete a chat session.
   * Endpoint: DELETE /api/v1/sessions/:id
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete session ${sessionId}: HTTP ${res.status}`);
    }

    return true;
  },

  /**
   * List messages in a session.
   * Endpoint: GET /api/v1/sessions/:id/messages
   */
  async listMessages(sessionId: string, skip = 0, limit = 100): Promise<ChatMessage[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });

    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages?${params.toString()}`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list messages for session ${sessionId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Post a message to a session.
   * Endpoint: POST /api/v1/sessions/:id/messages
   */
  async createMessage(sessionId: string, content: string, role: 'user' | 'assistant' | 'system' = 'user'): Promise<ChatMessage> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ content, role }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create message in session ${sessionId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Stream copilot inference via full RAG & memory backend endpoint.
   * Endpoint: POST /api/v1/copilot/stream
   */
  async streamCopilot({
    prompt,
    sessionId,
    workspaceId = 'default_workspace',
    onChunk,
    onStatus,
    onMetadata,
    signal,
  }: CopilotStreamOptions): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const payload = {
        prompt,
        correlation_id: `corr-${Date.now()}`,
        workspace_id: workspaceId,
        session_id: sessionId || null,
        temperature: 0.2,
      };

      const res = await fetch(`${BASE_URL}/copilot/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!res.ok) {
        throw new Error(`Copilot streaming failed with status ${res.status}`);
      }

      if (!res.body) throw new Error('Response body missing');
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const trimmedEvent = event.trim();
          if (!trimmedEvent) continue;

          const lines = trimmedEvent.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim();
              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'content' && parsed.content) {
                  onChunk(parsed.content);
                } else if (parsed.type === 'metadata') {
                  if (onMetadata) {
                    onMetadata({
                      sources: parsed.sources || [],
                      memories: parsed.memories || [],
                    });
                  }
                } else if (parsed.type === 'status' && parsed.content) {
                  if (onStatus) onStatus(parsed.content);
                } else if (parsed.type === 'error' && parsed.content) {
                  onChunk(`\n\n*Error: ${parsed.content}*`);
                } else if (parsed.delta) {
                  onChunk(parsed.delta);
                } else if (parsed.text) {
                  onChunk(parsed.text);
                }
              } catch {
                onChunk(dataStr);
              }
            } else if (line.startsWith('event: error')) {
              onChunk('\n\n*Error: Streaming failed.*');
            }
          }
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        if (onStatus) onStatus('Generation stopped by user');
        return;
      }
      console.error('Copilot streaming failed:', error);
      onChunk('\n\n*Error: Connection to AI Copilot memory service unavailable.*');
    }
  },
};