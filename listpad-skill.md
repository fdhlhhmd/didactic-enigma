---
name: listpad
description: Build "Listpad", an installable single-file web app for writing daily lists. Write a list like a note, see it as a vertical strip on a shelf, tick items off, then repeat or resolve it. Use this when asked to recreate Listpad or build a new app with the same design and structure.
---

# Listpad: build specification

You are building **Listpad**, a small installable web app (PWA) for writing lists. This file is the complete brief. Follow it closely so the result has the same design, structure and behaviour as the original. Where something is not specified, choose the simplest option that fits the rest of the spec.

## 1. Deliverable

- **One self-contained file**, `listpad.html`. HTML, CSS and JavaScript only. No framework, no build step, no bundler.
- External resources allowed: the Google Fonts stylesheet for **Space Grotesk** (weights 500, 600, 700). Give the font a `system-ui, sans-serif` fallback. Nothing else may be loaded from the network.
- All data lives in `localStorage`. Wrap every read and write in `try/catch` and keep working from memory if storage is unavailable.
- Installable as a PWA: generate the web app manifest in JavaScript (a `Blob` URL added as `<link rel="manifest">`) and use an inline SVG data URI as the icon. Add `apple-touch-icon`, `theme-color`, `viewport-fit=cover` and the `mobile-web-app-capable` meta tags.
- No service worker is required. If the target host allows one, offer an optional `sw.js` that caches the page.
- Needs a modern browser. The design uses `color-mix()`, `svh` units, `:focus-visible` and `writing-mode`.

## 2. What the app does

1. The user writes a list in a note-style editor with three tools: bold, checkbox line, bullet list.
2. Saved lists appear as **narrow vertical strips side by side**, like books on a shelf. Only the title shows when closed.
3. Opening a strip shows the full list. The user ticks checkbox lines. Ticked lines drop to a tinted block at the bottom, so the strip fills like a progress bar.
4. When every checkbox in a list is ticked, a popup asks **Repeat** (untick everything) or **Resolve** (move to the Resolved tab).
5. The list is **daily**: today's date is shown next to the app title, and when a new day starts every active list that has ticked items resets automatically.
6. A 3-step onboarding explains the app on first visit.

## 3. Screens and structure

Keep this structure and these positions exactly.

```
body (page gradient, 22px 16px padding)
├─ .app            the white rounded panel (single column, max-width 760px)
│  ├─ GALLERY VIEW (default)
│  │  ├─ .top
│  │  │  ├─ .tt    title "Listpad" (h1) + today's date (<time>) to its right
│  │  │  └─ .tb    theme toggle button (sun/moon) + help button "?"
│  │  ├─ .tabs     segmented control: "Active (n)" | "Resolved (n)"
│  │  └─ .stack    horizontal shelf of strips (or an empty-state message)
│  │     └─ .strip × N
│  │        ├─ .head   58px vertical title column (title, edit/delete icons, count)
│  │        └─ .body > .in
│  │           ├─ .todo      items not yet done
│  │           └─ .donebox   ticked checkbox items (tinted)
│  └─ EDITOR VIEW (replaces the gallery inside .app)
│     ├─ .top          "Back" button (left), "Save list" button (right)
│     └─ .sheet        white rounded sheet: title input, tool pill, ruled editor
├─ .fab            round "+" button, fixed bottom right (label shows on hover)
├─ completion popup (.scrim > .modal)   rendered inside the gallery view
├─ #ob             onboarding overlay (full screen), outside .app
└─ #toast          small notice pill, outside .app
```

Only two views exist: `gallery` and `edit`. There is no separate detail page. A list is read and ticked inside its open strip.

## 4. Design system

### 4.1 Mood

Light, cloudy sky blue. Soft, pill-shaped, airy. Pale blue page with faint white cloud patches, a near-white panel, pastel gradient strips, one calm blue accent. No hard borders on cards, soft shadows only.

### 4.2 Tokens

Define these on `:root`, then override for dark mode in both `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` and `:root[data-theme="dark"] { ... }`.

