import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, Scissors, PenLine, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnnotationType } from '@/hooks/use-annotations'

interface ToolbarPosition {
  top: number
  left: number
}

interface AnnotationToolbarProps {
  selection: {
    text: string
    range: Range
  } | null
  onAnnotate: (type: AnnotationType, text: string, range: Range) => void
  onClose: () => void
}

export function AnnotationToolbar({ selection, onAnnotate, onClose }: AnnotationToolbarProps) {
  const [position, setPosition] = useState<ToolbarPosition | null>(null)
  const [commentMode, setCommentMode] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replaceMode, setReplaceMode] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const updatePosition = useCallback(() => {
    if (!selection) return
    const rect = selection.range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      onClose()
      return
    }
    const top = rect.top + window.scrollY - 48
    const left = rect.left + window.scrollX + rect.width / 2
    setPosition({ top, left })
  }, [selection, onClose])

  useEffect(() => {
    if (!selection) {
      setPosition(null)
      setCommentMode(false)
      setReplaceMode(false)
      setCommentText('')
      return
    }
    updatePosition()
  }, [selection, updatePosition])

  useEffect(() => {
    if (commentMode || replaceMode) {
      inputRef.current?.focus()
    }
  }, [commentMode, replaceMode])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleScroll() {
      if (selection) updatePosition()
    }
    document.addEventListener('mousedown', handleClickOutside, true)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose, selection, updatePosition])

  if (!selection || !position) return null

  const handleAction = (type: AnnotationType) => {
    if (type === 'comment') {
      setCommentMode(true)
      setReplaceMode(false)
      return
    }
    if (type === 'replace') {
      setReplaceMode(true)
      setCommentMode(false)
      return
    }
    onAnnotate(type, '', selection.range)
  }

  const handleSubmitComment = () => {
    if (!commentText.trim()) return
    onAnnotate(commentMode ? 'comment' : 'replace', commentText.trim(), selection.range)
    setCommentText('')
    setCommentMode(false)
    setReplaceMode(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmitComment()
    }
    if (e.key === 'Escape') {
      if (commentMode || replaceMode) {
        setCommentMode(false)
        setReplaceMode(false)
        setCommentText('')
      } else {
        onClose()
      }
    }
  }

  return createPortal(
    <div
      ref={toolbarRef}
      className="annotation-toolbar absolute z-50"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg">
          <Button
            variant={commentMode ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => handleAction('comment')}
            title="Add comment"
          >
            <MessageSquare className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAction('delete')}
            title="Mark for deletion"
          >
            <Scissors className="size-3.5" />
          </Button>
          <Button
            variant={replaceMode ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => handleAction('replace')}
            title="Suggest replacement"
          >
            <PenLine className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => handleAction('insert')}
            title="Insert after"
          >
            <Plus className="size-3.5" />
          </Button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        {(commentMode || replaceMode) && (
          <div className="w-64 rounded-lg border bg-popover p-2 shadow-lg">
            <p className="mb-1 text-xs text-muted-foreground">
              {commentMode ? 'Add a comment' : 'Suggest replacement'}
            </p>
            <textarea
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded border bg-background p-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              placeholder={commentMode ? 'Your comment...' : 'Replacement text...'}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
              </span>
              <Button size="xs" onClick={handleSubmitComment} disabled={!commentText.trim()}>
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
