# Listpad

A small installable web app (PWA) for writing lists. Write a list like a note, see it as a strip on a shelf, tick items off, then repeat or resolve it.

It is a small static site: plain HTML, CSS and JavaScript, with the text content kept in a JSON file. There is no build step and no framework.

## Features

- **Note-style editor** with a title, a ruled writing area and three tools:
  - **B** for bold
  - **☑** to turn a line into a checkbox line
  - **•≡** for a bullet list
- **Enter on a checkbox line** starts the next checkbox. Enter on an empty checkbox line turns it back into a normal line.
- **Strip gallery.** Each list is a narrow vertical strip showing its title and a done count (for example `2/5`).
  - Hover a strip on a computer, or tap it on a phone, to open it.
  - Click a strip on a computer to pin it open. Click again to close it.
  - An open strip is as wide as its longest line. Lines wrap when they would run off the screen.
  - Strip height follows the list's content.
- **Progress as a fill.** Ticked items drop into a tinted block at the bottom of the strip. The same tint fills the bottom of the closed strip's title column, so the strip works as a progress bar.
- **Edit and delete icons** appear in the strip's title column on hover and stay visible while the strip is open. Delete needs a second tap within 3 seconds to confirm.
- **Completion popup.** When every checkbox in a list is ticked, a popup offers:
  - **Repeat** to untick everything and use the list again
  - **Resolve** to move the list to the **Resolved** tab (use the restore arrow to bring it back)
- **Today's date** is shown next to the title and updates itself at midnight.
- **Daily lists.** When a new day starts, every active list that has ticked items is reset (all checkboxes unticked, as if you chose Repeat) and a short notice appears. Resolved lists are left alone. This runs when the app is opened, when you return to it, and while it stays open past midnight.
- **Onboarding.** A 3-step intro opens on first visit. Close it with the X button or Esc. The **?** button reopens it.
- **Light and dark mode.** It follows the device setting until you use the sun/moon toggle, then it remembers your choice.
- **Responsive.** Single column on phones and tablets. On screens 900px wide or more, the app fills the window. The "New list" button shows only its icon and reveals its label on hover.

## Using it

### Open it

- Open `listpad.html` in a browser, or host the file on any static web host.
- Installing the app needs the page to be served over HTTPS.

### Install it

- **Chrome and Edge (desktop or Android):** use "Install app" in the address bar or menu.
- **Safari on iPhone and iPad:** Share, then "Add to Home Screen".

### Basic flow

1. Tap **New list** (the round **+** button, bottom right).
2. Type a title and your items. Use the tools above the text area.
3. Tap **Save list**. The list appears as a strip.
4. Open the strip and tick items as you finish them.
5. When everything is ticked, choose **Repeat** or **Resolve**.

## Project structure

```
index.html            page shell (loads the stylesheet and script)
style.css             all styling, light and dark themes
app.js                app logic
content.json          interface text and the onboarding steps (with their illustrations)
manifest.webmanifest  PWA manifest
sw.js                 service worker (offline support)
icons/                app icons (PNG for install, SVG for the browser tab)
.nojekyll             tells GitHub Pages to serve the files as they are
```

- `app.js` loads `content.json` when it starts. To change a label, an empty-state message or an onboarding step, edit `content.json`. You don't need to touch `app.js`.
- Text with a number in it uses placeholders, for example `"Step {n} of {total}"`.
- Your lists are **not** in `content.json`. They are saved in the browser (see below).
- Because the page fetches `content.json`, it must be opened through a web server. Opening `index.html` straight from disk shows an error message. For local testing, run `python -m http.server` in the folder and open `http://localhost:8000`.

## Hosting on GitHub Pages

1. Put the files at the root of a repository (or in `/docs`) and push.
2. In the repository, open **Settings, then Pages**, and choose to deploy from that branch and folder.
3. The site is served over HTTPS at `https://<user>.github.io/<repo>/`.

Things to know:

- **Paths are relative** (`style.css`, not `/style.css`), so the app works under the `/<repo>/` sub-path. Keep it that way if you add files.
- **Shared storage.** Every site under `<user>.github.io` shares the same browser origin, so other projects on your account can read this app's `localStorage`. Keys here start with `listpad:` to avoid clashes.
- **Updates can take a few minutes** to appear because GitHub Pages caches files for about 10 minutes. The service worker asks the network first and re-checks files, so a normal refresh normally picks up changes. If it doesn't, hard-refresh once.
- **File names are case-sensitive** on GitHub Pages.
- **Fonts** load from Google Fonts. Offline, the app falls back to the system font.

## Data and storage

Lists are stored in your browser's `localStorage`, so they stay on that device and in that browser. There is no account, sync or backup.

| Key | What it holds |
| --- | --- |
| `listpad:v1` | All lists |
| `listpad:day` | The last date the app saw, used to detect a new day |
| `listpad:ob` | Set once the onboarding has been seen |
| `listpad:theme` | `light` or `dark`, only after you use the toggle |

A list looks like this:

```json
{
  "id": "lk3f9a2b",
  "t": "Groceries",
  "s": "active",
  "n": 0,
  "items": [
    { "k": "check", "h": "Milk", "d": false },
    { "k": "bullet", "h": "Notes go here" },
    { "k": "text", "h": "A plain line" }
  ]
}
```

- `k` is the item type: `check`, `bullet` or `text`.
- `h` is the item text. Only `<b>` is kept, and everything else is escaped.
- `d` is the ticked state of a checkbox item.
- `s` is `active` or `resolved`.
- `n` counts how many times the list was repeated.

To reset the app, clear the site's data in your browser, or delete the four keys above.

## PWA notes

- `manifest.webmanifest` and the icons in `icons/` make the app installable.
- `sw.js` caches the app's files so it keeps working offline. It asks the network first and uses the cache only when the network fails, so updates are not held back.
- The service worker only controls the folder it sits in, so keep `sw.js` next to `index.html`. If you add or rename files, update the `CORE` list in `sw.js`.
- The service worker needs HTTPS or `localhost`, which GitHub Pages and a local server both provide.

## Tech

- Plain HTML, CSS and JavaScript, with interface text in JSON. No framework or build step.
- Font: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) from Google Fonts. If it can't load, the app falls back to the system font.
- Needs a modern browser. The styling uses `color-mix()`, `svh` units and CSS `writing-mode`.
- Theme colours are CSS variables at the top of the stylesheet (`--page`, `--acc`, `--c0` to `--c4`, and so on), with dark values under `prefers-color-scheme` and `[data-theme="dark"]`.

## Known limitations

- The new-day check uses the device's local date and clock. Changing the device date can trigger or skip a reset, and a reset only happens when the app is opened or running, not in the background.
- Editing a list clears its ticks, because the content changes.
- Lists exist only in one browser on one device. There is no export or import.
- Bullet and plain lines can't be ticked. Only checkbox lines count toward progress.
- Lists with no checkbox lines show no progress and never trigger the completion popup.
- Nested lists and drag-to-reorder aren't supported.