```css
/* LIGHT */
--page: radial-gradient(420px 220px at 12% 8%, rgba(255,255,255,.85), transparent 70%),
        radial-gradient(520px 260px at 86% 20%, rgba(255,255,255,.7), transparent 70%),
        radial-gradient(640px 300px at 28% 94%, rgba(255,255,255,.65), transparent 70%),
        linear-gradient(180deg, #C6DBF0 0%, #DCE9F6 55%, #EBF3FA 100%);
--bg: #FBFDFF;  --bgimg: linear-gradient(180deg, #FBFDFF 0%, #EDF3FA 100%);
--surface: #fff;  --ink: #17212E;  --mute: #7C8BA0;
--line: #DCE6F2;  --dash: #BCCFE5;
--acc: #5886BF;  --pill: #5886BF;
--track: linear-gradient(90deg, #DCE8F5, #E8F1FA);
--shadow: rgba(70,110,160,.2);
--tick: linear-gradient(135deg, #A7C6E8, #5886BF);
--btn: linear-gradient(180deg, #8EB3DE, #5C8AC4);
--c0: linear-gradient(165deg, #DCEAF8, #C8DCF2);  /* blue     */
--c1: linear-gradient(165deg, #F8E6D8, #F1D3BF);  /* peach    */
--c2: linear-gradient(165deg, #E1F2EA, #CBE5D8);  /* mint     */
--c3: linear-gradient(165deg, #F8E1EA, #F0CBDA);  /* pink     */
--c4: linear-gradient(165deg, #E4E6F8, #D3D8F2);  /* lavender */
--hf: 'Space Grotesk', system-ui, sans-serif;  --bf: same;

/* DARK (deep slate blue) */
--page: radial-gradient(500px 260px at 15% 8%, rgba(110,150,210,.14), transparent 70%),
        radial-gradient(560px 280px at 85% 90%, rgba(110,150,210,.1), transparent 70%),
        linear-gradient(180deg, #111C2E, #0A111D);
--bg: #141E30;  --bgimg: none;  --surface: #1B2740;  --ink: #E6EEF9;  --mute: #97A8C0;
--line: #2A3A55;  --dash: #3A4F70;  --acc: #8FB4E0;  --pill: #4B78B0;
--track: linear-gradient(90deg, #1E2C46, #243450);  --shadow: rgba(0,0,0,.4);
--btn: linear-gradient(180deg, #5E8CC4, #4B78B0);  --tick: linear-gradient(135deg, #6E9ACB, #4B78B0);
--c0: linear-gradient(165deg, #25405F, #1E3350);  --c1: linear-gradient(165deg, #5A4333, #4A372A);
--c2: linear-gradient(165deg, #25503F, #1E4033);  --c3: linear-gradient(165deg, #5A3345, #47293A);
--c4: linear-gradient(165deg, #343A70, #292E5C);
```

Other fixed colours: danger red `#D6455D`. Theme-color meta: `#C6DBF0` (light), `#0A111D` (dark).

### 4.3 Typography

Space Grotesk everywhere. Base `500 16px/1.5`.

| Element | Size / weight | Notes |
| --- | --- | --- |
| App title (h1) | 34px / 700 | letter-spacing -.02em, colour `--acc` |
| Date next to title | 15px / 600 | colour `--mute`, no wrap |
| Editor title input | 30px / 700 | |
| Strip title | 19px / 700 | vertical text |
| Item text | 17px / 600 | |
| Editor body | 17px, line-height 32px | |
| Count in strip | 13px / 600 | opacity .7 |
| Modal / onboarding h2 | 30px / 700 and 24px / 700 | |

### 4.4 Shape, shadow, motion

- Panel radius **32px**. Sheet and popup radius **28px**. Strips **24px**. Buttons, tabs, tool pill and icon buttons are fully round (999px or 50%). Onboarding primary button radius 14px.
- Shadows use `--shadow`. Panel: `0 24px 60px rgba(50,90,140,.3)`. Strip: `0 8px 20px var(--shadow)`. Sheet: `0 14px 40px var(--shadow)`.
- Motion only answers an action: strip width `.3s ease`, head colour `.25s`, icon buttons fade `.15s`, add-button label `.25s`. Respect `prefers-reduced-motion` by disabling transitions.
- Visible keyboard focus: `outline: 3px solid var(--acc); outline-offset: 2px`.

