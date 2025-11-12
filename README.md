Portfolio Website — Basic Starter

This is a small, static portfolio starter with a responsive layout, basic interactivity, and a contact form (client-side demo only).

Files created:
- `index.html` — main HTML file with sections (hero, about, projects, contact).
- `styles.css` — simple mobile-first responsive styles.
- `script.js` — small JS for nav toggle, smooth scroll, and demo form handling.

How to view locally

Option A — Open directly in your browser
- Double-click `index.html` or open it from your editor. For local files this often works, but some features (fetch, modules) may require a local server.

Option B — Start a tiny local HTTP server (recommended)

PowerShell (if you have Python installed):

```powershell
# from the project folder
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or, if you prefer Node and have `http-server` installed:

```powershell
npx http-server -c-1 . 8000
```

Next steps / suggestions
- Replace placeholder text and projects with your real content.
- Add images and thumbnails (create an `assets/` folder).
- Hook up the contact form to a backend or email service (Formspree, Netlify Forms, etc.).
- Optionally add a build step (Vite/Parcel) for asset optimization.

If you want, I can:
- Add sample project pages and thumbnails.
- Create a deploy script for GitHub Pages or Netlify.
- Add a CSS color/theme customization or a dark/light toggle.

