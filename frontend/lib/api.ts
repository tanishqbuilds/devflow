// Client for the PlanForge backend. The frontend talks ONLY to the backend
// (never directly to ai-services). The browser always reaches the backend on
// the host-published port, regardless of where the frontend itself runs.
import type { ProjectDoc } from './project-types'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010').replace(/\/$/, '')

export function apiBase(): string {
  return API_BASE
}

export function wsBase(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL
  if (explicit) return explicit.replace(/\/$/, '')
  return API_BASE.replace(/^http/, 'ws')
}

export function streamUrl(projectId: string): string {
  return `${wsBase()}/projects/${projectId}/stream`
}

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body?.detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`)
  }
  return res.json()
}

export async function analyzeProject(
  idea: string,
  title?: string,
): Promise<{ project_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/projects/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, title }),
  })
  return jsonOrThrow(res)
}

export type MigrationSource = 'spec' | 'file' | 'repo' | 'tickets'

/**
 * Reconstruct a full PlanForge plan from an existing project's artifacts
 * (a pasted spec/PRD, an uploaded CSV/doc, a ticket list, or a repo URL).
 * The backend seeds the same 8-agent pipeline with this content.
 */
export async function migrateProject(payload: {
  source: MigrationSource
  content: string
  title?: string
}): Promise<{ project_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/projects/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return jsonOrThrow(res)
}

/** Ask the project assistant a question grounded in the project's plan. */
export async function askAssistant(
  projectId: string,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })
  return jsonOrThrow(res)
}

export async function getProject(projectId: string): Promise<ProjectDoc> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, { cache: 'no-store' })
  return jsonOrThrow(res)
}

export async function listProjects(): Promise<{ projects: Partial<ProjectDoc>[] }> {
  const res = await fetch(`${API_BASE}/projects`, { cache: 'no-store' })
  return jsonOrThrow(res)
}

export async function getAgents(): Promise<{ agents: { id: string; name: string; role: string; node: string }[] }> {
  const res = await fetch(`${API_BASE}/agents`, { cache: 'no-store' })
  return jsonOrThrow(res)
}
