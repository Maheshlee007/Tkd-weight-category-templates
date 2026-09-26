# Taekwondo Roster Builder

A small, fully static web app that generates weight-category student-list
sheets (Word `.docx` and `.pdf`) for Taekwondo kyorugi/poomsae registration —
starting from the official SGFI 2026-27 weight categories, or your own
federation's brackets.

Everything runs **in the browser**. There's no backend, no build step, and
no server-side dependency (no LibreOffice, no Node) — which is what makes it
deployable as a static site (GitHub Pages, Netlify, or just opening the file
locally).

## Running it

**Locally, no install:** double-click `index.html`, or serve the folder with
any static file server, e.g.:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

**Deploy to GitHub Pages:**
1. Push this whole folder to a GitHub repository.
2. Repo Settings → Pages → Deploy from branch → pick `main` (or your default
   branch) and the root folder.
3. GitHub gives you a URL like `https://yourname.github.io/repo-name/`.

There's nothing to configure — it's plain HTML/CSS/JS plus two vendored
libraries (see below), so any static host works the same way.

## How it works

- **Step 1 — Choose a weight-category set.** Two sets are built in (shown
  as "Built-in", read-only):
  - **SGFI 2026-27** — the official U-14/U-17/U-19 Boys &amp; Girls
    categories for the 70th National School Games.
  - **Standard (Sub Jr–Senior)** — the classic Sub Junior / Cadet / Junior
    / Senior age-group brackets, matching a commonly used blank
    registration template. *Note:* that source template listed a "Senior
    Boys" table twice with two different weight scales; the second one
    (the lower scale) is labelled "Girls" here to match the Boys/Girls
    pairing used by every other age group.
  - Click **Preview** or **Download .docx / .pdf** directly on either
    built-in card for instant output with no setup — or **Duplicate** to
    clone it into an editable copy, or **+ New set** to start from
    scratch.
- **Step 2 — School & categories.** Type the school name and tick which
  category pages to include (all are ticked by default).
- **Step 3 — Generate.** **Preview** shows exactly what each selected page
  will look like before you download; **Download .docx / .pdf** produce
  the real files. Each selected category becomes one page, with the
  weight-class boxes sized to fill the whole page.

**File names:** if you've typed a school name, downloads are named
`<school name>-<association>-<season>.<ext>` automatically. If no school
name is entered (e.g. using the quick Download buttons straight off a
built-in card), a small dialog asks what to call the file before it
downloads.

Custom sets are saved in the browser's `localStorage`, so they persist
between visits **on that browser/device**. Use **Export** / **Import JSON**
on a template to back it up or move it to another browser.

Everything is fully responsive — the whole flow (template list, editor,
preview) works cleanly on a phone-sized screen, not just desktop.

## Editing / creating a weight-category set

Everything is done through the on-screen form — no file editing required:

- **Association / federation name** and **season** — just labels, shown on
  the sheet and used in the downloaded filename.
- **Sheet title** — the bold heading printed at the top of every page.
  Defaults to the standard "TAEKWONDO KYORUGI AND POOMSAE STUDENTS LIST".
- **Category pages** — one per age group + sex combination (e.g. "U-14
  (Cadet) — Boys"). Each has a **Weight classes** box: one weight bracket
  per line, in the order they should appear top-to-bottom, e.g.:
  ```
  Under-18
  18 - 21
  21 - 23
  Over-41
  ```

If you'd rather hand-edit the underlying data (e.g. to script bulk template
creation), each set is just JSON — see `templates/sgfi-2026-27.json` for the
shape, and use **Import JSON** to load a hand-edited file back into the app.

```json
{
  "association": "SGFI",
  "season": "2026-27",
  "documentTitle": "TAEKWONDO KYORUGI AND POOMSAE STUDENTS LIST",
  "categories": [
    { "ageGroup": "U-14 (Cadet)", "sex": "Boys", "weights": ["Under-18", "18 - 21", "Over-41"] }
  ]
}
```

## Project layout

```
index.html          Page structure
style.css            Styling (responsive down to phone widths)
app.js               UI wiring: template list, editor, preview, generate/download, localStorage
app-data.js          The two built-in templates (SGFI 2026-27, Standard Sub Jr–Senior)
layout.js            Shared "fill the page" row-sizing math (used by both renderers)
render-docx.js       Builds the .docx (uses vendor/docx.iife.js)
render-pdf.js         Builds the .pdf (uses vendor/pdf-lib.min.js)
vendor/              Self-hosted copies of docx.js and pdf-lib — no CDN/network needed
templates/           Reference JSON export of each built-in set
```

## Notes on the page-fill sizing

Both renderers use the same logic (`layout.js`): given how many weight
brackets a category page has and how much vertical space is available, rows
are stretched evenly so the table always fills the page. If a custom set
ever has so many weight brackets that rows would become illegibly small,
the layout falls back to a comfortable minimum row height and spills the
rest onto additional pages instead — so it stays usable at any size.

The DOCX and PDF renderers are independent (Word/LibreOffice render text
differently than a hand-drawn PDF), but they're tuned to the same font
sizes and spacing so the two outputs look the same.
