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
      return await res.json();
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
      return await res.json();
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
};
