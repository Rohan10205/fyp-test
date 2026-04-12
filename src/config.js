// Base URL for the backend API.
// Override at build time with: VITE_API_URL=https://your-server.com npm run build
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
