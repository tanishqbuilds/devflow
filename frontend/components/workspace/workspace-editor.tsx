'use client'

import { createContext, useContext, useEffect, useState, type ReactNode, type KeyboardEvent } from 'react'
import { Edit3, History, Save, Undo2, Check, Sparkles } from 'lucide-react'
import { editProjectContent, projectHistory, undoProject } from '@/lib/api'
import { useProjectStore } from '@/lib/project-store'

type EditContextValue = {
  editing: boolean
  setEditing: (val: boolean) => void
  saveField: (path: string, value: any) => Promise<void>
}

const EditContext = createContext<EditContextValue | null>(null)

export function useWorkspaceEdit() {
  return useContext(EditContext)
}

export function WorkspaceEditProvider({ children }: { children: ReactNode }) {
  const project = useProjectStore((s) => s.project)
  const setProject = useProjectStore((s) => s.setProject)
  const [editing, setEditing] = useState(false)

  const saveField = async (path: string, value: any) => {
    if (!project) return
    try {
      const result = await editProjectContent(project.id, path, value, project.revision || 0)
      setProject(result.project)
    } catch (err) {
      console.error('Failed to save field:', path, err)
    }
  }

  return (
    <EditContext.Provider value={{ editing, setEditing, saveField }}>
      <div className="relative">
        <EditToolbar editing={editing} setEditing={setEditing} />
        {children}
      </div>
    </EditContext.Provider>
  )
}

function EditToolbar({ editing, setEditing }: { editing: boolean; setEditing: (value: boolean) => void }) {
  const project = useProjectStore((s) => s.project)
  const setProject = useProjectStore((s) => s.setProject)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [savedNotice, setSavedNotice] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  if (!project) return null

  const undo = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await undoProject(project.id)
      setProject(res.project)
    } catch (e: any) {
      setError(e.message || 'Nothing to undo')
      setTimeout(() => setError(''), 3000)
    } finally {
      setBusy(false)
    }
  }

  const loadHistory = async () => {
    if (showHistory) {
      setShowHistory(false)
      return
    }
    try {
      const res = await projectHistory(project.id)
      setHistory(res.history || [])
      setShowHistory(true)
    } catch (e: any) {
      setError(e.message || 'Could not load history')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="sticky top-2 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 px-4 py-2.5 rounded-2xl shadow-xs">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-600">
          <span>Revision {project.revision || 0}</span>
        </div>
        {editing ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 animate-pulse">
            <Edit3 className="w-3.5 h-3.5" /> Edit Mode Active — Click any text/heading to edit
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            Click &quot;Edit Mode&quot; to customize any text, title, or description
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditing(!editing)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
            editing
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {editing ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
          {editing ? 'Done Editing' : 'Edit Mode'}
        </button>

        <button
          onClick={undo}
          disabled={busy || !project.revision}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Undo2 className="h-3.5 w-3.5 text-slate-500" />
          Undo
        </button>

        <button
          onClick={loadHistory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <History className="h-3.5 w-3.5 text-slate-500" />
          History
        </button>
      </div>

      {error && <div className="w-full text-xs text-rose-600 mt-1">{error}</div>}

      {showHistory && history.length > 0 && (
        <div className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-h-48 overflow-y-auto">
          <div className="font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
            <span>Change History</span>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          <div className="space-y-1">
            {history.map((h: any) => (
              <div key={h.revision} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0 font-mono text-[11px]">
                <span className="font-semibold text-blue-600">v{h.revision}</span>
                <span className="text-slate-500 truncate max-w-xs">{h.path}</span>
                <span className="text-slate-400">{new Date(h.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function InlineEditable({
  path,
  value,
  multiline = false,
  className = '',
  placeholder = 'Click to edit...',
  as: Component = 'span',
}: {
  path: string
  value: any
  multiline?: boolean
  className?: string
  placeholder?: string
  as?: any
}) {
  const editor = useContext(EditContext)
  const strVal = value != null ? String(value) : ''
  const [draft, setDraft] = useState(strVal)
  const [saving, setSaving] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setDraft(strVal)
  }, [strVal])

  if (!editor?.editing) {
    if (!strVal && placeholder) {
      return <Component className={`text-slate-400 italic ${className}`}>{placeholder}</Component>
    }
    return <Component className={className}>{strVal}</Component>
  }

  const commit = async () => {
    setIsFocused(false)
    if (draft === strVal || saving) return
    setSaving(true)
    try {
      await editor.saveField(path, draft)
    } finally {
      setSaving(false)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      setDraft(strVal)
      event.currentTarget.blur()
    }
    if (event.key === 'Enter' && !multiline) {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const inputClass = `w-full rounded-lg border-2 border-blue-400 bg-blue-50/50 px-2 py-1 text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-all ${
    saving ? 'opacity-50' : ''
  } ${className}`

  if (multiline) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        disabled={saving}
        placeholder={placeholder}
        rows={Math.max(2, Math.min(8, draft.split('\n').length || 2))}
        className={inputClass}
        aria-label={`Edit ${path}`}
      />
    )
  }

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      disabled={saving}
      placeholder={placeholder}
      className={inputClass}
      aria-label={`Edit ${path}`}
    />
  )
}

// Kept for backward compatibility
export function WorkspaceEditor() {
  return null
}

