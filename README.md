# Vaultword — Chrome Password Manager Extension

A secure, client-side password manager built as a Chrome extension for a Final Year Project (FYP). Vaultword lets users store, manage, and generate passwords locally in their browser, protected by a master password and AES-GCM encryption.

---

## Features

- 🔐 **Master password vault** — Set a master password to lock/unlock all credentials
- 🗃️ **Store credentials** — Save website, username, and encrypted password entries
- 🔍 **Search & filter** — Real-time filtering of saved passwords by website or username
- 👁️ **Show/hide passwords** — Toggle visibility per entry
- 📋 **Copy to clipboard** — One-click copy of usernames or passwords; clipboard is auto-cleared after 30 seconds
- 🎲 **Password generator** — Customizable generator (length, uppercase, lowercase, numbers, symbols) with a live strength meter
- 🗑️ **Delete entries or entire vault** — Remove individual credentials or reset the vault completely
- 🌐 **Favicons** — Automatically fetches the site favicon for each stored entry

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Custom CSS with CSS variables |
| Cryptography | Web Crypto API (AES-GCM + PBKDF2) |
| Storage | Chrome Storage API (`chrome.storage.local`) |
| Extension Platform | Chrome Manifest v3 |

---

## Security Model

- The master password is **never stored in plain text**; a PBKDF2-derived verification hash (100,000 iterations, SHA-256) is persisted for unlock verification — making brute-force attacks computationally expensive.
- A **cryptographically random 16-byte salt** is generated with `crypto.getRandomValues` when the vault is first created and stored in `chrome.storage.local`. This salt is unique per vault, defeating pre-computed (rainbow-table) attacks.
- Each stored password is encrypted with **AES-256-GCM** using a key derived from the master password and the per-vault random salt via **PBKDF2** (100,000 iterations).
- A fresh random **12-byte IV** is generated for every encryption operation.
- All cryptographic operations run locally inside the browser — no data is transmitted to any server.

> **Note:** The salt is not secret — it is intentionally stored alongside the encrypted data. Its purpose is to ensure that two users with the same master password produce different cryptographic material, and to prevent pre-computation attacks.

---

## Project Structure

```
vaultword/ (fyp-test repository)
├── src/
│   ├── components/
│   │   ├── MainApp.jsx        # Tabbed app shell (Passwords / Add / Generator)
│   │   ├── LockScreen.jsx     # Master password setup and unlock screen
│   │   ├── PasswordsTab.jsx   # List, search, and delete saved passwords
│   │   ├── AddTab.jsx         # Form to add new credentials
│   │   ├── GeneratorTab.jsx   # Password generator with strength meter
│   │   └── PasswordCard.jsx   # Individual password entry card
│   ├── context/
│   │   └── ToastContext.jsx   # Global toast notification system
│   ├── utils/
│   │   ├── crypto.js          # Encryption / decryption / hashing helpers
│   │   └── storage.js         # Chrome Storage API wrappers
│   ├── App.jsx                # Root React component
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── popup.html                 # Extension popup page
├── manifest.json              # Chrome Manifest v3 configuration
├── icon.jpg                   # Extension icon
├── vite.config.js             # Vite build configuration
└── package.json               # Project metadata and scripts
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) >= 9
- Google Chrome (or any Chromium-based browser)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build
```

This produces a `dist/` folder containing the built extension.

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked** and select the `dist/` folder
4. The Vaultword icon will appear in your extensions toolbar

### Development

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5173` for rapid UI development (note: Chrome Storage API calls require the extension context).

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build extension to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## License

This project was created as a Final Year Project for educational purposes.
