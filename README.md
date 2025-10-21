Website project — PDF manifest / modal gallery

This repository contains a small static website with a manifest-driven PDF gallery. Thumbnails are expected under `assets/pdfs/<project>/thumbs/` and are omitted from the repository by default.

To run locally:

1. Start a simple server from the project root:
   - Python: `python -m http.server 8000`
   - Node: `npx http-server -p 8000`

2. Open http://localhost:8000 in your browser.

Thumbnails: Place generated thumbnail images under `assets/pdfs/<project>/thumbs/` and update `assets/pdfs/manifest.json`.
