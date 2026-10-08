Chrome/Firefox Extension: Synology Download Manager
==================================================

A small browser extension for sending downloads to Synology Download Station and monitoring active tasks.

Features
--------

- Add links, media, and torrent files from the browser context menu.
- Monitor, pause, resume, and remove Download Station tasks in the popup.
- Open the active account's Download Station directly from the popup.
- Display the current task count on the extension badge.
- Configure multiple Synology accounts while keeping one account active at a time.
- Store a separate session and favorite download destinations for every account.
- Switch the active account from the popup.
- Russian and English localization through `chrome.i18n`.

Accounts
--------

Multiple Synology accounts can be configured. Only one account is active at a time. The popup, badge, Download Station link, and context menu always use the active account.

The first configured account becomes active automatically. Adding another account does not change the current selection. When two or more accounts exist, the active account can be switched from the popup.

Account settings and sessions are stored locally with `chrome.storage.local`.

Context Menu and Destinations
-----------------------------

Without favorite destinations, the context menu contains one action:

```text
Download to Home
```

Each account can define favorite destination paths, one per line. When destinations are configured, they appear as a submenu:

```text
Download to Home
    Default
    downloads
    video/series
```

`Default` uses the destination configured in Download Station. Favorite paths are sent through the Synology API as the task destination.

Torrent Handling
----------------

For a same-origin torrent link, the extension checks and downloads the `.torrent` file in the context of the page that opened the context menu. This preserves the page's authenticated browser session. The downloaded metadata file is then uploaded to Synology instead of asking Download Station to fetch the original URL.

Cross-origin and ordinary download links are resolved by the extension background process. Torrent metadata files are limited to 5 MB.

Popup
-----

The popup provides the active account's task list, task controls, aggregate transfer speeds, last-update time, links to Download Station and settings, and an account selector when more than one account exists.

While the popup is open, the task list refreshes every five seconds.

Network Behavior
----------------

The extension does not poll Synology while idle. Network requests are made when:

- the browser starts, to update the badge;
- the popup is open;
- the user performs a task action;
- the user adds a download from the context menu;
- an account is saved and its connection is checked.

Technology
----------

- Manifest V3
- Chrome and Firefox WebExtensions APIs
- Plain JavaScript modules, HTML, and CSS
- `chrome.storage.local`
- Bundled UI code with no runtime package installation
- No application build step or JavaScript bundler

Synology APIs
-------------

- `SYNO.API.Auth` — authentication
- `SYNO.DownloadStation.Task` — task list, standard downloads, pause, resume, and delete
- `SYNO.DownloadStation2.Task` — torrent file uploads

Development
-----------

The repository keeps one manifest and switches its background declaration for the browser being tested:

```sh
make ff       # use the Firefox background scripts declaration
make chrome   # use the Chrome service worker declaration
make lint     # validate the Firefox extension and restore the Chrome manifest
make build    # build the Firefox package and restore the Chrome manifest
```

The extension itself does not require a JavaScript build step.
