Comprehensive Feature/Function/UI/UX Analysis: Wheel of Names vs. PickerWheelApp

PART 1 — WHEEL OF NAMES (wheelofnames.com) — Full Deep Dive
Toolbar / Top Navigation Bar
ButtonFunctionCustomizeOpens 3-tab modal: During Spin / After Spin / AppearanceNewCreates a blank wheelOpenOpens saved wheels (cloud or local file, searchable My Wheels dialog)SaveSaves wheel to cloud (requires login) or local .wheel fileShare4-step wizard: Share info → Theme → Visibility → LinkGalleryBrowse public wheels made by users, searchable by title/entriesFullscreenFull-screen mode (hides toolbar, ads, overlay text)More ▼Dropdown: Feedback, FAQ, Import Google Spreadsheet, My Account, PreferencesLanguageMulti-language selector (40+ languages, searchable by English name)

Entries Panel (Right Sidebar)
ElementFunctionEntries tab (count badge)Shows/edits the text list of wheel entries; plain textareaResults tab (count badge)Shows spin history (sortable); keeps running logShuffle buttonRandomizes entry order (Durstenfeld/Fisher-Yates algorithm)Sort buttonAlphabetical sortAdd Image ▼ dropdownUpload image, search Unsplash gallery, add image as entryAdvanced checkboxToggles Advanced Mode — enables per-entry: weight, color, image, hide, disable, duplicate, custom message, custom soundTextboxMulti-line text input — entries separated by newlineAdd wheel (Beta) +Adds a second wheel (multi-wheel mode); dropdown lets you open an existing wheel as additional wheelVersion / Changelog linkBottom of panel — shows version number and links to changelogHide editor buttonCollapses the entire right panel

