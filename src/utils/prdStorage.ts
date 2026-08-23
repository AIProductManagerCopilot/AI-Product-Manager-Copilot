export interface StoredPRD {
  id: string;
  title: string;
  version: string;
  time: string;
  status: string;
  summary: string;
  userStories: string[];
  requirements: string[];
  techStack: string;
  metrics: string[];
  content?: string; // Full markdown specification
}

const STORAGE_KEY = 'aipm_generated_prds_cache';

export const prdStorage = {
  getStoredPRDs: (): StoredPRD[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePRD: (title: string, fullMarkdown: string): StoredPRD => {
    const existing = prdStorage.getStoredPRDs();

    // Extract quick summary from Markdown for modal preview
    let summary = 'AI-Generated comprehensive product requirement document grounded in customer feedback data.';
    const execMatch = fullMarkdown.match(/## 1\. Executive Summary[\s\S]*?\n\n([\s\S]*?)(?=\n##|$)/i);
    if (execMatch && execMatch[1]) {
      summary = execMatch[1].replace(/###.*?\n/g, '').trim().slice(0, 240) + '...';
    }

    const newPRD: StoredPRD = {
      id: `prd-${Date.now()}`,
      title: title || 'Feature PRD Specification',
      version: 'v1.0',
      time: 'Just now',
      status: 'Completed',
      summary,
      userStories: [
        'As a Product Manager, I want real-time customer sentiment trends to prioritize sprint backlog items.',
        'As an Engineering Lead, I want direct visibility into high-severity user bug reports to reduce MTTR.',
        'As an Executive, I want automated theme extraction summaries to evaluate feature satisfaction.'
      ],
      requirements: [
        'Integrate with FastAPI REST analytics endpoints for live dataset extraction.',
        'Render smooth responsive area chart visualizations adapting to Light and Dark themes.',
        'Filter feedback signals dynamically by date range, severity weight, and category tag.'
      ],
      techStack: 'React 18, TypeScript, Tailwind CSS, FastAPI, PostgreSQL, Qdrant Vector DB',
      metrics: [
        'Increase weekly active Product Manager engagement by 40%.',
        'Reduce theme extraction review time from 5 days to 15 seconds.',
        'Maintain 99.9% uptime on backend analytics query routes.'
      ],
      content: fullMarkdown
    };

    // Filter out duplicates with same title and prepend new one to top
    const updated = [newPRD, ...existing.filter(p => p.title !== title)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newPRD;
  }
};