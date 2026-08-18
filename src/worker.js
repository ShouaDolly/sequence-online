import { DurableObject } from "cloudflare:workers";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const BOARD = [["X", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "X"], ["6♣", "5♣", "4♣", "3♣", "2♣", "A♥", "K♥", "Q♥", "10♥", "10♠"], ["7♣", "A♠", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "9♥", "Q♠"], ["8♣", "K♠", "6♣", "5♣", "4♣", "3♣", "2♣", "8♦", "8♥", "K♠"], ["9♣", "Q♠", "7♣", "6♥", "5♥", "4♥", "A♥", "9♦", "7♥", "A♠"], ["10♣", "10♠", "8♣", "7♥", "2♥", "3♥", "K♥", "10♦", "6♥", "2♦"], ["Q♣", "9♠", "9♣", "8♥", "9♥", "10♥", "Q♥", "Q♦", "5♥", "3♦"], ["K♣", "8♠", "10♣", "Q♣", "K♣", "A♣", "A♦", "K♦", "4♥", "4♦"], ["A♣", "7♠", "6♠", "5♠", "4♠", "3♠", "2♠", "2♥", "3♥", "5♦"], ["X", "A♦", "K♦", "Q♦", "10♦", "9♦", "8♦", "7♦", "6♦", "X"]];

const COLORS = ["red","blue","purple","orange","teal","pink"];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function makeDeck() {
  const deck = [];
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit, key: rank + suit });
      }
    }
  }
  shuffle(deck);
  return deck;
}

function twoEyed(card) {
  return card?.rank === "J" && (card.suit === "♣" || card.suit === "♦");
}

function oneEyed(card) {
  return card?.rank === "J" && (card.suit === "♠" || card.suit === "♥");
}

function occupiedFor(grid, chip, r, c) {
  return grid[r]?.[c] === chip || grid[r]?.[c] === "corner";
}

function countSequences(grid, chip) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  const windows = new Set();

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      for (const [dr, dc] of dirs) {
        const cells = [];
        let ok = true;

        for (let k = 0; k < 5; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (
            rr < 0 || rr >= 10 || cc < 0 || cc >= 10 ||
            !(grid[rr]?.[cc] === chip || grid[rr]?.[cc] === "corner")
          ) {
            ok = false;
            break;
          }
          cells.push(`${rr},${cc}`);
        }

        if (ok) windows.add(cells.join("|"));
      }
    }
  }

  return windows.size;
}

function hasSequence(grid, chip) {
  return countSequences(grid, chip) > 0;
}

function cleanName(name) {
  return String(name || "")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .trim()
    .slice(0, 20);
}

function roomCodeValid(room) {
  return /^[A-Z0-9]{4,8}$/.test(room);
}

function handSizeForPlayerCount(count) {
  if (count === 2) return 7;
  if (count === 3 || count === 4) return 6;
  return 5; // 5-6 players
}

function sequencesToWinForPlayerCount(count) {
  return count <= 3 ? 2 : 1;
}

