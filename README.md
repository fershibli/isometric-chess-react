# Isometric Chess

Playable local two-player chess with an isometric glass-piece board.

**Live:** after GitHub Pages is enabled, open  
`https://<user>.github.io/<repo>/`

## Features

- Legal moves via [chess.js](https://github.com/jhlywa/chess.js) (checks, captures, castling, en passant, promotion to queen)
- Select a piece, highlighted targets, capture tint
- Turn status, check / checkmate / stalemate
- Undo and new game
- Entry animations (disabled when `prefers-reduced-motion`)

## Stack

- React 19 + Vite 8
- chess.js
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
| `npm test` | Unit / UI tests |
| `npm run lint` | Oxlint |

## Deploy

1. Push to `main`
2. Repo **Settings → Pages → Source: GitHub Actions**
3. The `Pages` workflow publishes `dist` with `BASE_PATH=/<repo>/`

## Fixes vs the old CRA prototype

- Board state persisted; pieces actually move
- Correct king/queen setup and light/dark glyphs
- Path blocking, pawn direction, turns, checks
- Debug coordinates removed
- Vite + CI/CD instead of Create React App
