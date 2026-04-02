import { useEffect, useRef } from 'react'
import { MessageSquare, Scissors, PenLine, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  type Annotation,
  type AnnotationType,
  annotationTypeLabel,
  annotationTypeColor,
} from '@/hooks/use-annotations'

function typeIcon(type: AnnotationType) {
  const cls = 'size-3'
  switch (type) {
    case 'comment': return <MessageSquare className={cls} />
    case 'delete': return <Scissors className={cls} />
    case 'replace': return <PenLine className={cls} />
    case 'insert': return <Plus className={cls} />
  }
}

interface AnnotationPanelProps {
  annotations: Annotation[]
  selectedAnnotationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function AnnotationPanel({
  annotations,
  selectedAnnotationId,
  onSelect,
  onDelete,
}: AnnotationPanelProps) {
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedAnnotationId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedAnnotationId])

  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="mb-2 size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">No annotations yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Select text in the document to add annotations
        </p>
      </div>
    )
  }

  const sorted = [...annotations].sort((a, b) => a.createdAt - b.createdAt)

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-3">
        {sorted.map((ann) => {
          const isSelected = ann.id === selectedAnnotationId
          return (
            <div
              key={ann.id}
              ref={isSelected ? selectedRef : undefined}
              className={`group cursor-pointer rounded-lg border p-3 text-sm transition-colors hover:bg-accent/50 ${
                isSelected ? 'border-primary/40 bg-accent/60' : 'border-border'
              }`}
              onClick={() => onSelect(ann.id)}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <Badge
                  className={`gap-1 px-1.5 py-0 text-[10px] ${annotationTypeColor(ann.type)}`}
                >
                  {typeIcon(ann.type)}
                  {annotationTypeLabel(ann.type)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(ann.id)
                  }}
                  title="Delete annotation"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <p className="line-clamp-2 font-mono text-xs text-muted-foreground">
                "{ann.originalText.slice(0, 100)}{ann.originalText.length > 100 ? '...' : ''}"
              </p>
              {ann.comment && (
                <p className="mt-1.5 text-xs text-foreground/80">
                  {ann.comment}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
