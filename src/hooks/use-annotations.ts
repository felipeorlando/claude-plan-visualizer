import { useState, useCallback, useMemo } from 'react'

export type AnnotationType = 'comment' | 'delete' | 'replace' | 'insert'

export interface Annotation {
  id: string
  type: AnnotationType
  originalText: string
  comment: string
  /** Character offsets for locating the text */
  startOffset: number
  endOffset: number
  createdAt: number
}

export interface UseAnnotationsReturn {
  annotations: Annotation[]
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => Annotation
  updateAnnotation: (id: string, updates: Partial<Pick<Annotation, 'comment' | 'type'>>) => void
  deleteAnnotation: (id: string) => void
  clearAnnotations: () => void
  selectedAnnotationId: string | null
  selectAnnotation: (id: string | null) => void
}

let nextId = 1

export function useAnnotations(): UseAnnotationsReturn {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedAnnotationId, selectAnnotation] = useState<string | null>(null)

  const addAnnotation = useCallback(
    (data: Omit<Annotation, 'id' | 'createdAt'>): Annotation => {
      const annotation: Annotation = {
        ...data,
        id: `ann-${nextId++}`,
        createdAt: Date.now(),
      }
      setAnnotations((prev) => [...prev, annotation])
      selectAnnotation(annotation.id)
      return annotation
    },
    []
  )

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<Pick<Annotation, 'comment' | 'type'>>) => {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      )
    },
    []
  )

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
    selectAnnotation((prev) => (prev === id ? null : prev))
  }, [])

  const clearAnnotations = useCallback(() => {
    setAnnotations([])
    selectAnnotation(null)
  }, [])

  return useMemo(
    () => ({
      annotations,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      clearAnnotations,
      selectedAnnotationId,
      selectAnnotation,
    }),
    [annotations, addAnnotation, updateAnnotation, deleteAnnotation, clearAnnotations, selectedAnnotationId]
  )
}

export function annotationTypeLabel(type: AnnotationType): string {
  switch (type) {
    case 'comment': return 'Comment'
    case 'delete': return 'Delete'
    case 'replace': return 'Replace'
    case 'insert': return 'Insert'
  }
}

export function annotationTypeColor(type: AnnotationType): string {
  switch (type) {
    case 'comment': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
    case 'delete': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
    case 'replace': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
    case 'insert': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
  }
}

export function annotationHighlightClass(type: AnnotationType): string {
  switch (type) {
    case 'comment': return 'annotation-highlight-comment'
    case 'delete': return 'annotation-highlight-delete'
    case 'replace': return 'annotation-highlight-replace'
    case 'insert': return 'annotation-highlight-insert'
  }
}

export function exportAnnotationsMarkdown(annotations: Annotation[], title: string): string {
  if (annotations.length === 0) return ''
  const sorted = [...annotations].sort((a, b) => a.createdAt - b.createdAt)
  const lines = [`## Annotations for ${title}`, '']
  for (const ann of sorted) {
    const label = annotationTypeLabel(ann.type)
    const preview =
      ann.originalText.length > 120
        ? ann.originalText.slice(0, 120) + '...'
        : ann.originalText
    lines.push(`### [${label}] "${preview}"`)
    if (ann.comment) {
      lines.push(`> ${ann.comment}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
