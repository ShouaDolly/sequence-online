# Sequence Online

A real-time, mobile-first, portrait multiplayer Sequence-style card/board game using Cloudflare Workers, Durable Objects, and WebSockets.

## Current game design
- 2–12 players.
- Players enter a name and join a room by link.
- Spectator mode: people can join an active room without receiving a private hand or being able to play.
- Host chooses one turn timer for everyone before the game starts: 10, 20, 30, 45, 60, 90, or 120 seconds.
- Teams are randomized when the host starts the game.
- Team token colors are blue, green, and red as applicable to player count.
- Every team needs 2 sequences to win.
- The board is portrait-oriented and uses a pale/white tabletop appearance.
- Players select a card from their private hand, then select a legal matching board space.
- A played card is discarded and a replacement is drawn automatically.
- Two-eyed Jacks make wild token placements.
- One-eyed Jacks remove an opponent token when that token is not protected by a completed sequence.
- Corners are automatically wild.

## Timer / auto-finish
The timer is **not** a punishment that simply skips a turn.

When a player's timer expires, the server takes over that player's actual hand and automatically finishes the turn strategically:
1. Prefer an immediate winning sequence.
2. Look for a strong defensive/blocking removal with a one-eyed Jack.
3. Use a two-eyed Jack offensively when useful.
4. Choose a strong legal normal-card placement.
5. Replace the played card from the draw pile and finish the turn.

The host also has **Auto-Finish Turn**, which invokes the same server-side strategic logic immediately. This is useful when a player walks away or loses connection.

## Host controls
- Start game
- Pause / resume game
- Set the shared timer before starting
- Auto-finish the current player's turn
- Reset for a rematch

## Room links
The room share control copies the **entire URL**, not just the room code, so friends can tap the link and join directly.

## Deploy
1. Create a free Cloudflare account.
2. Install Node.js.
3. Run `npm install`.
4. Run `npm run dev` locally.
5. Run `npm run deploy` to deploy the Worker and its public assets.

The Worker uses a SQLite-backed Durable Object called `GameRoom` and WebSocket connections for live state synchronization.
