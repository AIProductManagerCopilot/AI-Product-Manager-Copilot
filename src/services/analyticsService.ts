import { auth } from '../config/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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

export interface BackendCluster {
  category?: string;
  total_volume?: number;
  avg_sentiment?: number;
  avg_severity?: number;
  priority_score?: number;
  id?: string;
  name?: string;
  theme?: string;
  count?: number;
  mentions?: number;
  severity?: 'High' | 'Medium' | 'Low';
  pct_total?: string;
  quote?: string;
}

export interface BackendTrend {
  category?: string;
  trajectory?: 'rising' | 'falling' | 'stable';
  current_volume?: number;
  history?: Array<{ time_bucket: string; volume: number; avg_sentiment: number }>;
  period?: string;
  count?: number;
  trend_pct?: number;
}

export const analyticsService = {
  /**
   * Fetch prioritized theme clusters and customer pain points directly from FastAPI backend.
   * Endpoint: GET /api/v1/analytics/clusters
   */
  async getThemeClusters(startDate?: string, endDate?: string): Promise<BackendCluster[]> {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const url = `${BASE_URL}/analytics/clusters${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : (json?.data || []);
    } catch (error) {
      console.warn('Backend /analytics/clusters fetch failed, returning default telemetry:', error);
      return [];
    }
  },

  /**
   * Fetch category trajectory vectors and historical trend buckets directly from FastAPI backend.
   * Endpoint: GET /api/v1/analytics/trends
   */
  async getThemeTrends(timeWindowDays = 30): Promise<BackendTrend[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/analytics/trends?time_window_days=${timeWindowDays}`, { headers });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : (json?.data || []);
    } catch (error) {
      console.warn('Backend /analytics/trends fetch failed, returning default telemetry:', error);
      return [];
    }
  },

  /**
   * Stream copilot AI responses using SSE endpoint.
   * Endpoint: POST /api/v1/ai/stream
   */
  async streamCopilotAI(query: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ query }),
      });

      if (!res.body) throw new Error('Response body missing');
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        onChunk(text);
      }
    } catch (error) {
      console.error('Copilot AI streaming failed:', error);
      onChunk('AI assistant connection currently unavailable.');
    }
  },

  /**
   * Stream RAG-grounded PRD generation using SSE endpoint.
   * Endpoint: POST /api/v1/ai/generate-prd
   */
  async streamPRDGeneration(
    payload: {
      feature_name: string;
      user_query: string;
      category_filter?: string;
      limit?: number;
    },
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/ai/generate-prd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      if (!res.body) throw new Error('Response body missing');
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const partLines = line.split('\n');
          for (const pl of partLines) {
            if (pl.startsWith('data:')) {
              const dataStr = pl.substring(5);
              if (dataStr) {
                if (dataStr.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(dataStr.trim());
                    onChunk(parsed.delta || parsed.text || parsed.message || '');
                  } catch {
                    onChunk(dataStr + '\n');
                  }
                } else {
                  onChunk(dataStr + '\n');
                }
              }
            }
          }
        }
      }
      if (buffer.trim().startsWith('data:')) {
        onChunk(buffer.substring(5) + '\n');
      }
    } catch (error) {
      console.error('PRD generation streaming failed:', error);
      onChunk('[ERROR]: Connection to the PRD generation service is currently unavailable.');
    }
  },
};