## 5. Components

### 5.1 Page and panel

- `body`: `background: var(--page) fixed; padding: 22px 16px`.
- `.app`: `max-width: 760px; margin: 0 auto; padding: 22px 18px 110px; border-radius: 32px; background: var(--bg) + var(--bgimg); min-height: calc(100svh - 44px)`.
- `:root` also gets `padding-top/bottom: env(safe-area-inset-*)`.
- **Desktop (min-width 900px): full screen.** `body` padding 0. `.app` becomes `width: 100%; max-width: none; min-height: 100svh; border-radius: 0; box-shadow: none; padding: 32px 56px 120px`.

### 5.2 Header

- `.top` is a flex row, `align-items: center`, `justify-content: space-between`, 12px gap, 18px bottom margin.
- Left: `h1` "Listpad" and a `<time datetime="YYYY-MM-DD">` showing today's date as `toLocaleDateString(undefined, {weekday:'short', day:'numeric', month:'short'})`, for example "Thu, 8 Oct". They sit on one baseline with a 12px gap and wrap if there is no room.
- Right: two 38px round buttons on `--surface` with `0 2px 12px var(--shadow)`:
  - Theme toggle. Shows a **moon** icon in light mode and a **sun** icon in dark mode. `aria-label` is "Switch to dark mode" or "Switch to light mode".
  - Help "**?**" (`aria-label="How it works"`) reopens the onboarding.

### 5.3 Tabs

- Track: `display:flex; gap:6px; padding:6px; border-radius:999px; background: var(--track)`.
- Two equal buttons, "Active (n)" and "Resolved (n)", `padding:10px 16px`, weight 600. The selected tab is a `--surface` pill with a small shadow. Use `role="tablist"`, `role="tab"` and `aria-selected`.

### 5.4 The shelf of strips

`.stack`: `display:flex; align-items:flex-start; gap:8px; overflow-x:auto; scroll-snap-type:x proximity; padding:4px 4px 14px`. Strips are top-aligned, so each strip's height equals its own content height.

**Strip (`.strip`)**: `display:flex; border-radius:24px; overflow:hidden; box-shadow; scroll-snap-align:start`. Background is `var(--cN)` where `N = (index of the list in the full lists array) % 5`, so a list keeps its colour across tabs.

**Head (`.head`)**: a 58px-wide column, `padding: 26px 0 22px`, `gap:12px`, centred, whole column clickable.
- A real `<button class="tg">` holds the title. Title text uses `writing-mode: vertical-rl`, single line, ellipsis, `max-height: 260px`.
- Below it, the icon buttons (`.hb`, a column, 6px gap). Each is a 34px round button with a thin white-ish border (`rgba(255,255,255,.35)` on `rgba(255,255,255,.14)`), SVG line icons 18px:
  - Active lists: **pencil** (Edit list) and **bin** (Delete list).
  - Resolved lists: **restore arrow** (Move back to active) and **bin**.
  - Hidden by default (`opacity:0; pointer-events:none`). Visible when the strip is hovered, open, or focus is inside them.
- Bottom of the column: the done count, for example `2/5`, only if the list has checkbox lines.
- **Progress fill:** the head's background is `linear-gradient(to top, var(--dn) var(--fill), transparent var(--fill))`. `--dn` is `rgba(88,134,191,.28)` in light mode. `--fill` is the pixel height of the `.donebox`, measured in JavaScript so the fill lines up with the done block when the strip is open.
- Do **not** nest buttons. The head is a `div`. The title is a button. The icon buttons are siblings.

