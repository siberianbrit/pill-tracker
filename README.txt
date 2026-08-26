PILL TRACKER — PWA

Files:
- index.html — app
- manifest.webmanifest — iPhone web-app metadata
- sw.js — offline cache / service worker
- icon-180.png, icon-192.png, icon-512.png — app icons

IMPORTANT:
To install this as an iPhone web app, host these files on HTTPS. Do not open index.html directly from Files on the iPhone.

Recommended: GitHub Pages.
1. Create a GitHub repository.
2. Upload all files from this folder to the repository root.
3. GitHub: Settings -> Pages -> Deploy from branch -> main -> /(root) -> Save.
4. Open the resulting https://...github.io/... address in Safari on the iPhone.
5. Use Share -> Add to Home Screen. Keep "Open as Web App" enabled if shown.

Your medicine data is still stored locally in the app using localStorage. Do not publish any personal data in the repository itself.
