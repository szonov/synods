# Synology Download Manager (SynoDS) Privacy Policy

SynoDS sends selected downloads to a Synology Download Station you configure and lets you manage its tasks from your browser.

## Data stored in your browser

SynoDS stores your account labels, NAS addresses, DSM usernames and passwords, DSM session identifiers, favorite destination folders, and active account selection in the browser's local extension storage. SynoDS uses this information to sign in, route downloads, and manage tasks. The extension does not sync these settings or encrypt the saved passwords at the extension level.

## Network requests and disclosures

- **Your NAS.** SynoDS sends your DSM credentials and session identifiers to the configured NAS to sign in and make API requests. When you add a task, it sends the selected URL or the retrieved torrent file, along with the destination folder if you selected one. It retrieves task names, status, and transfer information to display in the extension.
- **The download source.** When you send a link from the context menu, SynoDS may contact the selected download source to check for and retrieve a torrent file. For a same-origin link, the request can run in the page and use your existing browser session. SynoDS does not copy the website's session cookies to the NAS. Selected URLs may appear in local browser notifications.
- **The developer.** SynoDS has no developer-operated backend, analytics, or advertising. It does not send your extension data to the developer or sell it.

HTTPS encrypts the connection to your NAS when the browser trusts its certificate. If you configure an HTTP address, the DSM credentials, session identifiers, and task data sent over that connection are unencrypted.

## Retention and controls

Saved account data stays in local extension storage until you delete the account in SynoDS settings or remove the extension. You can manage site access in your browser's extension settings. Tasks and files already sent to your NAS are managed separately in Download Station.

SynoDS uses data obtained through Chrome extension APIs to provide the download and task management features described here and adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements.

For privacy questions, contact the maintainer through the [project's GitHub repository](https://github.com/szonov/synods).
