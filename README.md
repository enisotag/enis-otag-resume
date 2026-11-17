# Süleyman Enis Otağ — Portfolio & Career Journey

Editorial & Swiss Minimalist multi-page portfolio website for **Süleyman Enis Otağ** (Computer Engineering @ Istanbul Technical University), combining an architectural CV, technical project case studies, downloadable Harvard-style PDF resumes, and an embedded HTML5 Canvas career game.

- **Live Portfolio:** [https://web.itu.edu.tr/otag23/](https://web.itu.edu.tr/otag23/)
- **Source Repository:** [https://github.com/enisotag/enis-otag-resume](https://github.com/enisotag/enis-otag-resume)

---

## Architecture & File Structure

Built with zero build tools and zero runtime frontend frameworks so every page deploys directly as static files under subdirectory hosting (`/otag23/`) using strictly relative paths:

```text
portfolio/
├── index.html                  # Editorial Home page, selected works, snapshot & contact
├── about.html                  # Full biography, Harvard CV hub, experience, education, credentials & skills
├── projects.html               # Filterable architectural case studies (AI & Agents, Systems, Web)
├── journey.html                # Embedded 16:9 stage for "Enis's Career Journey"
├── enis_journey.html           # Original standalone single-file game edition
├── deploy-itu.ps1              # Staging & SCP deployment script for web.itu.edu.tr/otag23/
├── README.md                   # Repository documentation (excluded from web upload)
└── assets/
    ├── css/
    │   └── style.css           # Design tokens (light archival paper / dark matte anthracite) & print rules
    ├── js/
    │   ├── main.js             # Bilingual TR/EN switcher, theme toggle, mobile nav, CV links & project filters
    │   └── game-engine.js      # HTML5 Canvas game engine with inline pixel-art assets & 5-language I18N
    ├── img/
    │   ├── favicon.svg         # Editorial & Swiss Minimalist EO monogram favicon
    │   ├── og-preview.png      # 1200x630 Open Graph / Twitter social preview card
    │   └── profile.jpg         # Editorial portrait photo displayed on Home (index.html)
    └── cv/
        ├── enis_cv_tr.pdf      # Harvard-style Curriculum Vitae (Türkçe)
        └── enis_cv_en.pdf      # Harvard-style Curriculum Vitae (English)
```

### Key Architectural Decisions

- **Subdirectory-Safe Relative Paths:** All links, stylesheets, scripts, and PDF references (`assets/css/style.css`, `assets/js/main.js`, `assets/cv/...`, `index.html`, etc.) are strictly relative with no leading `/` so the site runs identically at `http://localhost:8000/` and `https://web.itu.edu.tr/otag23/`.
- **Bilingual State (`TR` Default / `EN`):** Powered by `assets/js/main.js` (`localStorage` key `enis_lang`), synchronizing `data-tr` / `data-en` attributes, `data-lang-block` prose sections, dynamic CV download links, and the `portfolio:langchange` custom event.
- **Dual-Surface Theme (`Light` Default / `Dark`):** Archival paper (`#FAF8F5`) and matte anthracite (`#0E0E0E`) palettes persisted via `localStorage` (`enis_theme`).
- **Print-Ready Resume:** `about.html` includes `@media print` rules in `assets/css/style.css` that suppress navigation chrome and interactive controls for clean PDF/paper output.

---

## Harvard CV Documents

Both official Harvard-formatted PDF resumes are bundled directly in the repository:

| Language | File Path | Behavior |
| :--- | :--- | :--- |
| **Türkçe (TR)** | `assets/cv/enis_cv_tr.pdf` | Default target for `.cv-dynamic-link` on `index.html` when TR is active; explicit download button on `about.html`. |
| **English (EN)** | `assets/cv/enis_cv_en.pdf` | Automatic target for `.cv-dynamic-link` on `index.html` when EN is active; explicit download button on `about.html`. |

---

## Game Integration Credit

**Enis's Career Journey** (`journey.html` + `assets/js/game-engine.js`) is an interactive 2D pixel-art side-scroller built in HTML5 Canvas and vanilla JavaScript with custom pixel-art sprites.

It traces three playable chapters of Enis's academic and engineering journey—from **Eskişehir Fatih Fen Lisesi & the YKS 457th Rank Boss** to **Istanbul Technical University (İTÜ) & BİDB**, and onward to **Intertech Internship**—followed by an **Endless Mode** and 5-language UI support (`TR`, `EN`, `AR`, `ES`, `JA`). The engine features delta-time paced movement, variable double-jump physics with coyote time and jump buffering, an anti-AFK YKS Boss encounter, and cached HUD rendering. The standalone single-file edition remains available in `enis_journey.html`, while `journey.html` embeds the engine inside a responsive 16:9 stage with pause/resume (`[P]`), fullscreen toggle, and progress tracking.

---

## Local Preview Instructions

Serve the repository over a local HTTP server rather than opening HTML files with `file://` so relative paths, `localStorage` state across pages, and PDF viewing behave identically to production:

### Option 1: Python (Recommended)

```bash
python -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/) in your browser.

### Option 2: Node.js

```bash
npx serve . -l 8000
```

or:

```bash
npx http-server -p 8000
```

### Option 3: VS Code Live Server

Right-click `index.html` in VS Code and choose **Open with Live Server**.

---

## Publishing Guide — `https://web.itu.edu.tr/otag23/`

ITU personal web pages are served under `https://web.itu.edu.tr/<username>/` from `~/public_html/` (or `~/web.itu.edu.tr/` depending on your ITU BİDB account setup).

### Prerequisites

1. **Network / ITU VPN:** İTÜ BİDB blocks SSH/SFTP port `22` from external networks. If deploying from outside the ITU campus network (`eduroam` / campus LAN), connect to the **ITU VPN (FortiClient)** first.
2. **OpenSSH Client (Windows):** Built into modern Windows 10/11 (`scp`). If missing, install via Administrator PowerShell:
   ```powershell
   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
   ```

### Method A: Automated Deployment via `deploy-itu.ps1` (Recommended)

`deploy-itu.ps1` copies **only** the static deployable files (`index.html`, `about.html`, `projects.html`, `journey.html`, `enis_journey.html`, and `assets/`) into a clean temporary staging folder—automatically excluding `.git`, `README.md`, and `deploy-itu.ps1`—runs a 3-second TCP reachability check on port `22` (with automatic fallback from `ssh.itu.edu.tr` to `web.itu.edu.tr`), and uploads them via `scp`.

1. **Preview what will be uploaded (Dry Run):**
   ```powershell
   .\deploy-itu.ps1 -DryRun
   ```
2. **Deploy using default settings (`otag23@ssh.itu.edu.tr:public_html/`):**
   ```powershell
   .\deploy-itu.ps1
   ```
3. **If ITU hosts your personal site under `~/web.itu.edu.tr/` instead of `~/public_html/`:**
   ```powershell
   .\deploy-itu.ps1 -RemotePath web.itu.edu.tr
   ```
4. **Override host or username explicitly (e.g., direct `web.itu.edu.tr`):**
   ```powershell
   .\deploy-itu.ps1 -Username "otag23" -RemoteHost "web.itu.edu.tr" -RemotePath "public_html"
   ```

### Method B: Manual SFTP / WinSCP Fallback

If you prefer a GUI client (such as WinSCP or FileZilla):

1. Connect to **Host:** `ssh.itu.edu.tr` (default ITU SSH/SFTP gateway; or `web.itu.edu.tr` if configured by ITU BİDB), **Protocol:** `SFTP` (or `SCP`), **Port:** `22`, **Username:** `otag23`.
2. Navigate to `~/public_html` (or `~/web.itu.edu.tr` if your account uses that directory) on the remote server.
3. Upload **only** these items:
   - `index.html`
   - `about.html`
   - `projects.html`
   - `journey.html`
   - `enis_journey.html`
   - `assets/` (including `css/`, `js/`, `img/`, `cv/`)
4. Do **not** upload `.git/`, `.gitignore`, `README.md`, or `deploy-itu.ps1`.

### Post-Deployment Verification

1. Open [https://web.itu.edu.tr/otag23/](https://web.itu.edu.tr/otag23/) and verify all navigation tabs (`index.html` Home, `about.html`, `projects.html`, `journey.html`).
2. Toggle `TR / EN` and `Light / Dark` modes to confirm styles and `localStorage` persistence.
3. Verify the portrait image (`assets/img/profile.jpg`), favicon (`assets/img/favicon.svg`), Open Graph social preview (`assets/img/og-preview.png`), and both CV PDFs (`assets/cv/enis_cv_tr.pdf`, `assets/cv/enis_cv_en.pdf`) load cleanly.
4. Test project category filters on `projects.html` and launch Level 1 on `journey.html`.
5. If Apache returns `403 Forbidden`, verify home, directory, and file permissions on the ITU host (adjust `~/public_html` to `~/web.itu.edu.tr` if applicable):
   ```bash
   chmod 701 ~
   chmod 755 ~/public_html
   find ~/public_html -type d -exec chmod 755 {} +
   find ~/public_html -type f -exec chmod 644 {} +
   ```

---

## Contact

- **Email:** [enisotag56@gmail.com](mailto:enisotag56@gmail.com)
- **GitHub:** [github.com/enisotag](https://github.com/enisotag)
- **LinkedIn:** [linkedin.com/in/suleyman-enis-otag](https://www.linkedin.com/in/suleyman-enis-otag/)
- **Web:** [web.itu.edu.tr/otag23](https://web.itu.edu.tr/otag23/)
