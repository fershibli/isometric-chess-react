# Isometric Chess

Chess on a wooden board seen from the corner. The pieces are chess characters —
`♜ ♞ ♝ ♛ ♚` — with a gradient painted through the glyph, and the board is
treated as a shallow pool: it never stops moving, and every piece that lands
throws a ring of ripples across it.

**Play it:** <https://fershibli.github.io/isometric-chess-react/>

```
Menu ─┬─ Local match ───────────────────► Board ──[Esc]──► Pause
      ├─ Play the machine ─► Difficulty ─►
      ├─ Online match ────► Invite code ─►
      └─ Settings
```

## What is in it

- **Full rules** from [chess.js](https://github.com/jhlywa/chess.js) — checks,
  mate, stalemate, draws, castling, en passant, promotion
- **Local play**, a **built-in opponent** at three strengths, and **online play
  between two browsers with no server in between**
- **Move trails**: the piece in your hand draws an arc to every square it can
  reach, captures in a different colour
- **Water**: a permanent swell plus a ripple that spreads from wherever a piece
  lands, with the strength adjustable or off
- Undo, redo, and a share link that reopens the exact position
- Four exports: PGN, the game score as a book prints it, CSV, and the raw FEN
- Mouse, touch and keyboard; laid out for phones as well as desktops

## Screens, not toolbars

Everything that decides *what kind of game this is* happens before the board
appears: local, machine (then a strength and a colour), online, or settings.
Everything that acts on a game *in progress* lives behind **Esc**: restart,
undo, redo, camera, water, trails, copy, and the way back to the menu.

The board itself carries no controls at all.

## Online play, without a server

Two browsers talk to each other over a WebRTC data channel. Nothing of ours sits
in the middle — there is no backend to run, no account, and no room registry.

What normally needs a server is *signalling*: the step where each side learns how
to reach the other. Here the players do it themselves.

1. One player picks a colour and taps **Send an invite**. The browser gathers its
   network candidates and packs them into a code — the SDP offer, deflated and
   base64url-encoded, around 700 characters.
2. They send that code to their opponent however they like.
3. The opponent pastes it and gets a reply code back.
4. The first player pastes the reply. The channel opens and the game starts.

From then on each move is one small JSON message, straight between the two
browsers. Everything arriving on the channel is parsed by
[`src/net/protocol.js`](src/net/protocol.js), which returns a known-shaped
message or `null` — a peer cannot make the board do anything a legal move
could not.

**Reach** picks how far the invite works:

| Setting | What goes in the code | Needs |
| --- | --- | --- |
| Same network | Local addresses only | Both players on one LAN or Wi-Fi |
| Anywhere | Local plus the public address a STUN server reports | A STUN lookup at invite time |

`Anywhere` asks Google's public STUN server what your address looks like from
outside. It is a lookup, not a relay: no game data passes through it. There is
no TURN fallback, so two players who are both behind symmetric NAT will not
connect — that case genuinely needs a relay server, which is the one thing this
mode refuses to have.

> The invite code lists the addresses your browser can be reached on. Send it to
> the person you are playing, not to a public channel.

**Same device, two tabs** is a third option using `BroadcastChannel`. It touches
no network at all, and it is the quickest way to see the online board work.

### Other ways this could have been built

| Approach | Serverless | Cost |
| --- | --- | --- |
| **WebRTC, players exchange codes** *(built)* | Yes | Two copy-pastes before the first move |
| WebRTC via a public broker (PeerJS cloud, a free signalling relay) | No — a third party holds the room list | Join by short room code, but a dependency that can disappear |
| Host runs a small WebSocket server, guest connects by IP | No | Someone has to run and expose a process; a browser cannot listen |
| Correspondence: each move produces a short FEN code sent by chat | Yes | No connection at all, but a code per move |
| `BroadcastChannel` *(built, as the two-tab mode)* | Yes | Same browser only |

The transports sit behind one interface in
[`src/net/transport.js`](src/net/transport.js) — `on`, `send`, `close` — so
adding another means writing that adapter and nothing else.

## How the board is drawn

Each square is projected into the diamond by
[`src/chess/geometry.js`](src/chess/geometry.js): board coordinates become
`bx` / `by` offsets plus a `depth` that decides paint order, so pieces nearer
the viewer are drawn over the ones behind them.

Two details keep clicks honest:

- Each square is clipped to its diamond with `clip-path`, and only that clipped
  face takes pointer input — never the square's full bounding box.
- A piece takes clicks on its lower body only. A king's crown hangs over the
  square behind it, and that square stays reachable.

Move trails are one SVG laid over the board with `viewBox="0 0 8 8"` and
`preserveAspectRatio="none"`, so it shares the tile grid exactly and needs no
measuring.

### The water

[`src/board/water.js`](src/board/water.js) holds the whole trick, and it is two
functions.

The idle swell gives every square a phase by feeding its coordinates into sine
and cosine at different rates:

```js
Math.sin(col * 0.9 + row * 0.45) + Math.cos(row * 0.85 - col * 0.35)
```

That number, in the range -2..2, becomes a **negative CSS animation delay**. All
64 squares run the same 7.5s loop, each one starting at a different point in it,
which is why eight ranks of wood do not move like a single plank.

The ripple is a wave front leaving the square a piece landed on. Distance sets
the delay, so the ring travels outward; height decays exponentially, so the far
corners barely stir; and the struck square is pushed *down* while the ring
around it rises. It is applied with the Web Animations API rather than a CSS
class, because a ripple has to restart the instant the next piece lands, and
`composite: 'add'` lets it ride on top of the swell instead of replacing it.

The swell and the ripple both scale with the water setting, so **Subtle** — the
default — is quieter everywhere and not just in the splash. **Still** stops it
for good, and everything answers `prefers-reduced-motion`.

## Exporting a game

The standard for a chess game score is **algebraic notation**, which is what a
book prints, and the standard file format around it is **PGN** — the same
notation plus tags, read by every engine, database and site. That is the export
that matters, and it is the first button in the pause screen.

The other two are for cases PGN is bad at:

| Export | What it is | For |
| --- | --- | --- |
| PGN | The standard | Loading the game into any chess program |
| Move list | Numbered rows, White and Black aligned in columns | Reading it, pasting it into a message or a document |
| CSV | One row per ply: side, piece, from, to, captured, promotion, check, position after | A spreadsheet |

CSV is not a chess format and no chess program reads it. It is there because a
spreadsheet is a reasonable thing to want.

## Playing the machine

The opponent runs in the tab — no accounts, no network. It answers in two beats:
a pause while it decides, drawn fresh each move from a range that widens with the
level, then the piece lifts, hangs for a moment, and lands. A reply that appeared
on its destination read as the board glitching rather than as someone moving a
piece.

The held piece never shows its move targets. A machine that shows you its options
is showing you its hand.

## Controls

| Input | Action |
| --- | --- |
| Click / tap a piece | Pick it up; reachable squares get a dot and a trail, captures get a ring |
| Click / tap a target | Play the move |
| Arrow keys | Move between squares along files and ranks |
| Enter or Space | Select a piece, then its destination |
| Escape | Put the piece back down — or, with nothing in hand, pause |

## Versioning and releases

The version is never edited by hand. On every push to `main`,
[`scripts/semver.mjs`](scripts/semver.mjs) reads the commit subjects since the
last `v*` tag and works out the bump:

| Commit | Bump |
| --- | --- |
| `feat!: …`, or `BREAKING CHANGE:` in the body | major |
| `feat: …` | minor |
| `fix: …`, `perf: …` | patch |
| anything else | patch |

That last row is the house rule. Upstream semantic-release would publish nothing
for a branch of chores, but this repository ships a website on every push, and a
deployed site with no version is worse than a version that moved for a docs
change.

The `Release` workflow then bumps `package.json`, tags, writes grouped release
notes, publishes a GitHub release, and deploys the tag to Pages. The version it
built is printed under the main menu.

```bash
node scripts/semver.mjs level   # major | minor | patch | none
node scripts/semver.mjs next    # the version this range earns
node scripts/semver.mjs notes   # markdown release notes
```

## Stack

React 19 · Vite 8 · chess.js · Vitest + Testing Library · Oxlint · GitHub
Actions → GitHub Pages

## Develop

Node 22+.

```bash
npm install
npm run dev
```

App: <http://127.0.0.1:43125>

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit and UI tests |
| `npm run lint` | Oxlint |

### Layout

The board sizes itself from its own column with container queries, so it grows
on wide screens without ever running into the side panel, and drops to a single
column with the panel underneath on narrow ones.

## Where this came from

The 2023 prototype ([`screenshots/screenshot01.png`](screenshots/screenshot01.png))
drew a static board of stylised chess characters in saddle brown and burlywood,
with debug coordinates and no game state. The rules, the isometric geometry and
the CI came later; the characters and the wood are from that first version, and
they are the point.
