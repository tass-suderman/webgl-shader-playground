# shades-and-waves

A browser-based creative coding playground that combines real-time GLSL fragment shader editing with live music coding via [Strudel](https://strudel.cc). Write shaders that react to audio, or compose music that drives visuals — all in one tab.

🌐 **Live site:** [shades-n-waves.tass.suderman.pro](https://shades-n-waves.tass.suderman.pro)

---

## Features

- **GLSL editor** — write fragment shaders powered by WebGL. Hot-reloads on `Ctrl+Enter`.
- **Strudel editor** — live-code music patterns using the Strudel mini-notation. Play with `Alt+Enter`, stop with `Alt+.`.
- **Split view** — run both editors side-by-side with a draggable divider.
- **Audio-reactive shaders** — shader uniforms (`u_fft`, `u_volume`, etc.) are fed from the Strudel audio output so visuals pulse with the music.
- **Classic drum machines** — TR-808, TR-909, TR-606, TR-707, LM-1, DMX, and many more are available as sample banks (loaded automatically on first play).
- **Webcam & mic input** — optionally pipe camera or microphone data into your shader.
- **Import / export** — save and load shaders (`.glsl`) or Strudel patterns (`.strudel`).
- **Multiple themes** — Kanagawa (default) and Dark.
- **Vim keybindings** — toggle in Settings.
- **Examples** — curated starting points for both GLSL and Strudel.

---

## How to use

1. Open the site at [shades-n-waves.tass.suderman.pro](https://shades-n-waves.tass.suderman.pro).
2. Use the tab bar at the top-right to switch between **GLSL**, **Strudel**, **Split**, **Examples**, and **Settings**.
3. **GLSL tab** — edit the fragment shader in the left pane; press `Ctrl+Enter` (or the *Run* button) to compile and run it.
4. **Strudel tab** — write a music pattern; press `Alt+Enter` (or *Play Strudel*) to start. The shader receives audio data in real time.
5. **Split tab** — both editors are visible at once; drag the horizontal divider to resize.
6. **Examples** — browse and load example shaders and patterns with a single click.
7. **Settings** — switch themes and toggle Vim keybindings.
8. The 🎵 icon in the Strudel header opens the *Available Sounds* panel, which lists all built-in oscillators, synths, noise types, and drum machine samples.

### Drum machine samples

Drum samples are fetched automatically from open-source sample libraries the first time you play a pattern that uses them. Use them like this:

```js
// TR-808 groove
stack(
  s("RolandTR808_bd ~ RolandTR808_bd ~"),
  s("~ RolandTR808_sd ~ RolandTR808_sd"),
  s("RolandTR808_hh*8")
).cpm(120)
```

Other machines: `RolandTR909_*`, `RolandTR606_*`, `RolandTR707_*`, `LinnLM1_*`, `OberheimDMX_*`, `RolandR8_*`, `BossDR110_*`, and more. See the *Available Sounds* panel for the full list.

---

## Local setup

**Prerequisites:** [Node.js](https://nodejs.org) ≥ 18 and [pnpm](https://pnpm.io) (or npm).

```bash
# 1. Clone the repository
git clone https://github.com/tass-suderman/shades-and-waves.git
cd shades-and-waves

# 2. Install dependencies
pnpm install        # or: npm install

# 3. Start the dev server
pnpm dev            # or: npm run dev
# → open http://localhost:5173

# 4. Build for production
pnpm build          # or: npm run build

# 5. Run tests
pnpm test           # or: npm test
```

---

## Technologies

| Layer | Technology |
|---|---|
| UI framework | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Component library | [MUI (Material UI) v6](https://mui.com) |
| GLSL editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react` |
| Strudel editor & runtime | [@strudel/codemirror](https://www.npmjs.com/package/@strudel/codemirror), [@strudel/repl](https://www.npmjs.com/package/@strudel/repl), [@strudel/webaudio](https://www.npmjs.com/package/@strudel/webaudio) |
| Graphics | WebGL (via a `<canvas>` managed directly) |
| Build tool | [Vite](https://vitejs.dev) |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| Drum samples | [tidal-drum-machines](https://github.com/ritchse/tidal-drum-machines) · [uzu-drumkit](https://github.com/tidalcycles/uzu-drumkit) |

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` / `Cmd+Enter` | Compile & run shader |
| `Ctrl+.` / `Cmd+.` | Pause shader |
| `Alt+Enter` | Play Strudel pattern |
| `Alt+.` | Stop Strudel pattern |

---

## License

[MIT](LICENSE.md)
