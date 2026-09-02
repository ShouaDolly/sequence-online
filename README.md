# Hush Five

**Keep quiet. Make five.** Hush Five is a real-time, mobile-first card-and-token line game built for private browser rooms with Cloudflare Workers, Durable Objects, and WebSockets.

The name comes from the table rule: teammates must read the board without signaling, whispering, or giving away a move.

## Current game design
- 2–12 players can enter a private room by link.
- Players choose a name and custom fantasy avatar.
- Spectators can watch an active room without receiving a private hand or making moves.
- The host chooses a shared turn timer: 10, 20, 30, 45, 60, 90, or 120 seconds.
- Teams and team colors are randomized when the host starts the match.
- Team token colors are blue, green, and red as applicable to player count.
- A team claims two protected five-token lines to win.
- Players select a card from their private hand, then choose a legal matching board space.
- A played card is discarded and a replacement is drawn automatically.
- Two-eyed Jacks make wild token placements.
- One-eyed Jacks remove an opponent token unless that token belongs to a protected completed line.
- The four corners are automatic wild spaces.

## Timer and auto-finish
The timer does not simply skip a turn. When time expires, the server uses the current player's actual hand and completes a legal move automatically.

The host also has **Auto-Finish Turn**, which invokes the same server-side logic immediately when a player walks away or loses connection.

## Host controls
- Start game
- Pause or resume
- Set the shared timer
- Auto-finish the current turn
- Reset the room for a rematch

## Room links
The share control copies the full room URL so friends can tap the link and join directly.

## Deploy
1. Create a Cloudflare account.
2. Install Node.js.
3. Run `npm install`.
4. Run `npm run dev` locally.
5. Run `npm run deploy` to deploy the Worker and public assets.

The Worker uses a SQLite-backed Durable Object called `GameRoom` and WebSocket connections for live state synchronization.