Wheel Canvas
ElementBehaviorClick to spinClick center of wheel to spinCtrl+EnterKeyboard shortcut to spinPointer/FlapperArrow at right edge (3 o'clock) — changes color to match current segment (v368)Wheel shadowOptional depth shadow effectCenter imageOptional logo/image with XS/S/M/L/XL/XXL sizesBackground imageFull wheel background (custom upload or Unsplash)Color gradient on pagePage BG gradient derived from wheel colors (optional)ContoursOptional visible borders between segments

Customize Modal (3 tabs)
During Spin tab:

Sound selector (ticking sound, 150+ music tracks) + volume slider (0–100%)
Play/Stop preview buttons
☑ Display duplicates
☑ Spin slowly
☑ Show title
Spin time (seconds): 1–60 slider
Max names visible on wheel: 4–1000 slider
After Spin tab:
Sound selector (subdued applause, etc.) + volume slider
☑ Animate winning entry
☑ Launch confetti
☑ Auto-remove winner after 5 seconds
☑ Display popup with message (editable text: "We have a winner!")
☑ Display the "Remove" button
☑ Play a click sound when the winner is removed
Appearance tab:
Toggle: One color per section / Wheel background image (with image upload/Unsplash)
Apply a theme ▼ (dropdown with color themes, including flag themes for 70+ countries)
Customize colors: up to 8 color swatches with checkboxes (enable/disable)
Image at the center of the wheel (upload / Unsplash / URL)
Image size dropdown (XS → XXL)
Page background color picker
☑ Display a color gradient on the page
☑ Contours
☑ Wheel shadow
☑ Pointer changes color


Winner Dialog

Title bar: "We have a winner!" (customizable)
Winner name displayed large (color matches winning segment)
Close button — close dialog, keep entry
Remove button — remove entry from wheel permanently


Share Wizard (4 steps)

Share — Confirms creating public link (snapshot of current state)
Theme — Select visibility-facing theme/colors
Visibility — Private / Shared (view-only) / Public to gallery (with title, description, tags)
Link — Displays shareable URL; can update existing shared wheel link


More Menu Items

Feedback → Google Form
FAQ → /faq (with Table of Contents: Randomness, How-to, Customization, Saving, Sharing, Discord Bot, API, Embed, Ads, Business, Security/Privacy, T&C, Sustainability, Credits)
Import Google Spreadsheet → Authenticated Google Sheet picker (column/tab selector, live-link option)
My Account → Sign in/out, export data, delete account, migrate wheels to another account
Preferences → Option to hide "Click to spin" text


Advanced Mode (per-entry editor)

Weight (float) — makes slice larger/more likely
Custom color per entry
Image per entry (upload or Unsplash)
Hide/disable individual entries
Duplicate entries
Custom winner message per entry
Custom winner sound per entry
Move up/down buttons
Unhide all button (batch)


Multi-Wheel Mode (Beta, v389+)

Add wheel button (+ dropdown to open saved wheel as new wheel)
Tabs above textbox to switch which wheel is editing
Spin all wheels button
Per-wheel customization (colors, sounds — first wheel controls page BG and sounds)
Wheel titles in multi-wheel mode (v401)


Special Pages/URLs
PagePurpose/galleryBrowse public user wheels/faqFull FAQ/changelogVersion history (v109 → v401+)/streamingDedicated OBS/streaming page with optimal layout/view?entries=A,B,C&...URL-parameter wheel with 13+ params?entries=A,B,CPre-fill entries on homepage

Randomness & Backend

Uses crypto.getRandomValues() (not Math.random) — cryptographically secure
Physics simulation driven by secure RNG (not just outcome determination)
Fairness & Transparency Audit page (10,000 spin test tool)
Hosted on Firebase Hosting + Cloud Run (Google), Firestore DB
256-bit AES encryption at rest, nightly backups
API v2 (REST): CRUD saved/shared wheels, spin animation endpoint, animated GIF generation
Discord bot (200k+ servers, slash commands)
postMessage API for iframe embedding
window.addEventListener('message', ...) for spin result events from iframes


Beta Features (as of v403, Feb 2026)

Multi-wheel mode (Add wheel button — launched v389, Jan 2026)
Per-wheel titles in multi-wheel mode (v401)
Advanced wheels in multi-wheel mode (v394)


PART 2 — PickerWheelApp (Sco314/PickerWheelApp) — Full Deep Dive
Live App Layout (sco314.github.io/PickerWheelApp)
3-column layout:

Left panel — Eligible list (with count badge, Edit button)
Center — Wheel canvas + SPIN! button + Ctrl+Enter button
Right panel — Picked list (with count badge, Move-back buttons)
Bottom bar — Reset Round + Undo (Ctrl+Z) buttons


Header / Navigation
ElementFunctionPickerWheel logoApp titleProject selector dropdown"Quick Spin (no class)" + Classes (e.g. "1st Block") + "Manage Classes..."⚙ Gear iconOpens dropdown: Settings, Results, Share Wheel URL, Export Data, Import Data, Help

Gear Menu (⚙)
ItemFunctionSettingsOpens Settings modal (3 tabs: General, Sounds, Credits)ResultsOpens results/history viewShare Wheel URLGenerates shareable URL for current wheel stateExport DataExport project dataImport DataImport project dataHelpOpens HelpPage component

Settings Modal (3 tabs)
General tab:

☑ Auto-remove winners (skip dialog, useful for speed rounds)
Spin duration slider (1–10s, default 4s)
Easing style dropdown (Cubic smooth, Linear, etc.)
☑ Random start angle (randomize wheel position on load)
☑ Idle spin (gentle rotation when idle)
☑ Manual stop (shows STOP button during spin; winner = wherever wheel lands)
Sounds tab:
☑ Enable sounds
☑ Tick sounds during spin (short click per peg)
☑ Celebration sound on win (chime)
Volume slider (0–100%, default 50%)
Credits tab:
Tick/Flapper Sound: synthesized via Web Audio API
Celebration Chime: synthesized via Web Audio API
Wheel of Names (design inspiration, Apache-2.0)
Built with React, TypeScript, Vite, HTML5 Canvas


Edit Names Panel (slide-in from right)

Text tab — Multi-line textarea (all names, comma or newline separated)
Table tab — Structured row editing
Displays all names (both eligible + picked combined)
Close (×) button


Eligible Panel (Left)

Title "Eligible (N)" with count
✎ Edit button → opens Edit Names panel
Scrollable list of remaining eligible names
Individual Remove buttons per entry (×)


Picked Panel (Right)

Title "Picked (N)" with count
Numbered ordered list (chronological pick order)
Individual Move back to eligible buttons per entry


Winner Dialog

Overlay on wheel canvas
Shows "WE HAVE A WINNER!" banner + winner name
Close button — keep in Picked list
Remove button — remove from Picked, don't add back


Bottom Controls

Reset Round — Moves all Picked back to Eligible
Undo (Ctrl+Z) — Undoes last pick action


Class Manager (Manage Classes...)

Create/edit named "classes" (groups of names)
Each class persists its Eligible/Picked state separately
Selector dropdown shows Quick Spin + all saved classes


Advanced Editor (AdvancedEditor.tsx)

Per-entry editing (colors, weights, batch operations)
112 lines of code, Feb 26, 2026


PART 3 — Full Comparative Table
CategoryWheel of NamesPickerWheelAppCore spin mechanicClick wheel OR Ctrl+EnterClick SPIN! button OR Ctrl+Enter OR click wheel centerRNG methodcrypto.getRandomValues() in physics simulationcrypto.getRandomValues() (Phase 1+2)Winner dialog"We have a winner!" + Close/Remove"WE HAVE A WINNER!" + Close/RemoveAuto-removeConfigurable in Customize (after 5s or instant)Configurable in Settings (skip dialog)Entry inputTextarea (newline-separated); Advanced per-entry editorTextarea (comma or newline); Table view; per-entry Advanced editorEntry countUp to 1000 displayed; unlimited in textboxNot explicitly cappedShuffle✅ Yes (Durstenfeld)❌ Not implementedSort✅ Alphabetical❌ Not implementedWeights✅ Per-entry weights (Advanced mode)✅ Per-entry weights (Advanced editor)Hide/disable entries✅ Per entry in Advanced modePartially (entries move between Eligible/Picked)Multi-wheel✅ Beta (v389+)❌ Not implementedProject/class persistenceNamed saved wheels (cloud + local .wheel files)Named "classes" + "Quick Spin"; localStorage-based; SQLite via backendEligible/Picked splitNo — single list; Remove removes permanently✅ Core feature — two-list model per projectUndo❌ No native undo✅ Undo last pick (Ctrl+Z)Reset roundNo (manual re-add)✅ Reset Round button (moves all Picked → Eligible)Move-back individual❌ No✅ Per-entry "Move back to eligible"Results history✅ Results tab with sort✅ Results via gear menuSpin durationConfigurable slider (1–60s)Configurable slider (~1–10s)Spin slowly mode✅ Checkbox❌Manual stop❌✅ Checkbox in SettingsIdle spin❌✅ Checkbox in SettingsEasing styleNot user-configurable (physics-based)✅ Dropdown: Cubic, Linear, etc.Random start angle❌✅ CheckboxTick sound✅ Configurable (150+ sounds)✅ Web Audio API synthesizedCelebration sound✅ Configurable (150+ sounds)✅ Web Audio API synthesizedVolume control✅ Per-sound sliders✅ Global volume sliderConfetti✅ Configurable❌ Not implementedPointer changes color✅ (v368)❌ Static pointerWheel shadow✅ ConfigurableStatic dark borderColor themes✅ 70+ flag themes, custom colors, per-entry colors✅ Custom colors in Advanced editorCenter image✅ Upload/Unsplash, 6 size options❌Background image✅ Upload/Unsplash❌Page background color✅ Color picker❌ Light gray fixedColor gradient✅ Auto-derived from wheel colors❌Dark mode✅ (auto-detected + manual)❌Fullscreen mode✅ (hides all UI)❌Save to cloud✅ Firebase (login required)Backend SQLite (local FastAPI server)Save to local file✅ .wheel file❌ No local file exportOpen dialog✅ My Wheels (searchable, sortable, view counts)Project selector dropdownShare link✅ Wizard (4 steps, visibility controls)✅ Basic Share Wheel URL in gear menuURL params wheel✅ 13+ params (entries, colors, spinTime, etc.)❌Import Google Sheets✅ (authenticated, live-link)❌ (planned via .env.example)Export/Import dataCloud backup / .wheel file✅ Export Data / Import Data in gear menuPublic gallery✅ /gallery (searchable)❌Streaming page✅ /streaming (OBS-optimized)❌Embed (iframe)✅ + postMessage API + events✅ postMessage API (Phase 4)Discord bot✅ (200k+ servers)❌REST API✅ v2 (CRUD + spin + animated GIF)✅ FastAPI (routes_picker, routes_projects)Classroom focusGeneral-purpose (FAQ has classroom tips)✅ Core purpose (class/project model)Account/auth✅ Google, email/password❌ No auth (single-user local)PWA / App install✅ (Chrome/Safari install to homescreen)❌ Not documentedMulti-language✅ 40+ languages❌ English onlyWheel sizeResponsive, scales to pageResponsive (viewport-relative sizing)Pointer positionRight side (3 o'clock)Top (12 o'clock)Frontend techVue.js (fork of open-source)React + TypeScript + ViteBackend techFirebase/Firestore + Cloud Run (Google)FastAPI + SQLite + Alembic + DockerHostingFirebase Hosting + Cloud RunGitHub Pages (frontend) + local FastAPITest suiteNot visible✅ __tests__ dirs in components & servicesDocker❌ (Firebase)✅ docker-compose.yml + Dockerfile

PART 4 — File/Directory Structure
PickerWheelApp Repo Structure
PickerWheelApp/
├── .github/                    # CI/CD workflows
├── backend/
│   ├── alembic/                # DB migrations
│   │   └── versions/
│   │       └── 0001_initial.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_picker.py    # Spin/pick endpoints
│   │   │   └── routes_projects.py  # Project CRUD endpoints
│   │   ├── core/               # Config, settings
│   │   ├── db/                 # SQLAlchemy models, session
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app factory
│   ├── scripts/
│   │   └── seed.py             # Demo data seeder
│   ├── tests/
│   ├── Dockerfile
│   ├── alembic.ini
│   └── pyproject.toml
├── docs/
│   ├── api.md
│   ├── architecture.md
│   └── deployment.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── __tests__/
│   │   │   ├── AdvancedEditor.tsx   # Per-entry weight/color editor
│   │   │   ├── ClassManager.tsx     # Create/manage named classes
│   │   │   ├── ClassSelector.tsx    # Project dropdown selector
│   │   │   ├── ControlBar.tsx       # SPIN!/Stop/Ctrl+Enter buttons
│   │   │   ├── HelpPage.tsx         # Help documentation
│   │   │   ├── LastWinner.tsx       # Last winner display
│   │   │   ├── ListPanel.tsx        # Eligible/Picked lists
│   │   │   ├── Modal.tsx            # Generic modal wrapper
│   │   │   ├── ResultsPanel.tsx     # Pick history view
│   │   │   ├── SettingsPanel.tsx    # Settings 3-tab modal
│   │   │   ├── SpinnerWheel.tsx     # Canvas wheel rendering + physics
│   │   │   └── WinnerDialog.tsx     # Winner announcement overlay
│   │   ├── services/
│   │   │   ├── __tests__/
│   │   │   ├── export.ts            # Data export logic
│   │   │   ├── settings.ts          # Settings persistence
│   │   │   ├── sounds.ts            # Web Audio API sounds
│   │   │   └── storage.ts           # localStorage/API persistence
│   │   ├── styles/
│   │   └── main.tsx                 # React app entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env.example
├── docker-compose.yml
├── README.md
├── TERMS.md
├── NOTICE
└── LICENSE

PART 5 — Improvement Plan Highlights for Claude Code
🔴 HIGH PRIORITY (Core UX Parity)
1. Confetti on win — WoN has this; it adds major delight. Implement canvas-based confetti burst when winner is announced.
2. Pointer-changes-color — WoN v368. The pointer arrow at 12 o'clock should dynamically take the color of the segment it points to. Very impactful visual feedback.
3. Shuffle + Sort buttons — Add to the Edit Names panel or Eligible panel toolbar. WoN uses Durstenfeld shuffle.
4. Dark mode — Auto-detect prefers-color-scheme + manual toggle. Current app is light-gray only.
5. Winner dialog polish — Add entry color to winner dialog background/accent. Currently flat white dialog.
6. Customizable spin time range — Currently 1-10s. Extend to 1-60s to match WoN and allow dramatic long spins for raffles.
🟡 MEDIUM PRIORITY (Feature Gaps)
7. Color themes — Add a theme picker with preset palettes (currently only Advanced editor custom colors). Add a "Randomize colors" button.
8. Page/app background theming — Currently flat #f0f0f0. Support custom BG color or gradient derived from wheel colors.
9. Fullscreen mode — Hides sidebar panels, shows only wheel; important for classroom projector use.
10. URL parameter wheel sharing — Support ?entries=A,B,C&spinTime=5 URL params so teachers can pre-build wheel links for any lesson.
11. Auto-remove after N seconds — Currently auto-remove in Settings skips the dialog entirely. WoN has a 5-second countdown auto-remove as a separate option.
12. Animate winning entry — Flash/pulse the winning segment when wheel stops, before dialog appears.
13. Results panel improvements — Add sort options, export-as-CSV, clear history button, and timestamp per pick.
14. Wheel title display — Show class/project name on wheel center or above it (especially in fullscreen).
🟢 LOWER PRIORITY (Nice-to-Have / Phase 2+)
15. Sound library expansion — Currently 2 synthesized Web Audio API sounds. Add a small selection of pre-baked sounds: different tick styles (faster/slower), multiple celebration sounds, optional music during spin.
16. Per-entry colors in main view — Show entry colors in the Eligible list as colored dots/pills, matching their wheel segment color.
17. Import from CSV/clipboard — Extend the current "Edit Names" textarea to accept CSV pasted directly, with smart parsing of headers.
18. Session name/inline edit — Make the class name editable inline in the header, not just in Manage Classes.
19. Stats per project — Track how many times each entry has been picked; show in Results panel or a stats view (WoN has "views" per wheel; you could show "times picked" per name).
20. Keyboard shortcuts panel — Document Ctrl+Enter, Ctrl+Z visibly in the UI (tooltip or footer).
21. PWA support — Add a web manifest and service worker so the app can be installed on phones/tablets for classroom use without a browser bar.
22. Google Classroom integration — Already planned (env vars pre-declared); this is a major differentiator for the classroom use case.
23. Multi-class view / spin all — For teachers running several classes: a dashboard view showing all class states, ability to reset all rounds at once.
Key Architectural Notes for Claude Code

Frontend: React + TypeScript + Vite + HTML5 Canvas. Components are cleanly separated. SpinnerWheel.tsx handles all canvas rendering and physics. sounds.ts uses Web Audio API exclusively (no audio files needed).
Backend: FastAPI + SQLAlchemy + SQLite + Alembic. Two API route files: routes_picker.py (spin logic) and routes_projects.py (CRUD). Currently the GitHub Pages deployment is frontend-only (no live backend), so the app falls back to localStorage via storage.ts.
State: The Eligible/Picked model is the app's killer feature vs. WoN — preserve and enhance it. WoN just permanently removes; PickerWheelApp remembers and allows round resets.
Phases already done: Phase 1 (MVP), Phase 2 (crypto RNG, spin settings, results panel), Phase 3 (advanced editor, batch ops, manual stop), Phase 4 (help page, embed mode, postMessage API).
What WoN does that matters most educationally: Fullscreen, class-projector-friendly layout, color themes, confetti, pointer color, shuffle/sort, title display on wheel — these should all be Phase 5 targets.
