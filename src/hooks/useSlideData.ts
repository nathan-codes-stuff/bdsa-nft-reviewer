import { useEffect, useState } from 'react'
import { dsa, type DsaItem, type DsaTileInfo, type DsaAnnotationHeader, type DsaAnnotationDoc } from '../api/dsa'

export interface SlideDataState {
  loading: boolean
  error: string | null
  item: DsaItem | null
  tileInfo: DsaTileInfo | null
  annotations: DsaAnnotationHeader[]
  /** The active annotation document loaded into the editor. */
  activeDoc: DsaAnnotationDoc | null
  activeId: string | null
  fetchedAt: number | null
}

export function useSlideData(itemId: string | undefined) {
  const [state, setState] = useState<SlideDataState>({
    loading: false,
    error: null,
    item: null,
    tileInfo: null,
    annotations: [],
    activeDoc: null,
    activeId: null,
    fetchedAt: null,
  })

  useEffect(() => {
    if (!itemId) return
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    Promise.all([dsa.getItem(itemId), dsa.getTileInfo(itemId), dsa.listAnnotations(itemId)])
      .then(([item, tileInfo, annotations]) => {
        if (cancelled) return
        setState(s => ({
          ...s,
          loading: false,
          error: null,
          item,
          tileInfo,
          annotations,
          fetchedAt: Date.now(),
        }))
      })
      .catch(err => {
        if (cancelled) return
        setState(s => ({ ...s, loading: false, error: String(err?.message || err) }))
      })

    return () => { cancelled = true }
  }, [itemId])

  async function selectAnnotation(annotationId: string) {
    setState(s => ({ ...s, loading: true, error: null, activeId: annotationId }))
    try {
      const doc = await dsa.getAnnotation(annotationId)
      setState(s => ({ ...s, loading: false, activeDoc: doc, activeId: annotationId }))
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: String((err as Error).message || err) }))
    }
  }

  function setActiveDoc(doc: DsaAnnotationDoc | null) {
    setState(s => ({ ...s, activeDoc: doc }))
  }

  function setError(error: string | null) {
    setState(s => ({ ...s, error }))
  }

  return { state, selectAnnotation, setActiveDoc, setError }
}
