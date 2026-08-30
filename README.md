# Isometric Chess

Local two-player chess on an isometric board, with glass-style pieces and full
rules from [chess.js](https://github.com/jhlywa/chess.js).

**Live:** once GitHub Pages is enabled, `https://<user>.github.io/<repo>/`

![The board mid-game, with a selected bishop showing its legal moves and one capture](screenshots/board.webp)

## Features

- Complete legal move generation: checks, checkmate, stalemate, draws, castling,
  en passant and promotion
- Promotion picker — choose queen, rook, bishop or knight instead of an automatic queen
- Undo and redo, a PGN move list, and a material tracker showing captures and the score
- Copy the PGN, copy the FEN, or copy a share link that reopens the exact position
- Optional built-in opponent (Casual / Club / Sharp) — play White or Black
- Rotate the view a quarter turn at a time and switch between three camera angles
- Playable with mouse, touch or keyboard, and laid out for phones as well as desktops

## Controls

| Input | Action |
| --- | --- |
| Click / tap a piece | Select it; legal squares get a dot, captures get a ring |
| Click / tap a target | Play the move |
| Arrow keys | Move between squares along files and ranks |
| Enter or Space | Select a piece, then its destination |
| Escape | Clear the selection |

## How the isometric board works

Every square is projected into the diamond by `src/chess/geometry.js`: board
coordinates become `bx` / `by` offsets plus a `depth` value that decides paint
order, so pieces nearer the viewer are drawn over the ones behind them.

Two details keep clicks honest, which the earlier prototype got wrong:

- Each square is clipped to its diamond with `clip-path`, and only that clipped
  face takes pointer input — never the square's full bounding box.
- A piece's SVG box spans empty space around the silhouette, so the box itself is
  `pointer-events: none` and only the painted shapes are clickable. A tall piece
  therefore never swallows a click meant for the square drawn behind it.

The result is what-you-see-is-what-you-click at any rotation or camera angle.

## Stack

- React 19 + Vite 8
- chess.js for rules and PGN
- Vitest + Testing Library
- Oxlint
- GitHub Actions → GitHub Pages

## Develop

Node 22+.

```bash
npm install
npm run dev
```

App: http://127.0.0.1:43125

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit and UI tests |
| `npm run lint` | Oxlint |

<img src="screenshots/mobile.webp" alt="The same board on a phone, with the panel stacked below" width="235" align="right" />

### Layout

The board sizes itself from its own column with container queries, so it grows on
wide screens without ever running into the side panel, and drops to a single
column with the panel underneath on narrow ones.

## Deploy

1. Push to GitHub
2. Repo **Settings → Pages → Source: GitHub Actions**
3. The `Pages` workflow builds `dist` with `BASE_PATH=/<repo>/` on every push to `main`

## Fixes vs the old CRA prototype

The prototype ([`screenshots/screenshot01.png`](screenshots/screenshot01.png)) drew
a static board with debug coordinates, one colour of pieces and no game state.

- Pieces move, turns alternate, and the rules are enforced
- Correct king/queen placement and distinct light and dark sets
- SVG piece art instead of stretched unicode glyphs, readable on crowded squares
- Squares are clickable where they are drawn
- Vite plus CI/CD instead of Create React App
