import { Case, ReportPayload, Stats, User } from './types';

const TOKEN_KEY = 'pci.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async me(): Promise<{ user: User }> {
    return request('/auth/me');
  },
  async stats(): Promise<Stats> {
    return request('/stats');
  },
  async listCases(params: { status?: string; q?: string } = {}): Promise<{ cases: Case[] }> {
    const qs = new URLSearchParams();
    if (params.status && params.status !== 'all') qs.set('status', params.status);
    if (params.q) qs.set('q', params.q);
    const suffix = qs.toString() ? `?${qs}` : '';
    return request(`/cases${suffix}`);
  },
  async getCase(accession: string): Promise<{ case: Case }> {
    return request(`/cases/${encodeURIComponent(accession)}`);
  },
  async createCase(body: { biomarker: string; site?: string; specimen?: string }): Promise<{ case: Case }> {
    return request('/cases', { method: 'POST', body: JSON.stringify(body) });
  },
  async scoreCase(accession: string): Promise<{ case: Case }> {
    return request(`/cases/${encodeURIComponent(accession)}/score`, { method: 'POST' });
  },
  async finalizeCase(accession: string): Promise<{ case: Case }> {
    return request(`/cases/${encodeURIComponent(accession)}/finalize`, { method: 'POST' });
  },
  async getReport(accession: string): Promise<{ report: ReportPayload }> {
    return request(`/cases/${encodeURIComponent(accession)}/report`);
  },
  async addAnnotation(
    accession: string,
    body: { microns: number; rect?: { x: number; y: number; width: number; height: number } },
  ): Promise<{ case: Case }> {
    return request(`/cases/${encodeURIComponent(accession)}/annotations`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
