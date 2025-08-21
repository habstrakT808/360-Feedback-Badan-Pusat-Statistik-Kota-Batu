// Simple client-side draft storage using localStorage
// Key format suggestion:
// - Regular user: draft:regular:{assessorId}:{assignmentId}
// - Supervisor:   draft:supervisor:{assessorId}:{assesseeId}:{periodId}

type DraftData = Record<string, { rating?: number; comment?: string }>

export const DraftService = {
  get(key: string): DraftData | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as DraftData) : null
    } catch {
      return null
    }
  },

  save(key: string, data: DraftData) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {}
  },

  clear(key: string) {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {}
  }
}


