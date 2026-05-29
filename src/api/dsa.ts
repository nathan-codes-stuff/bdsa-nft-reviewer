import { dsaAuthStore } from 'bdsa-react-components'

/**
 * Thin DSA / Girder REST wrapper. All requests are authenticated via the
 * shared `dsaAuthStore`. Errors are surfaced verbatim — never swallowed.
 *
 * Endpoints used:
 *  - GET /item/:id                          (slide metadata)
 *  - GET /item/:id/tiles                    (tile metadata; verifies large_image plugin)
 *  - GET /annotation?itemId=:id&limit=0     (list of annotation docs on item)
 *  - GET /annotation/:id                    (full annotation document with elements)
 *  - GET /annotation/:id/geojson            (FeatureCollection variant)
 *  - PUT /annotation/:id                    (update annotation)
 *  - POST /annotation?itemId=:id            (create new annotation doc)
 */

export interface DsaItem {
  _id: string
  name: string
  folderId?: string
  meta?: Record<string, unknown>
  largeImage?: { sourceName?: string }
  [key: string]: unknown
}

export interface DsaTileInfo {
  sizeX: number
  sizeY: number
  tileWidth: number
  tileHeight: number
  levels: number
  magnification?: number
  mm_x?: number
  mm_y?: number
}

export interface DsaAnnotationHeader {
  _id: string
  _elementCount?: number
  _version?: number
  itemId: string
  created?: string
  updated?: string
  creatorId?: string
  updatedId?: string
  annotation: {
    name: string
    description?: string
    attributes?: Record<string, unknown>
    elements?: never
  }
}

export interface DsaAnnotationElement {
  id?: string
  type: string
  group?: string
  label?: { value?: string }
  center?: [number, number, number]
  width?: number
  height?: number
  rotation?: number
  points?: Array<[number, number] | [number, number, number]>
  lineColor?: string
  fillColor?: string
  user?: Record<string, unknown>
  [key: string]: unknown
}

export interface DsaAnnotationDoc {
  _id: string
  itemId: string
  _version?: number
  annotation: {
    name: string
    description?: string
    elements: DsaAnnotationElement[]
    attributes?: Record<string, unknown>
  }
}

class DsaApiError extends Error {
  status: number
  url: string
  body: string
  constructor(message: string, status: number, url: string, body: string) {
    super(message)
    this.name = 'DsaApiError'
    this.status = status
    this.url = url
    this.body = body
  }
}

function baseUrl(): string {
  const { serverUrl } = dsaAuthStore.getStatus()
  if (!serverUrl) throw new Error('DSA server URL not configured')
  return `${serverUrl}/api/v1`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl()}${path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...dsaAuthStore.getAuthHeaders(), ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new DsaApiError(
      `DSA ${res.status} ${res.statusText} on ${path}`,
      res.status,
      url,
      body,
    )
  }
  return (await res.json()) as T
}

export const dsa = {
  baseUrl,

  async getItem(itemId: string): Promise<DsaItem> {
    return request(`/item/${encodeURIComponent(itemId)}`)
  },

  async getTileInfo(itemId: string): Promise<DsaTileInfo> {
    return request(`/item/${encodeURIComponent(itemId)}/tiles`)
  },

  dziUrl(itemId: string): string {
    return `${baseUrl()}/item/${encodeURIComponent(itemId)}/tiles/dzi.dzi`
  },

  async listAnnotations(itemId: string): Promise<DsaAnnotationHeader[]> {
    return request(
      `/annotation?itemId=${encodeURIComponent(itemId)}&limit=0&offset=0&sort=lowerName&sortdir=1`,
    )
  },

  async getAnnotation(annotationId: string): Promise<DsaAnnotationDoc> {
    return request(`/annotation/${encodeURIComponent(annotationId)}`)
  },

  async updateAnnotation(
    annotationId: string,
    body: { name?: string; description?: string; elements: DsaAnnotationElement[] },
  ): Promise<DsaAnnotationDoc> {
    return request(`/annotation/${encodeURIComponent(annotationId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  async createAnnotation(
    itemId: string,
    body: { name: string; description?: string; elements: DsaAnnotationElement[] },
  ): Promise<DsaAnnotationDoc> {
    return request(`/annotation?itemId=${encodeURIComponent(itemId)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

export { DsaApiError }
