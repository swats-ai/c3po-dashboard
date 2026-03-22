import { Task, Summary } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('c3po_token') || '';
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function getSummary(): Promise<Summary> {
  return apiFetch<Summary>('/api/v1/dashboard/summary');
}

export async function getTasks(): Promise<Task[]> {
  const data = await apiFetch<Task[]>('/api/v1/tasks?page=1&page_size=100&sort_by=updated_at&sort_order=desc');
  return Array.isArray(data) ? data : [];
}

export async function getTaskDetail(taskId: number): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/api/v1/tasks/${taskId}`);
}

export async function getAgentsSummary(): Promise<Record<string, unknown>[]> {
  return apiFetch<Record<string, unknown>[]>('/api/v1/agents/summary');
}

export async function getTaskAgentRuns(taskId: number): Promise<Record<string, unknown>[]> {
  return apiFetch<Record<string, unknown>[]>(`/api/v1/tasks/${taskId}/agent-runs`);
}

export async function getLogs(): Promise<Record<string, unknown>[]> {
  return apiFetch<Record<string, unknown>[]>('/api/v1/logs/recent?page_size=100');
}

export async function testAuth(): Promise<boolean> {
  try {
    await apiFetch('/api/v1/health');
    return true;
  } catch { return false; }
}

export function setToken(token: string) {
  localStorage.setItem('c3po_token', token);
}

export function clearToken() {
  localStorage.removeItem('c3po_token');
}

export function hasToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('c3po_token');
}
