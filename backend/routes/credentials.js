const express     = require('express')
const requireAuth = require('../middleware/auth')
const { getDb }   = require('../db/database')

const router = express.Router()
router.use(requireAuth)

// GET /credentials — list all credentials for the authenticated user
router.get('/', async (req, res) => {
  try {
    const db   = await getDb()
    const rows = await db.all(
      `SELECT id, site, username, encrypted_password, notes, created_at, updated_at
         FROM credentials
        WHERE user_id = ?
        ORDER BY site ASC`,
      req.userId
    )
    return res.json(rows)
  } catch (err) {
    console.error('Get credentials error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /credentials — create a new credential
router.post('/', async (req, res) => {
  try {
    const { site, username, encrypted_password, notes } = req.body
    if (!site || !username || !encrypted_password) {
      return res.status(400).json({ error: 'site, username, and encrypted_password are required' })
    }
    if (
      typeof site !== 'string' ||
      typeof username !== 'string' ||
      typeof encrypted_password !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input types' })
    }

    const db     = await getDb()
    const result = await db.run(
      `INSERT INTO credentials (user_id, site, username, encrypted_password, notes)
       VALUES (?, ?, ?, ?, ?)`,
      req.userId,
      site.trim(),
      username.trim(),
      encrypted_password,
      notes || null
    )
    const row = await db.get(
      `SELECT id, site, username, encrypted_password, notes, created_at, updated_at
         FROM credentials WHERE id = ?`,
      result.lastID
    )
    return res.status(201).json(row)
  } catch (err) {
    console.error('Create credential error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /credentials/:id — update an existing credential
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid credential ID' })

    const { site, username, encrypted_password, notes } = req.body
    if (!site || !username || !encrypted_password) {
      return res.status(400).json({ error: 'site, username, and encrypted_password are required' })
    }
    if (
      typeof site !== 'string' ||
      typeof username !== 'string' ||
      typeof encrypted_password !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input types' })
    }

    const db       = await getDb()
    const existing = await db.get(
      'SELECT id FROM credentials WHERE id = ? AND user_id = ?',
      id,
      req.userId
    )
    if (!existing) return res.status(404).json({ error: 'Credential not found' })

    await db.run(
      `UPDATE credentials
          SET site = ?, username = ?, encrypted_password = ?, notes = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?`,
      site.trim(),
      username.trim(),
      encrypted_password,
      notes || null,
      id,
      req.userId
    )
    const row = await db.get(
      `SELECT id, site, username, encrypted_password, notes, created_at, updated_at
         FROM credentials WHERE id = ?`,
      id
    )
    return res.json(row)
  } catch (err) {
    console.error('Update credential error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /credentials/:id — delete a credential
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid credential ID' })

    const db     = await getDb()
    const result = await db.run(
      'DELETE FROM credentials WHERE id = ? AND user_id = ?',
      id,
      req.userId
    )
    if (result.changes === 0) return res.status(404).json({ error: 'Credential not found' })
    return res.status(204).send()
  } catch (err) {
    console.error('Delete credential error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
