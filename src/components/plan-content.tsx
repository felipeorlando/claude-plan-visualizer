import { useState, useEffect, useRef, useCallback, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { LinkIcon } from 'lucide-react'
import { fetchFileContent, type FileContent } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { AnnotationToolbar } from '@/components/annotation-toolbar'
import {
  type Annotation,
  type AnnotationType,
  annotationHighlightClass,
} from '@/hooks/use-annotations'

function HeadingWithAnchor({
  Tag,
  id,
  children,
  ...props
}: ComponentPropsWithoutRef<'h1'> & { Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) {
  return (
    <Tag id={id} {...props}>
      {id && (
        <a href={`#${id}`} className="heading-anchor" aria-hidden="true">
          <LinkIcon className="size-3.5" />
        </a>
      )}
      {children}
    </Tag>
  )
}

const headingComponents = Object.fromEntries(
  (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((tag) => [
    tag,
    (props: ComponentPropsWithoutRef<'h1'>) => <HeadingWithAnchor Tag={tag} {...props} />,
  ])
)

interface PlanContentProps {
  slug: string
  onContentLoaded?: (content: string) => void
  annotations: Annotation[]
  selectedAnnotationId: string | null
  onAddAnnotation: (ann: Omit<Annotation, 'id' | 'createdAt'>) => void
  onSelectAnnotation: (id: string | null) => void
}

export function PlanContent({
  slug,
  onContentLoaded,
  annotations,
  selectedAnnotationId,
  onAddAnnotation,
  onSelectAnnotation,
}: PlanContentProps) {
  const [file, setFile] = useState<FileContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<{ text: string; range: Range } | null>(null)
  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchFileContent(slug)
      .then((data) => {
        setFile(data)
        onContentLoaded?.(data.content)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, onContentLoaded])

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      return
    }
    const range = sel.getRangeAt(0)
    if (!articleRef.current?.contains(range.commonAncestorContainer)) {
      return
    }
    const text = sel.toString().trim()
    if (text.length < 2) return
    setSelection({ text, range: range.cloneRange() })
  }, [])

  const handleAnnotate = useCallback(
    (type: AnnotationType, comment: string, range: Range) => {
      const text = range.toString().trim()
      if (!text) return
      onAddAnnotation({
        type,
        originalText: text,
        comment,
        startOffset: 0,
        endOffset: text.length,
      })
      setSelection(null)
      window.getSelection()?.removeAllRanges()
    },
    [onAddAnnotation]
  )

  const handleCloseToolbar = useCallback(() => {
    setSelection(null)
  }, [])

  // Apply highlights to annotated text in the DOM
  useEffect(() => {
    if (!articleRef.current) return
    // Remove existing highlights
    articleRef.current.querySelectorAll('mark[data-annotation-id]').forEach((mark) => {
      const parent = mark.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
        parent.normalize()
      }
    })

    // Apply highlights for each annotation
    for (const ann of annotations) {
      highlightTextInElement(articleRef.current, ann, selectedAnnotationId)
    }
  }, [annotations, selectedAnnotationId, loading])

  if (loading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-8 h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">{error ?? 'File not found'}</p>
      </div>
    )
  }

  return (
    <div>
      {file.date && (
        <p className="mb-1 text-sm text-muted-foreground">
          {formatDate(file.date)}
        </p>
      )}
      <article ref={articleRef} className="prose max-w-none" onMouseUp={handleMouseUp}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSlug]}
          components={headingComponents}
        >
          {file.content}
        </ReactMarkdown>
      </article>
      <AnnotationToolbar
        selection={selection}
        onAnnotate={handleAnnotate}
        onClose={handleCloseToolbar}
      />
    </div>
  )
}

/**
 * Find and highlight the first occurrence of annotation text within the element.
 */
function highlightTextInElement(
  root: HTMLElement,
  annotation: Annotation,
  selectedId: string | null
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const searchText = annotation.originalText
  let remaining = searchText
  const nodesToWrap: { node: Text; start: number; end: number }[] = []

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const text = node.textContent || ''
    // Skip nodes already inside a highlight mark
    if (node.parentElement?.closest('mark[data-annotation-id]')) continue

    if (nodesToWrap.length === 0) {
      // Looking for start of match
      const idx = text.indexOf(remaining.slice(0, Math.min(remaining.length, text.length)))
      if (idx === -1) continue
      const matchLen = Math.min(remaining.length, text.length - idx)
      nodesToWrap.push({ node, start: idx, end: idx + matchLen })
      remaining = remaining.slice(matchLen)
      if (remaining.length === 0) break
    } else {
      // Continuation across text nodes
      const matchLen = Math.min(remaining.length, text.length)
      if (text.slice(0, matchLen) === remaining.slice(0, matchLen)) {
        nodesToWrap.push({ node, start: 0, end: matchLen })
        remaining = remaining.slice(matchLen)
        if (remaining.length === 0) break
      } else {
        // Reset search
        nodesToWrap.length = 0
        remaining = searchText
      }
    }
  }

  if (remaining.length > 0) return // Text not found in DOM

  const highlightClass = annotationHighlightClass(annotation.type)
  const isSelected = annotation.id === selectedId

  for (const { node, start, end } of nodesToWrap) {
    const mark = document.createElement('mark')
    mark.dataset.annotationId = annotation.id
    mark.className = `${highlightClass} annotation-mark cursor-pointer rounded-sm${
      isSelected ? ' ring-2 ring-primary' : ''
    }`
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    range.surroundContents(mark)
  }
}
