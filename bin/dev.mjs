#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { resolve, join } from 'node:path'
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const dirIdx = args.indexOf('--dir')
const viteArgs = []

if (dirIdx !== -1 && args[dirIdx + 1]) {
  const raw = args[dirIdx + 1]
  const resolved = resolve(raw)
  // If it's a project root, look for .claude/plans inside it
  const nested = join(resolved, '.claude', 'plans')
  process.env.PLANS_DIR = existsSync(nested) ? nested : resolved
  // Pass remaining args (without --dir and its value) to vite
  for (let i = 0; i < args.length; i++) {
    if (i === dirIdx || i === dirIdx + 1) continue
    viteArgs.push(args[i])
  }
} else {
  viteArgs.push(...args)
}

const child = spawn('npx', ['vite', ...viteArgs], {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => process.exit(code ?? 0))