function freshGame(players) {
  const deck = makeDeck();
  const hands = players.map(() => []);
  const handSize = handSizeForPlayerCount(players.length);
  for (let i = 0; i < handSize; i++) {
    for (let p = 0; p < players.length; p++) hands[p].push(deck.pop());
  }
  return {
    status: "playing",
    board: BOARD.map(row => row.map(v => v === "X" ? "corner" : null)),
    deck,
    discard: players.map(() => []),
    hands,
    current: 0,
    winner: null,
    sequencesToWin: sequencesToWinForPlayerCount(players.length)
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    if (url.pathname === "/health") {
      return new Response("ok");
    }

    if (url.pathname.startsWith("/ws/")) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const room = url.pathname.slice(4).toUpperCase();
      if (!roomCodeValid(room)) {
        return new Response("Invalid room code", { status: 400 });
      }

      const id = env.GAME_ROOM.idFromName(room);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};

export class GameRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
  }

  async load() {
    const state = await this.ctx.storage.get("state");
    return state || {
      status: "lobby",
      board: null,
      deck: [],
      discard: [],
      hands: [],
      current: 0,
      winner: null,
      players: []
    };
  }

  async save(state) {
    await this.ctx.storage.put("state", state);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const name = cleanName(url.searchParams.get("name"));
    const pid = String(url.searchParams.get("pid") || "").slice(0, 80);

    if (!name || !pid) {
      return new Response("Name and player id are required", { status: 400 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ pid });

    const state = await this.load();
    let player = state.players.find(p => p.id === pid);

    if (!player) {
      if (state.status !== "lobby") {
        server.send(JSON.stringify({ type: "error", message: "This game has already started." }));
        server.close(1008, "Game already started");
        return new Response(null, { status: 101, webSocket: client });
      }
      if (state.players.length >= 6) {
        server.send(JSON.stringify({ type: "error", message: "This room is full." }));
        server.close(1008, "Room full");
        return new Response(null, { status: 101, webSocket: client });
      }

      player = {
        id: pid,
        name,
        chip: COLORS[state.players.length],
        connected: true
      };
      state.players.push(player);
    } else {
      player.name = name;
      player.connected = true;
    }

    await this.save(state);
    await this.broadcastState();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message." }));
      return;
    }

    const attachment = ws.deserializeAttachment();
    const pid = attachment?.pid;
    const state = await this.load();
    const index = state.players.findIndex(p => p.id === pid);

    if (index < 0) {
      ws.send(JSON.stringify({ type: "error", message: "Player not found." }));
      return;
    }

    if (data.type === "start") {
      if (index !== 0) {
        ws.send(JSON.stringify({ type: "error", message: "Only the room host can start the game." }));
        return;
      }
      if (state.players.length < 2 || state.players.length > 6) {
        ws.send(JSON.stringify({ type: "error", message: "A game needs 2 to 6 players." }));
        return;
      }
      if (state.status !== "lobby") return;

      const game = freshGame(state.players);
      Object.assign(state, game);
      await this.save(state);
      await this.broadcastState();
      return;
    }

    if (data.type === "reset") {
      if (index !== 0) return;
      state.status = "lobby";
      state.board = null;
      state.deck = [];
      state.discard = [];
      state.hands = [];
      state.current = 0;
      state.winner = null;
      for (const p of state.players) p.connected = true;
      await this.save(state);
      await this.broadcastState();
      return;
    }

    if (data.type === "play") {
      await this.handlePlay(state, index, data);
      return;
    }

    if (data.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  }

  async handlePlay(state, playerIndex, data) {
    if (state.status !== "playing") return;
    if (state.current !== playerIndex) {
      return this.sendToPlayer(state.players[playerIndex].id, {
        type: "error",
        message: "It isn't your turn."
      });
    }

    const p = state.players[playerIndex];
    const handIndex = Number.isInteger(data.handIndex) ? data.handIndex : -1;
    const r = Number.isInteger(data.r) ? data.r : -1;
    const c = Number.isInteger(data.c) ? data.c : -1;
    const card = state.hands[playerIndex]?.[handIndex];

    if (!card || r < 0 || r >= 10 || c < 0 || c >= 10) return;

    const face = BOARD[r][c];
    const boardState = state.board[r][c];

    if (face === "X") {
      return this.sendToPlayer(p.id, { type: "error", message: "Corners are automatically wild." });
    }

    if (oneEyed(card)) {
      if (!boardState || boardState === "corner") {
        return this.sendToPlayer(p.id, { type: "error", message: "Choose an opponent chip to remove." });
      }
      if (boardState === p.chip) {
        return this.sendToPlayer(p.id, { type: "error", message: "You cannot remove your own chip." });
      }
      if (chipProtected(state.board, r, c, boardState)) {
        return this.sendToPlayer(p.id, { type: "error", message: "That chip is protected by a completed sequence." });
      }
      state.board[r][c] = null;
    } else {
      if (boardState) {
        return this.sendToPlayer(p.id, { type: "error", message: "That space is already occupied." });
      }
      if (!twoEyed(card) && face !== card.key) {
        return this.sendToPlayer(p.id, { type: "error", message: `That space does not match ${card.rank}${card.suit}.` });
      }
      state.board[r][c] = p.chip;
    }

    state.discard[playerIndex].push(card);
    state.hands[playerIndex].splice(handIndex, 1);
    if (state.deck.length) state.hands[playerIndex].push(state.deck.pop());

    const sequenceCount = countSequences(state.board, p.chip);
    if (sequenceCount >= state.sequencesToWin) {
      state.status = "finished";
      state.winner = p.id;
    } else {
      state.current = (state.current + 1) % state.players.length;
    }

    await this.save(state);
    await this.broadcastState();
  }

  async sendToPlayer(pid, payload) {
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a?.pid === pid) {
        try { ws.send(JSON.stringify(payload)); } catch {}
      }
    }
  }

  publicStateFor(pid) {
    return this.load().then(state => {
      const me = state.players.findIndex(p => p.id === pid);
      const activePlayer = state.players[state.current];
      return {
        type: "state",
        room: this.roomCodeFromRequest(),
        status: state.status,
        players: state.players,
        board: state.board,
        current: state.current,
        currentPlayerId: activePlayer?.id || null,
        winner: state.winner,
        sequencesToWin: state.sequencesToWin,
        me: me,
        hand: me >= 0 ? state.hands[me] : [],
        discards: state.discard
      };
    });
  }

  roomCodeFromRequest() {
    // The room code is cosmetic on the client; it is in the URL there.
    return null;
  }

  async broadcastState() {
    const state = await this.load();
    const sockets = this.ctx.getWebSockets();

    for (const ws of sockets) {
      const a = ws.deserializeAttachment();
      const pid = a?.pid;
      const me = state.players.findIndex(p => p.id === pid);
      const payload = {
        type: "state",
        status: state.status,
        players: state.players,
        board: state.board,
        current: state.current,
        currentPlayerId: state.players[state.current]?.id || null,
        winner: state.winner,
        sequencesToWin: state.sequencesToWin,
        me,
        hand: me >= 0 ? state.hands[me] : [],
        discards: state.discard
      };
      try { ws.send(JSON.stringify(payload)); } catch {}
    }
  }

  async webSocketClose(ws) {
    const a = ws.deserializeAttachment();
    const pid = a?.pid;
    if (!pid) return;
    const state = await this.load();
    const player = state.players.find(p => p.id === pid);
    if (player) {
      player.connected = false;
      await this.save(state);
      await this.broadcastState();
    }
  }

  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
}
