import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const app = new Hono()

const SAVES_DIR = path.resolve(process.env.SAVES_DIR || './saves')
await fs.mkdir(SAVES_DIR, { recursive: true })

const ID_RE = /^[A-Za-z0-9_-]+$/

function isValidId(id) {
  return typeof id === 'string' && ID_RE.test(id)
}

function savePath(id) {
  return path.join(SAVES_DIR, `${id}.txt`)
}

const SAVES_PASSPHRASE = process.env.SAVES_PASSPHRASE ?? 'CHANGE_ME'

if (SAVES_PASSPHRASE === 'CHANGE_ME') {
  console.warn(
    '[api] WARNING: SAVES_PASSPHRASE is not set (using default CHANGE_ME). Set it via env for any real use.',
  )
}

// Basic request logging for everything under /api.
// (Incoming + outgoing + status + elapsed)
app.use('/api/*', logger())

app.get('/api/health', (c) => {
  return c.json({ ok: true })
})

app.use('/api/saves/*', async (c, next) => {
  // “Security by obscurity”: simple shared passphrase in a header.
  const provided =
    c.req.header('x-saves-passphrase') ?? c.req.header('x-passphrase')

  if (!provided || provided !== SAVES_PASSPHRASE) {
    return c.text('Unauthorized', 401)
  }

  await next()
})

app.post('/api/saves/:id', async (c) => {
  const id = c.req.param('id')
  if (!isValidId(id)) return c.text('Invalid id', 400)

  const body = await c.req.text()
  if (body.length > 1_000_000) return c.text('Body too large', 413)

  await fs.writeFile(savePath(id), body, 'utf8')
  return c.text('OK', 200)
})

app.get('/api/saves/:id', async (c) => {
  const id = c.req.param('id')
  if (!isValidId(id)) return c.text('Invalid id', 400)

  try {
    const data = await fs.readFile(savePath(id), 'utf8')
    return c.text(data, 200)
  } catch {
    return c.text('Not found', 404)
  }
})

app.delete('/api/saves/:id', async (c) => {
  const id = c.req.param('id')
  if (!isValidId(id)) return c.text('Invalid id', 400)

  try {
    await fs.unlink(savePath(id))
    return c.text('OK', 200)
  } catch {
    return c.text('Not found', 404)
  }
})

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT || 3000),
})
