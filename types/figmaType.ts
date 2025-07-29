export interface FigmaComment {
  id: string
  message: string
  file_key: string
  parent_id: string
  user: {
    id: string
    handle: string
    img_url?: string
  }
  created_at: string // ISO string
  resolved_at: string | null
  client_meta: {
    node_id?: string[] // Which design elements this comment is on
    node_offset?: { 
      x: number
      y: number 
    }
  }
  reactions: Array<{
    emoji: string
    count: number
    users: Array<{ id: string }>
  }>
}

export interface FigmaFileInfo {
  name: string
  role: 'owner' | 'editor' | 'viewer'
  lastModified: string
  thumbnailUrl: string
  version: string
  nodes: Record<string, any> // File structure (huge object)
  document: {
    id: string
    name: string
    type: string
  }
  components: Record<string, any>
  styles: Record<string, any>
}

export interface FigmaApiError {
  status: number
  err: string
}