# Sequence-Style Online — 6 Player

## What this is
A real-time six-player card/board game using Cloudflare Workers + a SQLite-backed Durable Object + WebSocket Hibernation.

Each player:
- opens the same public URL
- enters a name
- enters the room code
- gets a private hand
- sees board moves in real time

J♣/J♦ = wild placement.
J♠/J♥ = remove an opponent chip unless protected by a completed sequence.
Four corners = wild.
For 3–6 players, the first sequence of five wins.

Sounds are generated with the browser Web Audio API, so the project has no external audio files.

## Deploy
1. Create a free Cloudflare account.
2. Install Node.js.
3. In this folder run:
   `npm install`
4. Run locally:
   `npm run dev`
5. Deploy:
   `npm run deploy`

The Worker has a `public/` asset directory and one SQLite-backed Durable Object class called `GameRoom`.

## Notes
The free Workers plan currently includes Durable Objects. Current Cloudflare docs say the free plan provides 100,000 Durable Object requests/day and 13,000 GB-s/day of duration, while SQLite storage has a 5 GB account limit. WebSocket Hibernation is recommended for this multiplayer use case.


## UX updates in this build
- Six-player hands are 5 cards each.
- Board uses a verified 10×10 Sequence-style mapping with no Jack spaces.
- Selecting a card highlights every legal matching board square.
- A Hint button can suggest a winning move, a block, or a strong central move.
- Mobile hand cards scroll horizontally like a tabletop hand.
- The board and hand remain visually connected so a player can select a card and immediately see where it can be played.


Hints are calculated entirely in the individual player's browser. They are never sent through the WebSocket and are not visible to other players. The UI is mobile-first with a full-width board and swipeable hand.

### 2–6 player rules
- 2 players: 7 cards each, first to 2 sequences.
- 3 players: 6 cards each, first to 2 sequences.
- 4 players: 6 cards each, first to 1 sequence.
- 5–6 players: 5 cards each, first to 1 sequence.
- Turns advance clockwise around the room.
