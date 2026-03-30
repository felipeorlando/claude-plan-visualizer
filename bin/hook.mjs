#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'

const args = process.argv.slice(2)

if (args.includes('--setup')) {
  console.log(`
Claude Plan Visualizer — ExitPlanMode Hook Setup
=================================================

Add to your ~/.claude/settings.json:

{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "claude-plan-visualizer-hook"
          }
        ]
      }
    ]
  }
}

That's it! When Claude exits plan mode, the viewer will auto-open.
`)
  process.exit(0)
}

const DEFAULT_PORT = 3200

async function isServerRunning(port) {
  return new Promise((resolve) => {
    const conn = createConnection({ port, host: '127.0.0.1' }, () => {
      conn.end()
      resolve(true)
    })
    conn.on('error', () => resolve(false))
    conn.setTimeout(1000, () => {
      conn.destroy()
      resolve(false)
    })
  })
}

async function main() {
  // Read stdin for the hook payload
  let input = ''
  if (!process.stdin.isTTY) {
    const chunks = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    input = Buffer.concat(chunks).toString('utf-8')
  }

  const port = parseInt(process.env.CPV_PORT || String(DEFAULT_PORT), 10)
  const running = await isServerRunning(port)

  if (!running) {
    // Start the server in the background
    const child = spawn('claude-plan-visualizer', ['--port', String(port)], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    })
    child.unref()
    // Give server a moment to start
    await new Promise((r) => setTimeout(r, 1500))
  } else {
    // Server already running, just open the browser
    try {
      const open = (await import('open')).default
      await open(`http://localhost:${port}`)
    } catch {
      // Ignore — browser may already be open
    }
  }

  // Exit 0 to allow Claude to proceed
  process.exit(0)
}

main().catch((err) => {
  console.error('Hook error:', err.message)
  // Always exit 0 so Claude isn't blocked
  process.exit(0)
})
