const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { getDb } = require('../db/database')

const router      = express.Router()
const SALT_ROUNDS = 12

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const db       = await getDb()
    const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase())
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hash   = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      email.toLowerCase(),
      hash
    )
    const token = jwt.sign({ userId: result.lastID }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return res.status(201).json({ token })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const db   = await getDb()
    const user = await db.get(
      'SELECT id, password_hash FROM users WHERE email = ?',
      email.toLowerCase()
    )
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return res.json({ token })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