**Body (`.body > .in`)**: `.body` is a flex item with `width:0; overflow:hidden; transition: width .3s`. `.in` is `flex:none; width: var(--sw); display:flex; flex-direction:column`.
- `.todo` (`flex:1; padding: 20px 22px 12px 14px`) lists every line except ticked checkboxes, in original order.
- `.donebox` (`background: var(--dn); padding: 8px 22px 16px 14px`) lists ticked checkbox lines, and is omitted when there are none. It always sits at the bottom of the strip.

**Open and hover states**
- **Open (`.strip.open`)**: the body width becomes `var(--sw)`, and the head turns solid `--pill` with white text. `--dn` inside the open head becomes `rgba(255,255,255,.4)`.
- **Hover (only on `(hover:hover)` devices):** hovering a closed strip opens it as a preview, using the same styles as open, but only while no strip is pinned (`.stack:not(.has-open)`) and the strip is not `.shut`.
- **Click or tap** toggles a strip open (pinned). Opening one strip closes the others. Closing by click adds `.shut` to that strip so it does not instantly re-open from hover, and `.shut` is removed on `mouseout`. After opening, scroll the strip into view with `scrollIntoView({behavior:'smooth', block:'nearest', inline:'start'})`.
- Strips are draggable. Dropping a strip on another strip reorders the visible lists, saves the new order, and keeps the moved strip open and in view. The edit, restore, and delete controls remain hover-only.
- Checking an item rerenders the gallery; after that rerender, scroll the currently open strip back into view so it remains the visual focus.
- The mouse wheel scrolls the shelf sideways when the pointer is not over an open list.

**Open width follows the content (`--sw`)**, set per strip in a `fit()` function:
1. `max = stack.clientWidth - 8 - 58 - 2`, never below 200.
2. Temporarily set `.in` to `width: max-content; max-width: max px`, read its width, then clear the inline styles.
3. `--sw = min(max, max(240, measured))` in pixels.
4. Item text must wrap (`overflow-wrap: anywhere; min-width: 0`), so long lines break instead of running off screen.
5. Then set `--fill` from the `.donebox` height (see above).
6. Run `fit()` after every render (in `requestAnimationFrame`), on `resize`, and when `document.fonts.ready` resolves.

### 5.5 Item rows (inside an open strip)

- **Checkbox row** is a `<button role="checkbox" aria-checked>`: flex, 12px gap, `padding:12px 4px`, bottom border `1.5px dashed var(--dash)`.
  - Left: a 24px **circle** with a 2px `--acc` ring. When ticked, the ring contains a solid dot (`radial-gradient(circle, var(--acc) 0 38%, transparent 42%)`), and the text turns to `opacity:.55` with `line-through`.
  - Clicking toggles the tick, saves, re-renders, and checks for completion.
- **Plain or bullet row** is a `div`: `•` for bullets, nothing for plain text. These cannot be ticked.
- Text is rich only for **bold**.

### 5.6 Add button (FAB)

- Fixed, round, `background: var(--btn)`, white, `padding:8px`, shadow `0 10px 26px rgba(88,134,191,.5)`.
- Contains a 38px circle with a `+` (`rgba(255,255,255,.3)` background) and a hidden label "New list".
- **Icon only by default.** On `:hover` or `:focus-visible` the label slides open (`max-width 0 → 120px`, padding `0 16px 0 12px`).
- Markup: `<button class="fab" data-new aria-label="New list" title="New list"><span class="pl">+</span><span class="lb">New list</span></button>`.
- **Mobile position:** `right: max(34px, calc(50% - 362px))`, `bottom: calc(46px + env(safe-area-inset-bottom))`. This keeps it inside the panel and slightly raised.
- **Desktop (≥900px):** `right: 32px; bottom: 32px`.

### 5.7 Editor view

