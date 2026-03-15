const jwt = require('jsonwebtoken')

/**
 * Express middleware that verifies the JWT token in the Authorization header.
 * On success it sets req.userId and calls next().
 * On failure it responds with 401 Unauthorized.
 */
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
