// src/services/feedbackService.ts
//
// Feedback Ingestion API service — mirrors the pattern in workspaceService.ts.
// All calls go through the Vite proxy (/api → http://127.0.0.1:8000).

import { auth } from '../config/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeedbackPayload {
  content: string;
  source: string;
  priority?: string;
}

export interface AIInsights {
  theme?: string;
  summary?: string;
  sentiment?: string;
  urgency_score?: number;
  [key: string]: unknown;
}

export interface ProcessedFeedbackEntry {
  id: string;
  project_id: string;
  content: string;
  cleaned_content: string;
  source: string;
  status: string;
  ai_insights: AIInsights | null;
  submitted_at?: string;
}

export interface FeedbackListResponse {
  project_id: string;
  entries: ProcessedFeedbackEntry[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = '/api/v1';

// Default project ID matching the seeded database record in seed_db.py
export const DEFAULT_PROJECT_ID = '11111111-1111-1111-1111-111111111111';

async function getAuthHeader(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) return {};
  try {
    const token = await currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const feedbackService = {
  /**
   * Fetch the list of processed feedback entries for a project from the backend.
   * Returns { entries, total } or throws if the backend is unreachable.
   */
  async getFeedbackEntries(
    projectId: string = DEFAULT_PROJECT_ID,
    limit: number = 50
  ): Promise<FeedbackListResponse> {
    const headers = await getAuthHeader();
    const url = `${BASE_URL}/projects/${projectId}/feedback/?limit=${limit}`;
    console.log('[feedbackService] GET', url);
    const response = await fetch(url, { headers });
    console.log('[feedbackService] GET response status:', response.status);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[feedbackService] GET failed:', response.status, body);
      throw new Error(`GET /feedback failed: ${response.status} ${body}`);
    }
    return response.json() as Promise<FeedbackListResponse>;
  },

  /**
   * Submit a single feedback item to the backend for AI processing.
   * Calls POST /api/v1/projects/{project_id}/feedback/
   */
  async submitFeedback(
    payload: FeedbackPayload,
    projectId: string = DEFAULT_PROJECT_ID
  ): Promise<ProcessedFeedbackEntry> {
    const headers = await getAuthHeader();
    const response = await fetch(`${BASE_URL}/projects/${projectId}/feedback/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        (errorBody as { detail?: string }).detail ?? `POST /feedback failed: ${response.status}`
      );
    }
    return response.json() as Promise<ProcessedFeedbackEntry>;
  },

  /**
   * Parse a plain text / CSV file and submit each non-empty line as a separate
   * feedback entry. Calls submitFeedback() for every line and reports progress
   * via the onProgress callback (0–100).
   *
   * Returns an array of all successfully processed entries.
   */
  async uploadFeedbackFile(
    file: File,
    projectId: string = DEFAULT_PROJECT_ID,
    onProgress?: (pct: number) => void
  ): Promise<ProcessedFeedbackEntry[]> {
    const text = await file.text();

    // Split on newlines; each non-empty line becomes one feedback item.
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 5); // minimum 5 chars matches backend validation

    if (lines.length === 0) {
      throw new Error('File has no readable content (minimum 5 characters per line).');
    }

    const results: ProcessedFeedbackEntry[] = [];

    for (let i = 0; i < lines.length; i++) {
      try {
        const entry = await feedbackService.submitFeedback(
          { content: lines[i], source: `File Upload — ${file.name}`, priority: 'Medium' },
          projectId
        );
        results.push(entry);
      } catch {
        // Skip lines that fail (e.g. too short after cleaning) but continue processing
        console.warn(`Skipping line ${i + 1} due to processing error.`);
      }

      // Report progress after each item
      onProgress?.(Math.round(((i + 1) / lines.length) * 100));
    }

    return results;
  },
};
