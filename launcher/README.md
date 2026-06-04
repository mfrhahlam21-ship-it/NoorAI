NoorAI Desktop Launcher

This folder contains a standalone Electron + React + Vite launcher for Windows.

Key commands:
- npm install
- npm run dev  (starts renderer dev server, builds main/preload and launches Electron)
- npm run build (builds renderer and main/preload)
- npm run dist  (builds and packages an installer using electron-builder)

Security: contextIsolation is enabled and a preload script exposes a safe API surface.
