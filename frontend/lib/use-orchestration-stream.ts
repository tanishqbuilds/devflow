'use client'

import { useEffect } from 'react'
import { getProject, streamUrl } from './api'
import { useProjectStore } from './project-store'
import type { OrchestrationEvent } from './project-types'

/**
 * Connects to the backend WebSocket for a project, applies streamed
 * orchestration events to the project store, and refetches the authoritative
 * document once the run completes. Falls back to a plain fetch if the socket
 * cannot be established.
 */
export function useOrchestrationStream(projectId: string | null) {
  const applyEvent = useProjectStore((s) => s.applyEvent)
  const setProject = useProjectStore((s) => s.setProject)

  useEffect(() => {
    if (!projectId) return
    let closed = false
    let refetchTimer: ReturnType<typeof setTimeout> | undefined

    // Fallback snapshot in case the socket is slow or blocked.
    getProject(projectId)
      .then((doc) => {
        if (!closed) setProject(doc)
      })
      .catch(() => {})

    let ws: WebSocket
    try {
      ws = new WebSocket(streamUrl(projectId))
    } catch {
      return () => {
        closed = true
      }
    }

    ws.onmessage = (e) => {
      let evt: OrchestrationEvent
      try {
        evt = JSON.parse(e.data)
      } catch {
        return
      }
      applyEvent(evt)
      if (evt.type === 'run_complete' || evt.type === 'stream_end') {
        clearTimeout(refetchTimer)
        refetchTimer = setTimeout(() => {
          if (!closed) getProject(projectId).then(setProject).catch(() => {})
        }, 500)
      }
    }

    return () => {
      closed = true
      clearTimeout(refetchTimer)
      try {
        ws.close()
      } catch {
        /* ignore */
      }
    }
  }, [projectId, applyEvent, setProject])
}
