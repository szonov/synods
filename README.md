Chrome Extension: Synology Download Manager
============================================

Technical Specification (MVP)

Main Goals:
1) Minimal viable functionality — all other actions can be performed by navigating to Synology DSM / Download Station directly from the extension.
2) Add download tasks via Chrome's context menu (right-click on a link -> send to Synology).
3) Minimal settings — only host address and login credentials for Synology.
4) Pure JavaScript implementation — no build systems (Webpack, Vite, etc.), no frameworks (React, Vue, etc.), no external UI libraries.

Data Storage:
- All settings and local data stored in chrome.storage.local (Chrome Storage API).

Localization (i18n):
- Multi-language support: Russian and English.
- Language is automatically detected from the user's browser using chrome.i18n API.

Popup Interface:
- Link to open Synology Download Station.
- Link to open extension settings page.
- Button to clear all downloads from the list.
- List of downloads with options: Remove, Pause, Resume.
- Timestamp of the last list update.

Context Menu:
- Right-click on a link -> "Add to Synology Download Station"
- Simple notification confirms task added.

Performance:
- No unnecessary API requests to Synology.
- Data fetched ONLY when popup is open.
- No background polling.

Technology Stack:
- Manifest V3
- Pure JavaScript (ES6+)
- chrome.storage.local
- HTML/CSS (no frameworks)
- Synology API: SYNO.DownloadStation.Task
- i18n: Chrome _locales structure (auto-detected from browser)
