# CodeHarmony — Code, composed.

**An English-only, free, entirely client-side code-to-music website.** Paste Python, JavaScript, TypeScript, C, C++, or Java source code; CodeHarmony analyzes its structure and composes original instrumental music in your browser. No server, AI API, account, or music subscription is needed.

## Design

- Black-and-white dirty-gradient styling, subtle grain, glossy monochrome controls, and original built-in pixel lettering.
- Only source-code syntax highlighting uses color. The music visualizer, track mixer, and piano roll are monochrome.
- The top navigation has **Examples** and **About**; there is no website name in the header.
- Responsive desktop and mobile interface, with analysis/mixer panels revealed after composing.
- All interface text, status/error messages, and accessibility labels are in English.

## Start locally

Requirements: **Node.js 20.19 or newer** and npm.

```bash
npm install
npm run dev
```

Open **http://localhost:4173/**. On Windows, you may also run `start-windows.bat`.

Other commands:

```bash
npm run typecheck   # TypeScript type checking
npm test            # Build and run automated tests
npm run build       # Generate production-ready assets in dist/
npm run preview     # Serve the existing dist/ directory
npm run dev:vite    # Optional Vite development server
npm run build:vite  # Optional Vite bundle in dist-vite/
```

The project uses a small, dependency-free music/audio runtime built with TypeScript and the Web Audio API. The code editor is lightweight and custom-built, and tests use the Node.js built-in test runner. Vite can be used for development but **the GitHub Pages workflow publishes `dist/` from `npm run build`**. This is not a full CodeMirror/Tone.js/Vitest implementation.

## Deploy on GitHub Pages (recommended)

1. Create a GitHub repository, for example `codeharmony`.
2. Upload **the contents of the source project** into the root of that repository, including `.github/workflows/deploy.yml`. If you downloaded the source ZIP, extract it first; don't upload the ZIP file itself as a repository file.
3. Make sure your default branch is called `main`, or update the branch in the workflow.
4. Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Push to `main`. The workflow installs dependencies, runs the test/build command, and deploys `dist/` through GitHub Pages.
6. When the workflow succeeds, your website will generally be at `https://USERNAME.github.io/codeharmony/` (replace `USERNAME` and the repository name).

The built HTML links to JavaScript, CSS, and images with **relative paths**, so GitHub Pages repository subpaths work without special configuration. No secrets, API keys, or backend are required. A ready-to-publish **static ZIP** is also provided; its contents can be served by any static web host.

For a manual static preview:

```bash
python -m http.server 8080 --directory dist
```

Visit `http://localhost:8080`. Do not open `dist/index.html` as a `file://` URL; browser ES module security restrictions may block local scripts.

## How it works

1. **Analyze code.** A lexical scanner attempts to separate comments and strings from code, and measures functions, loops, branches, nesting, and recursion without running user code.
2. **Derive a fingerprint.** A stable hash and seeded PRNG create reproducible arrangements from the code and options.
3. **Compose.** Loops influence rhythms, branches influence variations, functions influence phrasing, nesting adds harmonic complexity, and recursion adds motif transformations.
4. **Play.** Web Audio synthesizes up to six instrumental tracks: drums, bass, chords, melody, arpeggio, and pad.
5. **Export.** An OfflineAudioContext renders the **same composition data** to a real 16-bit stereo WAV file at 44.1 kHz.

Supported genres: **Lo-fi, EDM, Ambient, Synthwave, and Chiptune**. Controls include Compose, New variation, Play, Pause, Stop, Restart, Seek, Volume, per-track mute/mix, BPM, Mood, Length, and WAV export.

## Project layout

```text
index.html                       Browser UI
src/main.ts                     UI events, status, and playback integration
src/analysis/analyzer.ts        Language-aware lexical analysis
src/music/composer.ts          Composition rules and genre arrangements
src/music/random.ts            Stable hash and seeded random generator
src/audio/engine.ts            Web Audio playback and WAV renderer
src/ui/pixel.ts                Built-in pixel lettering (no font downloads)
src/ui/visuals.ts              Canvas visualizer and piano roll
src/styles/app.css             Monochrome and dirty-gradient design
src/styles/assets/            Local dirty-gradient/grain images
src/data/examples.ts           Example code in six languages
scripts/build.mjs              Relative-path production static build
scripts/serve.mjs              Minimal local development server
tests/                         Automated tests
.github/workflows/deploy.yml   GitHub Pages deployment action
```

## Privacy and limitations

- All music generation and source-code analysis run locally in the browser. The app does not intentionally upload or execute source code, use analytics, or call external APIs.
- The lexical scanner is a **heuristic analyzer**, not a compiler/complete AST parser for all six languages. Some advanced syntaxes may be analyzed imprecisely.
- The composer is deterministic and rule-based, **not a generative AI music model**. Generated MIDI-like event data is repeatable for a given code/options/variation, though audio rendering can sound slightly different between browsers.
- Playback requires a user gesture due to browser autoplay rules. Seeking may skip a sustained note if its start falls before the seek position.
- Long WAV exports use browser RAM; choose shorter songs on memory-constrained devices.
- Automated test success does **not** prove the absence of memory leaks across all browsers/devices. See the testing notes below.

## Validation

Run `npm run typecheck`, `npm test`, and `npm run build`. The automated tests cover lexical analysis, recursion, deterministic composition, genre differences, finite note events, and PCM WAV structure. For a thorough release check, also use real browser testing: select examples in all six languages, compose all five genres, regenerate, play/pause/stop, seek, mute/mix, download a WAV, check the console for errors, and verify at desktop/mobile widths. Record which of these checks actually passed rather than claiming unperformed tests.

## License

MIT. The included gradient assets and 5×7 pixel glyph shapes were developed for this project. No third-party audio tracks or paid audio samples are embedded.