- Top row: **Back** (outlined pill) on the left, **Save list** (gradient pill, `--btn`, white) on the right.
- `.sheet`: `--surface`, radius 28px, 1px `--line` border, padding `16px 22px 20px`.
  - Title `<input maxlength="80" placeholder="Title">`, borderless, 30px / 700.
  - **Tool pill** (`--track` background, 4px padding, round) with three round buttons in this order: **B** (bold), **☑** (checkbox), **•≡** (bullet list). Hovering a tool shows a `--surface` background. Tools use `mousedown` + `preventDefault` so the editor keeps its selection.
  - **Editor** `contenteditable` div, `min-height: 48vh`, ruled-paper lines (a `repeating-linear-gradient` every 32px in `--line`, `background-attachment: local`), line-height 32px.
  - A checkbox line is a block `div[data-t="check"]` with `padding-left:36px` and a 20px circle ring (`::before`, 2px `--acc` border).
- Call `document.execCommand('defaultParagraphSeparator', false, 'div')` and focus the editor on open.

### 5.8 Completion popup

- Appears when a list that has at least one checkbox gets all its checkboxes ticked (and is not resolved).
- Centred card on a scrim (`rgba(15,35,35,.45)` plus `backdrop-filter: blur(4px)`), `max-width: 380px`, radius 28px, padding `28px 24px 24px`.
- Title **"All done!"**, text **"Every item is ticked. What next?"**, two equal buttons: **Repeat** (outlined) and **Resolve** (gradient).

### 5.9 Onboarding

A full-screen overlay (`#ob`, `z-index: 50`, background `var(--page)`), centred card, `max-width: 420px`, `min-height: min(700px, calc(100svh - 44px))`, radius 32px, padding `22px 24px 24px`, centred text, content spread vertically.

- Top row (3-column grid): empty cell, the "Listpad" wordmark centred in `--acc` (22px / 700), and a **round X close button** on the right (38px, `--surface`, `aria-label="Skip intro"`). Esc also closes it.
- A line-art illustration (inline SVG, `viewBox="0 0 240 180"`, strokes `currentColor` 2.5px, round caps, pastel fills `#CFE0FB`, `#DCE8FB`, `#F8D9C2` and accent `#5886BF`).
- Title (24px / 700) and a muted description (max-width 310px).
- Progress dots: 8px dots, the active one stretches to 22px and uses `--acc`.
- Buttons: **Back** (from step 2) and a wide gradient **Next** button that reads **Get started** on the last step.
- Shown automatically on first visit. Closing or finishing stores `listpad:ob`. The **?** button reopens it at step 1.

| Step | Title | Description | Illustration |
| --- | --- | --- | --- |
| 1 | Write it like a note | Tap “New list” and start typing. Use B for bold, ☑ for a checkbox line and •≡ for bullets. Press Enter after a checkbox to add the next one. | A note card with a tool pill (B, checkbox, bullets) and three lines: one empty circle, one ticked and struck, one with a cursor |
| 2 | Your lists become strips | Each list is a narrow strip. Hover or tap one to open it, then tick items off. Ticked items drop to the bottom and the strip fills up like a progress bar. The pencil edits and the bin deletes. | Two closed strips (blue, peach) and one open strip with a blue head, two item rows and a tinted done block |
| 3 | Finish it or run it again | Tick every checkbox, then Repeat the list or Resolve it to the Resolved tab. Active lists also start fresh on their own every new day. | A large circle with a check mark above two small pills labelled "Repeat" and "Resolve" |

### 5.10 Toast

A small pill centred above the add button (`bottom: calc(116px + safe-area)`), `--pill` background, white text, weight 600, `role="status"`, auto-hides after 6 seconds. Used only for the daily reset notice.

## 6. Data and logic

### 6.1 State (module-level variables)

`lists` (array), `view` (`'gallery' | 'edit'`), `tab` (`'active' | 'resolved'`), `cur` (id of the open or edited list, or null), `modal` (boolean), `obStep` (0–2 or null).

### 6.2 Data model

```json
{
  "id": "short unique string",
  "t": "title (plain text)",
  "s": "active | resolved",
  "n": 0,
  "items": [
    { "k": "check",  "h": "text with <b>bold</b>", "d": false },
    { "k": "bullet", "h": "text" },
    { "k": "text",   "h": "text" }
  ]
}
```

- `k` is the line type, `h` is sanitised HTML, `d` is the ticked state (checkbox lines only), `n` counts repeats.
- New lists are added to the **front** of the array.

