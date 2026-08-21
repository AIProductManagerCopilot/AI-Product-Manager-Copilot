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

export interface ExecutiveKPIs {
  total_feedback: number;
  open_tickets: number;
  completed_features: number;
  total_projects: number;
}

export interface FeatureDemandObject {
  total_feature_requests?: number;
  high_priority_requests?: number;
  avg_sentiment?: number;
  top_requested_themes?: string[] | any[];
}

export interface FeatureDemandItem {
  category: string;
  request_count: number;
  total_upvotes: number;
}

export interface ExecutiveSummaryData {
  kpis: ExecutiveKPIs;
  top_pain_points: BackendCluster[];
  feature_request_demand: FeatureDemandObject | FeatureDemandItem[] | any;
}

export const analyticsService = {
  /**
   * Fetch system-wide KPIs, top pain points, and feature demand for executive reporting.
   * Endpoint: GET /api/v1/analytics/executive-summary
   */
  async getExecutiveSummary(projectId?: string): Promise<ExecutiveSummaryData | null> {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);

      const url = `${BASE_URL}/analytics/executive-summary${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const json = await res.json();
      return json?.data || null;
    } catch (error) {
      console.warn('Backend /analytics/executive-summary fetch failed:', error);
      return null;
    }
  },
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
      if (Array.isArray(json)) return json;
      if (json?.data?.trends && Array.isArray(json.data.trends)) return json.data.trends;
      return json?.data || [];
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

      if (!res.ok) {
        throw new Error(`Streaming failed with status ${res.status}`);
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

              if (dataStr.startsWith('{')) {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.delta) {
                    onChunk(parsed.delta);
                  } else if (parsed.text) {
                    onChunk(parsed.text);
                  } else if (parsed.message) {
                    onChunk(parsed.message);
                  } else if (parsed.error) {
                    onChunk(`\n\n*Error: ${parsed.error}*`);
                  }
                } catch {
                  onChunk(dataStr);
                }
              } else if (dataStr.startsWith('[ERROR]:')) {
                onChunk(`\n\n*Error: ${dataStr.replace('[ERROR]:', '').trim()}*`);
              } else {
                onChunk(dataStr);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Copilot AI streaming failed:', error);
      onChunk('\n\n*Error: AI assistant connection currently unavailable.*');
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

      if (!res.ok) {
        throw new Error(`PRD generation failed with status ${res.status}`);
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

              if (dataStr.startsWith('{')) {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.delta) {
                    onChunk(parsed.delta);
                  } else if (parsed.text) {
                    onChunk(parsed.text);
                  } else if (parsed.message) {
                    onChunk(parsed.message);
                  } else if (parsed.error) {
                    onChunk(`\n\n*Error: ${parsed.error}*`);
                  }
                } catch {
                  onChunk(dataStr + '\n');
                }
              } else if (dataStr.startsWith('[ERROR]:')) {
                onChunk(`\n\n*Error: ${dataStr.replace('[ERROR]:', '').trim()}*`);
              } else {
                onChunk(dataStr + '\n');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('PRD generation streaming failed:', error);
      onChunk('\n\n*Error: Connection to the PRD generation service is currently unavailable.*');
    }
  },
};