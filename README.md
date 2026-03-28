# outlandish humor · links

A personal essay curation site built as a fully static site — no backend, no database, no CMS. Hosted on GitHub Pages. Essays are stored directly in `index.html` and updated via the GitHub API from the browser UI.

**Live site:** https://komalbhowsinka.github.io/links/

---

## Features

### For visitors

**Food for Thought tab**
- Browse essays grouped in collapsible year → month accordions
- Filter by category using pill buttons at the top
- Click any essay card to open the original article in a new tab
- Essays tagged `✦ recommended` are marked with a pink badge — submitted by others and curated by the owner

**Recommend tab**
- Submit a recommendation anonymously — no sign-up, no name required
- Choose between two types:
  - **Essay / Article** — paste a URL
  - **Book** — provide title and author name
- Submissions go to the owner via Formspree

**About tab**
- Bio and links to Instagram, LinkedIn, email, art account, and The Sky of Musing (Articles By the Owner)

---

### For the owner

**How to unlock**

Triple-click the 🔒 at the bottom of the page. A login modal appears with four fields:

| Field | Purpose |
|---|---|
| Password | Owner password defined in `app.js` |
| GitHub Token | Classic token with `repo` scope — validated against GitHub on login - expires every 60 days - needs to be re generated|
| Formspree API Key | Optional — needed to view the recommendations inbox in the app |
| Branch | Defaults to `main` — the branch all commits are pushed to |

The token is validated against GitHub at login time. If the token has expired, an error appears in the login box before you get in, with instructions to generate a new one.

All credentials are stored in `sessionStorage` only — cleared automatically when the tab closes. Nothing sensitive is ever in the source code.

**Adding an essay**
- After logging in, click **+ add essay** at the bottom of the Food for Thought tab
- Fill in: title, URL, source, description, category, and optionally a date (month + year dropdowns, defaults to today if left blank)
- Hit **save essay** → essay is added immediately, committed to GitHub, page reloads in 2.5 seconds

**Deleting an essay**
- While logged in, every essay card shows a `✕` button in the top-right corner
- Click `✕` → styled confirmation modal appears
- Confirm → essay removed, committed to GitHub, page reloads

**Recommendations inbox**
- Owner has to login to https://formspree.io/ And open the outlandish reccomendations form -> submission tab  - to view all submission

**Every save or delete:**
- Commits directly to the configured branch on GitHub
- Shows a toast: ⏳ in progress → ✅ success → ⚠️ failure with error detail
- Reloads automatically after 2.5 seconds on success
- Owner mode is restored after reload — no need to log in again

---

## Architecture

### File structure

```
links/
├── index.html    ← structure, markup, and essays data
├── styles.css    ← all styling and CSS variables
├── app.js        ← all logic, GitHub API, Formspree
└── README.md
```

### Data flow

The essays array lives in a `<script>` block in `index.html`, between two marker comments:

```html
<script>
  /* ESSAYS_START */
  let essays = [ ...all essays here... ];
  /* ESSAYS_END */
</script>
<script src="app.js"></script>
```

`app.js` loads after `index.html` so `essays` is already defined. `localStorage` overrides it if present. When an essay is added or deleted, `app.js` fetches the current `index.html` from GitHub, finds the markers, replaces the array, and commits the file back — all from the browser.

### Essay object shape

```json
{
  "id": 29,
  "title": "Essay Title",
  "url": "https://aeon.co/...",
  "source": "Aeon",
  "category": "Philosophy",
  "dateLabel": "Apr 2026",
  "desc": "One sentence description.",
  "recommended": true
}
```

`recommended` is optional — only present on essays promoted from the recommendations inbox.

### GitHub API usage

All GitHub operations use the [GitHub Contents API](https://docs.github.com/en/rest/repos/contents):

| Operation | Method | Endpoint |
|---|---|---|
| Validate token at login | `GET` | `/repos/{owner}/{repo}` |
| Fetch current `index.html` | `GET` | `/repos/{owner}/{repo}/contents/index.html` |
| Commit updated `index.html` | `PUT` | `/repos/{owner}/{repo}/contents/index.html` |

The token requires `repo` scope only. It is entered at login, validated immediately, and stored in `sessionStorage` for the tab session.

### Recommendations flow

```
Visitor submits URL or book title
          ↓
Formspree receives and stores it
          ↓
Owner reviews in Formspree dashboard or in-app inbox
          ↓
Owner promotes → fills in essay details → saves as recommended
          ↓
Essay appears on site with ✦ recommended tag
```

---

## Setup & maintenance

### Hosting
Hosted on GitHub Pages. Go to **Settings → Pages**, set branch to `main` and folder to `/(root)`.

### GitHub token renewal
The owner login requires a GitHub Personal Access Token (classic) with `repo` scope. Tokens are configured to expire every **60 days**.

To generate a new token:
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token → Generate new token (classic)**
3. Name: `outlandish-links`, Expiration: 60 days, Scope: `repo` only
4. Click **Generate token** — copy the `ghp_...` value immediately (shown once only)
5. Delete the old expired token from the same list

GitHub emails you before expiry as a heads-up. If you try to log in with an expired token, the login box shows: `your GitHub token has expired — generate a new one at github.com/settings/tokens`.

### Formspree
Recommendations are handled by [Formspree](https://formspree.io). The form endpoint is `https://formspree.io/f/mykbeybk`.

To view submissions without the API key, log into formspree.io → **Outlandish Recommendations** form → **Submissions** tab.

To use the in-app inbox, generate a Formspree API key at formspree.io → Account Settings → API Keys and enter it at login.

### Clearing stale localStorage
If the site ever looks out of sync with GitHub, open the browser console and run:

```js
localStorage.clear()
```

Then hard refresh: `Ctrl + Shift + R`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Hosting | GitHub Pages |
| Markup | HTML5 |
| Styling | CSS3 with custom properties |
| Logic | Vanilla JavaScript — no frameworks |
| Data storage | `index.html` committed via GitHub API |
| Form handling | Formspree |
| Fonts | Cormorant Garamond + Space Grotesk (Google Fonts) |