### 6.3 localStorage keys

| Key | Value |
| --- | --- |
| `listpad:v1` | JSON array of all lists |
| `listpad:ob` | `"1"` once onboarding has been seen |
| `listpad:theme` | `"light"` or `"dark"`, only after the user uses the toggle |
| `listpad:day` | Last date seen, `YYYY-MM-DD` in local time |

### 6.4 Editor rules

- **Serialise (editor DOM → items):** walk the editor's direct children.
  - A text node becomes a `text` item.
  - `UL` or `OL` becomes one `bullet` item per `li`.
  - A `div` becomes a `check` item if it has `data-t="check"`, otherwise `text`. Skip empty lines.
  - Sanitise: keep text (escaped) and `<b>` only. Treat `<strong>` and bold font-weight styles as `<b>`. Drop everything else.
  - Every saved checkbox starts with `d:false`, so editing a list clears its ticks.
- **Load (items → editor DOM):** checkbox lines become `div[data-t="check"]`. Consecutive bullets are grouped in one `ul`. Everything else is a `div`. An empty list starts as `<div><br></div>`.
- **Checkbox tool:** toggles `data-t="check"` on the current block (wrap a loose text node in a `div` first). Does nothing inside a bullet list.
- **Enter key on a checkbox line:** prevent the default and create a new `div[data-t="check"]` after it. Text after the caret moves into the new line. If the line is empty, remove `data-t` instead, which ends the checklist.
- **Save list:** if there is no content and no title, just go back. Otherwise update the open list (and set it `active`) or create a new one, save, switch to the gallery, select the **Active** tab, and leave that list open.

### 6.5 Progress, completion, repeat, resolve

- `progress = [ticked checkbox count, total checkbox count]`.
- After each tick: `modal = total > 0 && ticked === total && list is not resolved`.
- **Repeat:** untick every checkbox, `n += 1`, close the popup, stay on the list.
- **Resolve:** set `s = 'resolved'`, close the popup, switch to the Resolved tab, close all strips.
- **Restore (Resolved tab):** set `s = 'active'`, untick everything.
- **Delete:** two-step. The first press turns the bin button red (`.armed`, label "Tap again to delete") for 3 seconds. A second press within that time deletes. Do **not** use `window.confirm`, because it can be blocked in embedded pages.

### 6.6 Daily reset

- `dayKey()` returns the local date as `YYYY-MM-DD`.
- `rollDay()`:
  1. If `dayKey()` equals the stored `listpad:day`, do nothing.
  2. Otherwise store the new day. If there was no previous day (first ever run), stop without resetting anything.
  3. For every list with `s !== 'resolved'` that has at least one ticked checkbox: untick all its checkboxes and do `n += 1`. Count these lists.
  4. If the count is above zero: close any open popup, save, and show the toast **"New day: 1 list was reset."** or **"New day: N lists were reset."**
- Call `rollDay()` once before the first render. Then re-check every 30 seconds, on `visibilitychange` (when the page becomes visible) and on window `focus`. When a new day is detected, re-render, **except** while in the editor view, so a draft is never wiped.
- Resolved lists and lists with nothing ticked are never changed.

### 6.7 Theme

- Default follows `prefers-color-scheme`. The toggle sets `document.documentElement.dataset.theme` to `light` or `dark` and stores it in `listpad:theme`.
- Effective theme = `data-theme` if set, otherwise the system setting. The toggle icon and label come from the effective theme. Update the `theme-color` meta tag whenever it changes. Re-render if the system setting changes while no choice has been stored.

### 6.8 Rendering approach

Use a small `render()` that rebuilds the `#app` content as an HTML string from the state (`gallery()` or `editor()`), plus event delegation with one `click` listener using `data-*` attributes (`data-open`, `data-tick`, `data-edit`, `data-del`, `data-restore`, `data-new`, `data-tab`, `data-cmd`, `data-done`, `data-cancel`, `data-repeat`, `data-resolve`, `data-help`, `data-theme-toggle`, `data-ob-next`, `data-ob-back`, `data-ob-skip`). Escape all user text before inserting it. Opening and closing a strip should toggle classes on the existing elements instead of re-rendering, so the width transition can animate.

