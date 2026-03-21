import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readdirSync, statSync, readFileSync, existsSync } from 'fs'

const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})-(.+)$/

function slugToTitle(slug: string) {
  const match = slug.match(DATE_PREFIX_RE)
  const withoutDate = match ? match[2] : slug
  return withoutDate
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function resolvePlansDir(): string {
  const explicit = process.env.PLANS_DIR

  if (explicit) {
    const resolved = path.resolve(explicit)
    // If it's a project root, look for .claude/plans inside it
    const nested = path.join(resolved, '.claude', 'plans')
    if (existsSync(nested)) return nested
    return resolved
  }

  return path.resolve('.claude/plans')
}

function plansApiPlugin() {
  const dir = resolvePlansDir()

  return {
    name: 'plans-api',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = new URL(req.url ?? '/', 'http://localhost')

        if (url.pathname === '/api/files' && req.method === 'GET') {
          if (!existsSync(dir)) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ files: [], projectName: path.basename(process.cwd()) }))
            return
          }
          const entries = readdirSync(dir)
          const files = entries
            .filter((f: string) => f.endsWith('.md'))
            .map((filename: string) => {
              const slug = filename.replace(/\.md$/, '')
              const dateMatch = slug.match(DATE_PREFIX_RE)
              const fileStat = statSync(path.join(dir, filename))
              return {
                slug,
                filename,
                date: dateMatch ? dateMatch[1] : null,
                title: slugToTitle(slug),
                modifiedAt: fileStat.mtime.toISOString(),
              }
            })
            .sort((a: any, b: any) => {
              const dateA = a.date ?? '0000-00-00'
              const dateB = b.date ?? '0000-00-00'
              if (dateA !== dateB) return dateB.localeCompare(dateA)
              return b.modifiedAt.localeCompare(a.modifiedAt)
            })

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ files, projectName: path.basename(path.resolve(dir, '../..')) }))
          return
        }

        const fileMatch = url.pathname.match(/^\/api\/files\/(.+)$/)
        if (fileMatch && req.method === 'GET') {
          const slug = decodeURIComponent(fileMatch[1])
          const filepath = path.join(dir, `${slug}.md`)

          if (!existsSync(filepath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'File not found' }))
            return
          }

          const content = readFileSync(filepath, 'utf-8')
          const dateMatch = slug.match(DATE_PREFIX_RE)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            slug,
            filename: `${slug}.md`,
            date: dateMatch ? dateMatch[1] : null,
            content,
          }))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), plansApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/client',
  },
})
