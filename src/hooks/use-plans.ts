import { useState, useEffect, useMemo } from 'react'
import { fetchFiles, type FileEntry } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export interface DayGroup {
  date: string | null
  label: string
  files: FileEntry[]
}

export interface DirSection {
  dirLabel: string
  groups: DayGroup[]
}

function groupByDate(files: FileEntry[]): DayGroup[] {
  const map = new Map<string, FileEntry[]>()

  for (const file of files) {
    const key = file.date ?? '__undated__'
    const existing = map.get(key)
    if (existing) {
      existing.push(file)
    } else {
      map.set(key, [file])
    }
  }

  return Array.from(map.entries()).map(([key, groupFiles]) => ({
    date: key === '__undated__' ? null : key,
    label: key === '__undated__' ? 'Undated' : formatDate(key),
    files: groupFiles,
  }))
}

export function usePlans() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [projectName, setProjectName] = useState('Plans')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
      .then((data) => {
        setFiles(data.files)
        setProjectName(data.projectName)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const hasMultipleDirs = useMemo(
    () => files.some((f) => f.dirLabel),
    [files]
  )

  const groups = useMemo((): DayGroup[] => {
    return groupByDate(files)
  }, [files])

  const dirSections = useMemo((): DirSection[] => {
    if (!hasMultipleDirs) return []

    const dirMap = new Map<string, FileEntry[]>()
    for (const file of files) {
      const label = file.dirLabel ?? 'Plans'
      const existing = dirMap.get(label)
      if (existing) {
        existing.push(file)
      } else {
        dirMap.set(label, [file])
      }
    }

    return Array.from(dirMap.entries()).map(([dirLabel, dirFiles]) => ({
      dirLabel,
      groups: groupByDate(dirFiles),
    }))
  }, [files, hasMultipleDirs])

  return { files, groups, dirSections, hasMultipleDirs, projectName, loading, error }
}
