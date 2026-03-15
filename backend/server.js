require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const rateLimit   = require('express-rate-limit')
const authRoutes  = require('./routes/auth')
const credRoutes  = require('./routes/credentials')
const { getDb }   = require('./db/database')

// Refuse to start with an insecure or placeholder JWT secret
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'REPLACE_ME') {
  console.error(
    '[ERROR] JWT_SECRET is not configured. ' +
    'Set a strong random value in your .env file before starting the server.\n' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  )
  process.exit(1)
}

const app  = express()
const PORT = process.env.PORT || 3000

// Allow requests from the Chrome extension and any configured origins.
// In production set ALLOWED_ORIGINS to your extension's chrome-extension:// URL.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : '*'

if (allowedOrigins === '*') {
  console.warn(
    '[WARN] ALLOWED_ORIGINS is not set — accepting requests from all origins. ' +
    'Set ALLOWED_ORIGINS in your .env file before deploying to production.'
  )
}

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

// Rate limiting — stricter for auth endpoints to prevent brute-force attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const credLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

app.use('/auth',        authLimiter, authRoutes)
app.use('/credentials', credLimiter, credRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Initialise the database then start listening
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Vaultword API server running on http://localhost:${PORT}`)
  })
}).catch((err) => {
  console.error('Failed to initialise database:', err)
  process.exit(1)
})
