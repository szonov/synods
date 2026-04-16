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
- Button to clear all finished/completed downloads.
- List of downloads with options for each download: Remove, Pause, Resume.
- Timestamp of the last list update.
- Auto-refresh: When popup is open, download list automatically updates every 5 seconds.

Context Menu:
- Right-click on a link -> "Add to Synology Download Station"
- Simple notification confirms task added.

Performance & Requests:
- No unnecessary API requests to Synology.
- Data is fetched ONLY when the extension popup is open.
- When popup is open, data auto-refreshes every 5 seconds.
- No background polling when popup is closed.

Technology Stack:
- Manifest V3
- Pure JavaScript (ES6+)
- chrome.storage.local
- HTML/CSS (no frameworks)
- Synology API: SYNO.API.Auth (authentication)
- Synology API: SYNO.DownloadStation.Task (standard downloads)
- Synology API: SYNO.DownloadStation2.Task (torrent downloads)

Synology API Endpoints:
- Authentication: SYNO.API.Auth (login)
- Standard Downloads: SYNO.DownloadStation.Task (list, create, pause, resume, delete)
- Torrent Downloads: SYNO.DownloadStation2.Task (list, create, pause, resume, delete)