## 7. Copy

| Where | Text |
| --- | --- |
| Empty Active tab | No lists yet. Tap “New list” to write your first one. |
| Empty Resolved tab | Resolved lists show up here. |
| Icon button labels | Edit list · Delete list · Move back to active · How it works · Skip intro · New list |
| Editor placeholders | Title · aria-label "List content" |
| Editor buttons | Back · Save list |
| Untitled list | Untitled |

Tone: short, plain verbs, sentence case. An action keeps the same name wherever it appears.

## 8. Responsive behaviour

- **Phone and tablet:** one centred column, max 760px. The add button is inside the panel, bottom right.
- **Desktop (≥900px):** the app fills the whole window. No rounded outer frame. The add button sits 32px from the window's bottom-right corner.
- Strips must scroll horizontally inside `.stack` when they overflow. The page itself must never scroll sideways.

## 9. Accessibility

- Every icon-only button has an `aria-label` and a `title`.
- Strip titles are buttons with `aria-expanded`. Item rows use `role="checkbox"` with `aria-checked`. Tabs use `role="tab"` with `aria-selected`. The popup and onboarding use `role="dialog"` and `aria-modal="true"` with a labelled heading. The toast uses `role="status"`.
- Keyboard: everything is reachable by Tab. Icon buttons inside a strip become visible when focused. Esc closes the onboarding. Focus moves to the primary button when the onboarding step changes.
- Text contrast must stay readable on every strip gradient in both themes.

## 10. Build order

1. Page shell, tokens (light and dark), fonts, panel, header with date, theme toggle and help button.
2. Data layer: state, `localStorage` load and save, model, sanitiser.
3. Editor view with the three tools, Enter handling, save and cancel.
4. Gallery: tabs, strips, open and hover behaviour, items, done block, progress fill, `fit()`.
5. Icon buttons (edit, delete with two-step confirm, restore), completion popup, repeat and resolve.
6. Daily reset and toast.
7. Onboarding and the manifest.
8. Desktop full-screen layout, add-button position, final polish.

## 11. Acceptance checklist

Check each item before calling the build done.

- [ ] One HTML file, no framework, loads only the Space Grotesk stylesheet from the network.
- [ ] Title "Listpad" with today's date to its right. The date changes at midnight without a reload.
- [ ] Theme toggle switches light and dark, remembers the choice, and the icon matches the mode.
- [ ] Editor has title, B, ☑ and •≡ tools. Enter after checkbox text creates another checkbox. Enter on an empty checkbox line ends the checklist.
- [ ] Saved lists appear as vertical strips, side by side, top-aligned, each as tall as its content, with the title written vertically.
- [ ] Hover or tap opens a strip. Click pins it. The others are pushed off screen. The open width follows the content and long lines wrap before leaving the screen.
- [ ] Ticked items move to a tinted block at the bottom, and the closed strip's title column fills to match. The count updates (`2/5`).
- [ ] Edit and delete icons appear on hover and stay while the strip is open. Delete needs a second press within 3 seconds.
- [ ] Ticking the last checkbox opens the popup. Repeat unticks all. Resolve moves the list to the Resolved tab. Restore works from there.
- [ ] A new day resets active lists that have ticked items, shows the toast, leaves resolved lists alone, and never wipes an open editor.
- [ ] Onboarding has 3 steps, a round X close button, Back, Next and Get started. It shows once, and **?** reopens it.
- [ ] Add button is icon only and shows "New list" on hover. On phones it is inside the panel and slightly raised.
- [ ] On screens 900px or wider the app is full screen.
- [ ] Works with `localStorage` blocked (in-memory fallback, no errors).
- [ ] Installable: manifest and icon are generated inline.

## 12. Out of scope

Accounts, sync, export or import, nested lists, ticking bullet or plain lines, reminders or notifications, offline caching by default.
