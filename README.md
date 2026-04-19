# Vaultword — Password Manager

A Chrome extension password manager with a local REST API backend.  
Passwords are **AES-256-GCM encrypted inside the browser** before being sent to the server — the backend never sees a plaintext password.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project structure](#2-project-structure)
3. [Step 1 — Start the backend server](#3-step-1--start-the-backend-server)
4. [Step 2 — Build and load the Chrome extension](#4-step-2--build-and-load-the-chrome-extension)
5. [First-time use](#5-first-time-use)
6. [API reference](#6-api-reference)
7. [Environment variables](#7-environment-variables)
8. [Rebuilding after code changes](#8-rebuilding-after-code-changes)
9. [Unit tests](#9-unit-tests)

---

## 1. Prerequisites

| Tool | Minimum version | Download |
|------|----------------|---------|
| **Node.js** | 18 (LTS) or newer | https://nodejs.org |
| **npm** | bundled with Node.js | — |
| **Google Chrome** (or any Chromium browser) | any recent version | https://www.google.com/chrome |

Check your versions:

```bash
node --version   # should print v18.x or higher
npm --version
```

---

## 2. Project structure

```
fyp-test/
├── backend/          ← Node.js / Express API server
│   ├── .env.example  ← copy this to .env and fill in values
│   ├── server.js
│   ├── db/
│   ├── middleware/
│   └── routes/
├── src/              ← Chrome extension React source
├── popup.html
├── manifest.json
├── vite.config.js
└── package.json
```

---

## 3. Step 1 — Start the backend server

The extension communicates with a local API server that stores your encrypted credentials in an SQLite database.

### 3a. Install backend dependencies

```bash
cd backend
npm install
```

### 3b. Create and configure the `.env` file

```bash
# still inside the backend/ folder
cp .env.example .env
```

Open `backend/.env` in a text editor. You **must** replace the `JWT_SECRET` placeholder with a real random value:

```bash
# Generate a secure secret and copy-paste it into .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Your `.env` should look like this when done (replace the example secret with your generated value):

```
PORT=3000
JWT_SECRET=a1b2c3d4...your_64_byte_hex_secret_here
```

### 3c. Start the server

```bash
# inside backend/
npm start
```

You should see:

```
Vaultword API server running on http://localhost:3000
```

Verify it is working by visiting http://localhost:3000/health in your browser — it should return `{"status":"ok"}`.

> **Keep this terminal open.** The extension needs the server running whenever you use it.

---

## 4. Step 2 — Build and load the Chrome extension

Open a **second terminal** in the project root (the folder that contains `package.json` and `vite.config.js`).

### 4a. Install extension dependencies

```bash
# from the project root (not inside backend/)
npm install
```

### 4b. Build the extension

```bash
npm run build
```

This creates a `dist/` folder containing the production extension files.

### 4c. Load the extension in Chrome

1. Open Chrome and go to **`chrome://extensions`**
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the **`dist/`** folder inside this project

The **Vaultword** icon will appear in your Chrome toolbar. Click it to open the extension popup.

---

## 5. First-time use

1. **Register an account** — enter an email and a password (minimum 8 characters) in the Sign In / Register screen, then click **"Create Account"**.
2. **Create your vault** — after registering you are taken to the vault setup screen. Enter a **master password** (this never leaves your device — it is used to encrypt/decrypt your stored passwords locally).
3. **Add passwords** — switch to the **Add** tab, fill in the website, username, and password, then click **"Save Password"**.
4. **Browse saved passwords** — the **Passwords** tab lists all your stored credentials. Click **Show** to reveal a password, or **Copy** to copy it to the clipboard.
5. **Generate strong passwords** — use the **Generator** tab to create a random password and send it directly to the Add form.

---

## 6. API reference

All credential endpoints require an `Authorization: Bearer <token>` header. The token is obtained from `/auth/register` or `/auth/login`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server health check |
| `POST` | `/auth/register` | Create an account → returns `{ token }` |
| `POST` | `/auth/login` | Sign in → returns `{ token }` |
| `GET` | `/credentials` | List all credentials for the signed-in user |
| `POST` | `/credentials` | Save a new credential |
| `PUT` | `/credentials/:id` | Update an existing credential |
| `DELETE` | `/credentials/:id` | Delete a credential |

**Request body for `POST /auth/register` and `POST /auth/login`:**

```json
{ "email": "you@example.com", "password": "yourPassword" }
```

**Request body for `POST /credentials` and `PUT /credentials/:id`:**

```json
{
  "site": "github.com",
  "username": "your-username",
  "encrypted_password": "<AES-256-GCM ciphertext produced by the extension>",
  "notes": "optional notes"
}
```

---

## 7. Environment variables

All variables live in `backend/.env` (copy from `backend/.env.example`).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | — | Secret for signing JWT tokens. Must be a long random string. |
| `PORT` | No | `3000` | Port the API server listens on. |
| `DB_PATH` | No | `./db/vaultword.db` | Path to the SQLite database file. |
| `ALLOWED_ORIGINS` | No | `*` (all) | Comma-separated list of allowed CORS origins. Set to your extension's `chrome-extension://` URL in production. |

---

## 8. Rebuilding after code changes

If you edit any file inside `src/`, run the build command again and Chrome will pick up the changes:

```bash
# project root
npm run build
```

If Chrome does not pick up the changes automatically, go to `chrome://extensions` and click the **refresh** icon on the Vaultword card.

For backend changes, restart the server:

```bash
# inside backend/
npm start
```

Or use the dev watcher (auto-restarts on file save):

```bash
# inside backend/
npm run dev
```

---

## 9. Unit tests

Run unit tests from the project root:

```bash
npm test
```

Unit tests are currently implemented in:

`tests/crypto.test.js`

They validate cryptography and password utility behavior from `src/utils/crypto.js`.

### 9.1 Unit test scope

| ID | Function under test | What is validated | Expected result |
|----|----------------------|-------------------|-----------------|
| UT-01 | `hashString("Test123!")` | SHA-256 hashing for a known input | Hash matches the known expected digest |
| UT-02 | `hashString("")` | SHA-256 hashing for empty input edge case | Hash matches SHA-256 empty-string digest |
| UT-03 | `getPasswordStrength(...)` | Score bands across weak/medium/strong samples | Returned score aligns with scoring rules |
| UT-04 | `generatePassword(...)` | No selected character groups | Returns `null` safely |
| UT-05 | `generatePassword(...)` | Length and group constraints for mixed options | Output length is correct and chars respect selected groups |
| UT-06 | `getPasswordStrength(...)` | Length+numbers scenario without full complexity | Score reflects partial complexity correctly |
| UT-07 | `getPasswordStrength(...)` | Upper-bound behavior | Score is capped at max level |
| UT-08 | `generatePassword(...)` | Lowercase-only generation | Output contains only lowercase characters |
| UT-09 | `encryptPassword(...)` + `decryptPassword(...)` | Encryption/decryption round-trip | Decrypted output equals original plaintext |
| UT-10 | `STRENGTH_META` | Strength metadata completeness | Exactly 5 ordered strength levels are exposed |

### 9.2 Unit test execution notes

- Test runner: Node built-in `node:test`
- Current output includes diagnostics (`input`, `expected`, `actual`) for easier debugging in CI/local runs.
- Recommended to run tests before every build or release candidate.

---

## 10. System tests (manual end-to-end)

System tests validate complete user workflows across frontend and backend integration.

### 10.1 Preconditions

- Backend API running (`backend/`): `npm start` or `npm run dev`
- Extension frontend built (`project root`): `npm run build`
- Extension loaded in Chrome from `dist/`
- Test account and sample credential data available

### 10.2 System test cases

| ID | Scenario | Steps | Expected result |
|----|----------|-------|-----------------|
| ST-01 | User registration | Open auth screen → Sign up with valid details | Account is created and user can proceed to login |
| ST-02 | Successful login | Enter valid credentials | User is authenticated and redirected to main app |
| ST-03 | Invalid login handling | Attempt login with wrong password | Access denied with safe error message |
| ST-04 | Add credential | Open Add tab → Enter site/username/password → Save | New credential appears in saved password list |
| ST-05 | View/decrypt credential | Open saved credential and reveal/copy password flow | Data is displayed correctly and decrypts with valid session/master key |
| ST-06 | Password generation flow | Open Generator tab → Configure options → Generate → Save generated password | Generated password follows selected constraints and is saved correctly |
| ST-07 | Search/filter credentials | Use search on password list | Only matching items are shown |
| ST-08 | Update credential | Edit an existing credential and save | Updated values persist after refresh/reopen |
| ST-09 | Delete credential | Delete a selected credential | Credential is removed and no longer retrievable from UI |
| ST-10 | Session lock/logout | Lock or logout, then attempt protected actions | User is prompted for re-authentication and protected data is hidden |
| ST-11 | Persistence across restart | Close and reopen extension after creating entries | Previously saved encrypted entries remain accessible after login |
| ST-12 | API connectivity failure handling | Stop backend temporarily and perform save/fetch operations | UI shows user-friendly error states without crashing |

### 10.3 Suggested execution frequency

- Run the full system suite before demos, staging sign-off, or production release.
- Run critical smoke subset (`ST-02`, `ST-04`, `ST-06`, `ST-10`, `ST-12`) after any auth/storage/API change.
