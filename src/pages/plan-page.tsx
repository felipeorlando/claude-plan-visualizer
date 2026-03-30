import { useCallback, useState } from 'react'
import { PlanContent } from '@/components/plan-content'
import { Toc } from '@/components/toc'
import { AnnotationPanel } from '@/components/annotation-panel'
import { useToc } from '@/hooks/use-toc'
import { useAnnotations, exportAnnotationsMarkdown } from '@/hooks/use-annotations'
import { Button } from '@/components/ui/button'
import { Download, Trash2, PanelRight, MessageSquareText } from 'lucide-react'
import { slugToTitle } from '@/lib/utils'

interface PlanPageProps {
  slug: string
}

export function PlanPage({ slug }: PlanPageProps) {
  const [content, setContent] = useState<string | null>(null)
  const tocItems = useToc(content)
  const ann = useAnnotations()
  const [panelOpen, setPanelOpen] = useState(false)

  const handleContentLoaded = useCallback((md: string) => {
    setContent(md)
  }, [])

  const handleExport = useCallback(() => {
    const title = slugToTitle(slug)
    const md = exportAnnotationsMarkdown(ann.annotations, title)
    if (!md) return
    navigator.clipboard.writeText(md).catch(() => {
      // Fallback: download as file
      const blob = new Blob([md], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `annotations-${slug}.md`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [ann.annotations, slug])

  const annotationCount = ann.annotations.length

  return (
    <div className="flex">
      <div className="flex-1 min-w-0">
        {/* Annotation action bar */}
        <div className="sticky top-16 z-[5] flex items-center gap-1 border-b bg-background/95 px-6 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            variant={panelOpen ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPanelOpen((v) => !v)}
            className="gap-1.5"
          >
            <PanelRight className="size-3.5" />
            Annotations
            {annotationCount > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {annotationCount}
              </span>
            )}
          </Button>
          {annotationCount > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
                <Download className="size-3.5" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={ann.clearAnnotations}
                className="gap-1.5 text-muted-foreground"
              >
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            </>
          )}
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10 lg:px-10">
          <PlanContent
            slug={slug}
            onContentLoaded={handleContentLoaded}
            annotations={ann.annotations}
            selectedAnnotationId={ann.selectedAnnotationId}
            onAddAnnotation={ann.addAnnotation}
            onSelectAnnotation={ann.selectAnnotation}
          />
        </div>
      </div>

      {/* Annotation panel */}
      {panelOpen && (
        <div className="hidden md:block w-72 shrink-0 border-l bg-background">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <MessageSquareText className="size-4" />
                Annotations
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => setPanelOpen(false)}>
                <PanelRight className="size-3.5" />
              </Button>
            </div>
            <AnnotationPanel
              annotations={ann.annotations}
              selectedAnnotationId={ann.selectedAnnotationId}
              onSelect={ann.selectAnnotation}
              onDelete={ann.deleteAnnotation}
            />
          </div>
        </div>
      )}

      {/* TOC (hidden when panel is open) */}
      {!panelOpen && (
        <div className="hidden xl:block shrink-0">
          <div className="sticky top-16 pt-10 pb-10 pr-6 pl-6">
            <Toc items={tocItems} />
          </div>
        </div>
      )}
    </div>
  )
}
