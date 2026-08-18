import { DurableObject } from "cloudflare:workers";

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const EMOJIS = ["😎","🦊","🐼","🐱","🐯","🦄","🐸","🐵","🐰","🐻","🐨","🐙","🦋","🌸","🍓","🌙","⭐","🔥","👻","💎","🍀","⚡","🐲"];

const BOARD = [
  ["X","2♠","3♠","4♠","5♠","6♠","7♠","8♠","9♠","X"],
  ["6♣","5♣","4♣","3♣","2♣","A♥","K♥","Q♥","10♥","10♠"],
  ["7♣","A♠","2♦","3♦","4♦","5♦","6♦","7♦","9♥","Q♠"],
  ["8♣","K♠","6♣","5♣","4♣","3♣","2♣","8♦","8♥","K♠"],
  ["9♣","Q♠","7♣","6♥","5♥","4♥","A♥","9♦","7♥","A♠"],
  ["10♣","10♠","8♣","7♥","2♥","3♥","K♥","10♦","6♥","2♦"],
  ["Q♣","9♠","9♣","8♥","9♥","10♥","Q♥","Q♦","5♥","3♦"],
  ["K♣","8♠","10♣","Q♣","K♣","A♣","A♦","K♦","4♥","4♦"],
  ["A♣","7♠","6♠","5♠","4♠","3♠","2♠","2♥","3♥","5♦"],
  ["X","A♦","K♦","Q♦","10♦","9♦","8♦","7♦","6♦","X"]
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeDeck() {
  const deck = [];
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of SUITS) for (const rank of RANKS) {
      deck.push({ rank, suit, key: rank + suit });
    }
  }
  return shuffle(deck);
}

function isTwoEyed(card) {
  return card?.rank === "J" && (card.suit === "♣" || card.suit === "♦");
}

function isOneEyed(card) {
  return card?.rank === "J" && (card.suit === "♠" || card.suit === "♥");
}

function cleanName(name) {
  return String(name || "").replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 20);
}

function cleanEmoji(emoji) {
  return EMOJIS.includes(emoji) ? emoji : "😎";
}

function validRoom(room) {
  return /^[A-Z0-9]{4,8}$/.test(room);
}

function handSize(playerCount) {
  return playerCount === 2 ? 7 : playerCount <= 5 ? 6 : 5;
}

function clampTimer(seconds) {
  const n = Number(seconds);
  return Number.isFinite(n) ? Math.max(10, Math.min(120, Math.round(n))) : 60;
}

function randomizeTeams(players) {
  const names =
    players.length === 2 ? ["Blue", "Red"] :
    players.length === 3 ? ["Blue", "Green", "Red"] :
    players.length === 4 ? ["Blue", "Red"] :
    ["Blue", "Green", "Red"];

  const teams = names.map((name, i) => ({
    id: `team-${i}`,
    name,
    color: name.toLowerCase()
  }));

  const slots = [];
  while (slots.length < players.length) slots.push(...names);
  shuffle(slots);

  players.forEach((player, i) => {
    const team = teams.find(t => t.name === slots[i]);
    Object.assign(player, {
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      tokenKey: team.id
    });
  });

  return { players, teams };
}

// Corners are permanent wild spaces. A run of 9 counts as exactly 2 sequences.
function getSequences(board, teamId) {
  const directions = [[1,0], [0,1], [1,1], [1,-1]];
  const sequences = [];
  const isOccupied = (r, c) =>
    r >= 0 && r < 10 && c >= 0 && c < 10 &&
    (board[r][c] === teamId || board[r][c] === "corner");

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      for (const [dr, dc] of directions) {
        const prevR = r - dr, prevC = c - dc;
        if (isOccupied(prevR, prevC) || !isOccupied(r, c)) continue;

        const run = [];
        let rr = r, cc = c;
        while (isOccupied(rr, cc)) {
          run.push(`${rr},${cc}`);
          rr += dr;
          cc += dc;
        }

        const count = Math.floor((run.length - 1) / 4);
        for (let k = 0; k < count; k++) {
          sequences.push(run.slice(k * 4, k * 4 + 5));
        }
      }
    }
  }

  return sequences;
}

function isProtectedChip(board, r, c, teamId) {
  return getSequences(board, teamId).some(seq => seq.includes(`${r},${c}`));
}

function createGame(players) {
  const deck = makeDeck();
  const hands = players.map(() => []);
  const size = handSize(players.length);

  for (let round = 0; round < size; round++) {
    for (let i = 0; i < players.length; i++) {
      if (deck.length) hands[i].push(deck.pop());
    }
  }

  const timers = players.map(p => p.timerSeconds || 60);

  return {
    status: "playing",
    board: BOARD.map(row => row.map(v => v === "X" ? "corner" : null)),
    deck,
    discard: players.map(() => []),
    hands,
    current: 0,
    winner: null,
    winningCells: [],
    sequencesToWin: 2,
    timerSeconds: timers,
    remainingSeconds: [...timers],
    lastTickAt: Date.now(),
    paused: false,
    pendingMove: null,
    teams: players.map(p => ({ id: p.teamId, name: p.teamName, color: p.teamColor })),
    lastAutoPlay: null
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    if (url.pathname === "/health") return new Response("ok");

    if (url.pathname.startsWith("/ws/")) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }
      const room = url.pathname.slice(4).toUpperCase();
      if (!validRoom(room)) return new Response("Invalid room code", { status: 400 });
      return env.GAME_ROOM.get(env.GAME_ROOM.idFromName(room)).fetch(request);
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
    return await this.ctx.storage.get("state") || {
      status: "lobby",
      board: null,
      deck: [],
      discard: [],
      hands: [],
      current: 0,
      winner: null,
      players: [],
      spectators: [],
      teams: [],
      pendingMove: null,
      hostId: null
    };
  }

  async save(state) {
    await this.ctx.storage.put("state", state);
  }

  async ensureAlarm() {
    const existing = await this.ctx.storage.getAlarm();
    if (existing == null) await this.ctx.storage.setAlarm(Date.now() + 1000);
  }

  async scheduleTimer() {
    await this.ctx.storage.setAlarm(Date.now() + 1000);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const name = cleanName(url.searchParams.get("name"));
    const pid = String(url.searchParams.get("pid") || "").slice(0, 80);
    const spectator = url.searchParams.get("spectator") === "1";
    const emoji = cleanEmoji(url.searchParams.get("emoji"));

    if (!name || !pid) return new Response("Name and player id are required", { status: 400 });

    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ pid, spectator });

    const state = await this.load();

    if (spectator) {
      const existing = (state.spectators || []).find(s => s.id === pid);
      if (existing) {
        existing.name = name;
        existing.emoji = emoji;
        existing.connected = true;
      } else {
        state.spectators = [...(state.spectators || []), { id: pid, name, emoji, connected: true }];
      }
      await this.save(state);
      await this.broadcastState();
      return new Response(null, { status: 101, webSocket: client });
    }

    let player = state.players.find(p => p.id === pid);

    if (!player) {
      if (state.status !== "lobby") {
        server.send(JSON.stringify({ type: "error", message: "This game has already started. Join as a spectator instead." }));
        server.close(1008, "Game started");
        return new Response(null, { status: 101, webSocket: client });
      }
      if (state.players.length >= 12) {
        server.send(JSON.stringify({ type: "error", message: "This room is full." }));
        server.close(1008, "Room full");
        return new Response(null, { status: 101, webSocket: client });
      }
      player = { id: pid, name, emoji, teamId: null, teamName: null, teamColor: null, connected: true, timerSeconds: 60 };
      state.players.push(player);
      if (!state.hostId) state.hostId = pid;
    } else {
      player.name = name;
      player.emoji = emoji;
      player.connected = true;
    }

    await this.save(state);
    await this.broadcastState();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    let data;
    try { data = JSON.parse(message); } catch { return; }

    const attachment = ws.deserializeAttachment();
    const pid = attachment?.pid;
    const isSpectator = !!attachment?.spectator;
    const state = await this.load();
    const index = state.players.findIndex(p => p.id === pid);

    if (isSpectator || index < 0) return;

    if (data.type === "set_timer") {
      if (pid !== state.hostId || state.status !== "lobby") return;
      const seconds = clampTimer(data.seconds);
      state.players.forEach(p => p.timerSeconds = seconds);
      await this.save(state);
      return this.broadcastState();
    }

    if (data.type === "start") {
      if (pid !== state.hostId || state.players.length < 2 || state.status !== "lobby") return;
      const randomized = randomizeTeams(state.players);
      state.players = randomized.players;
      state.teams = randomized.teams;
      Object.assign(state, createGame(state.players));
      await this.save(state);
      await this.ensureAlarm();
      return this.broadcastState();
    }

    if (data.type === "pause") {
      if (pid !== state.hostId || state.status !== "playing") return;
      state.paused = !state.paused;
      state.lastTickAt = Date.now();
      if (state.paused) await this.ctx.storage.deleteAlarm();
      else await this.scheduleTimer();
      await this.save(state);
      return this.broadcastState();
    }

    if (data.type === "end_turn") {
      if (pid !== state.hostId || state.status !== "playing" || state.paused) return;
      return this.finishOrAutoFinish(state, "host");
    }

    if (data.type === "finish_turn") {
      if (state.status !== "playing" || state.paused || state.current !== index) return;
      return this.finishStagedTurn(state, index);
    }

    if (data.type === "undo_move") {
      if (state.status !== "playing" || state.paused || state.current !== index) return;
      return this.undoMove(state, index);
    }

    // Browser timer messages are intentionally ignored. The Durable Object alarm is authoritative.
    if (data.type === "tick") return;

    if (data.type === "stage_play") return this.stagePlay(state, index, data);

    if (data.type === "reset" && pid === state.hostId) {
      await this.ctx.storage.deleteAlarm();
      state.status = "lobby";
      state.board = null;
      state.deck = [];
      state.discard = [];
      state.hands = [];
      state.current = 0;
      state.winner = null;
      state.winningCells = [];
      state.paused = false;
      state.pendingMove = null;
      state.lastAutoPlay = null;
      state.players.forEach(p => { p.teamId = null; p.teamName = null; p.teamColor = null; });
      await this.save(state);
      return this.broadcastState();
    }
  }

  async alarm() {
    const state = await this.load();
    if (state.status !== "playing" || state.paused) {
      await this.ctx.storage.deleteAlarm();
      return;
    }

    const now = Date.now();
    const elapsed = Math.floor((now - (state.lastTickAt || now)) / 1000);

    if (elapsed > 0) {
      state.lastTickAt = now;
      const i = state.current;
      state.remainingSeconds[i] = Math.max(0, (state.remainingSeconds[i] ?? state.timerSeconds[i] ?? 60) - elapsed);
      if (state.remainingSeconds[i] <= 0) {
        await this.finishOrAutoFinish(state, "timer");
        return;
      }
      await this.save(state);
      await this.broadcastState();
    }

    await this.scheduleTimer();
  }

  async stagePlay(state, index, data) {
    if (state.status !== "playing" || state.paused || state.current !== index || state.pendingMove) return;

    const handIndex = Number.isInteger(data.handIndex) ? data.handIndex : -1;
    const r = Number.isInteger(data.r) ? data.r : -1;
    const c = Number.isInteger(data.c) ? data.c : -1;
    const hand = state.hands[index] || [];
    const card = hand[handIndex];
    if (!card || r < 0 || r >= 10 || c < 0 || c >= 10 || BOARD[r][c] === "X") return;

    const player = state.players[index];
    const previous = state.board[r][c];

    if (isOneEyed(card)) {
      if (!previous || previous === "corner" || previous === player.teamId || isProtectedChip(state.board, r, c, previous)) return;
      state.board[r][c] = null;
    } else {
      if (previous) return;
      if (!isTwoEyed(card) && BOARD[r][c] !== card.key) return;
      state.board[r][c] = player.teamId;
    }

    state.pendingMove = { playerIndex: index, handIndex, r, c, previous, cardKey: card.key };
    await this.save(state);
    await this.broadcastState();
  }

  async undoMove(state, index) {
    const pending = state.pendingMove;
    if (!pending || pending.playerIndex !== index) return;
    state.board[pending.r][pending.c] = pending.previous;
    state.pendingMove = null;
    await this.save(state);
    await this.broadcastState();
  }

  async finishStagedTurn(state, index) {
    const pending = state.pendingMove;
    if (!pending || pending.playerIndex !== index) return;

    const hand = state.hands[index] || [];
    const card = hand[pending.handIndex];
    const player = state.players[index];

    if (!card || card.key !== pending.cardKey) {
      state.pendingMove = null;
      await this.save(state);
      return this.broadcastState();
    }

    state.discard[index].push(card);
    hand.splice(pending.handIndex, 1);
    if (state.deck.length > 0) hand.push(state.deck.pop());

    state.pendingMove = null;
    const sequences = getSequences(state.board, player.teamId);

    if (sequences.length >= state.sequencesToWin) {
      state.status = "finished";
      state.winner = player.id;
      state.winningCells = [...new Set(sequences.flat())];
      await this.ctx.storage.deleteAlarm();
    } else {
      state.current = (state.current + 1) % state.players.length;
      state.remainingSeconds[state.current] = state.timerSeconds[state.current];
    }

    state.lastTickAt = Date.now();
    await this.save(state);
    if (state.status === "playing") await this.scheduleTimer();
    await this.broadcastState();
  }

  async finishOrAutoFinish(state, reason) {
    if (state.status !== "playing" || state.paused) return;
    if (state.pendingMove) return this.finishStagedTurn(state, state.pendingMove.playerIndex);
    return this.autoPlay(state, state.current, reason);
  }

  async autoPlay(state, index, reason) {
    if (state.status !== "playing") return;
    const player = state.players[index];
    const hand = state.hands[index] || [];
    const move = this.chooseMove(state, index);

    if (move) {
      const card = hand[move.handIndex];
      if (move.kind === "remove") state.board[move.r][move.c] = null;
      else state.board[move.r][move.c] = player.teamId;
      state.discard[index].push(card);
      hand.splice(move.handIndex, 1);
      if (state.deck.length > 0) hand.push(state.deck.pop());

      const sequences = getSequences(state.board, player.teamId);
      if (sequences.length >= state.sequencesToWin) {
        state.status = "finished";
        state.winner = player.id;
        state.winningCells = [...new Set(sequences.flat())];
        await this.ctx.storage.deleteAlarm();
      }
    }

    if (state.status === "playing") {
      state.current = (state.current + 1) % state.players.length;
      state.remainingSeconds[state.current] = state.timerSeconds[state.current];
    }

    state.lastTickAt = Date.now();
    state.lastAutoPlay = { playerId: player.id, reason, summary: move?.summary || "Auto-finish found no legal move." };
    await this.save(state);
    if (state.status === "playing") await this.scheduleTimer();
    await this.broadcastState();
  }

  chooseMove(state, index) {
    const player = state.players[index];
    const team = player.teamId;
    const hand = state.hands[index] || [];
    const candidates = [];

    const considerPlacement = (r, c, handIndex, summary) => {
      const copy = state.board.map(row => row.slice());
      const before = getSequences(state.board, team).length;
      copy[r][c] = team;
      const after = getSequences(copy, team).length;
      candidates.push({
        kind: "place", handIndex, r, c,
        score: after * 1000 + (after > before ? 5000 : 0),
        summary: after > before ? "Auto-finish created a sequence." : summary
      });
    };

    hand.forEach((card, handIndex) => {
      if (isTwoEyed(card)) {
        for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
          if (state.board[r][c] === null && BOARD[r][c] !== "X") {
            considerPlacement(r, c, handIndex, "Auto-finish used a wild Jack.");
          }
        }
      } else if (!isOneEyed(card)) {
        for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
          if (state.board[r][c] === null && BOARD[r][c] === card.key) {
            considerPlacement(r, c, handIndex, `Auto-finish played ${card.rank}${card.suit}.`);
          }
        }
      }
    });

    hand.forEach((card, handIndex) => {
      if (!isOneEyed(card)) return;
      for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
        const token = state.board[r][c];
        if (!token || token === "corner" || token === team || isProtectedChip(state.board, r, c, token)) continue;
        const before = getSequences(state.board, token).length;
        const copy = state.board.map(row => row.slice());
        copy[r][c] = null;
        const after = getSequences(copy, token).length;
        candidates.push({
          kind: "remove", handIndex, r, c,
          score: (before - after) * 1200,
          summary: before > after ? "Auto-finish broke an opponent threat." : "Auto-finish used a removal Jack."
        });
      }
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  }

  async broadcastState() {
    const state = await this.load();

    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment();
      const pid = attachment?.pid;
      const spectator = !!attachment?.spectator;
      const me = state.players.findIndex(p => p.id === pid);

      const payload = {
        type: "state",
        status: state.status,
        players: state.players,
        current: state.current,
        currentPlayerId: state.players[state.current]?.id || null,
        isHost: pid === state.hostId,
        hostId: state.hostId,
        board: state.board,
        winner: state.winner,
        winningCells: state.winningCells,
        sequencesToWin: 2,
        me,
        isSpectator: spectator,
        hand: !spectator && me >= 0 ? [...(state.hands[me] || [])] : [],
        discards: state.discard,
        deckCount: state.deck.length,
        timerSeconds: state.timerSeconds || [],
        remainingSeconds: state.remainingSeconds || [],
        teams: state.teams || [],
        paused: !!state.paused,
        pendingMove: state.pendingMove ? {
          playerId: state.players[state.pendingMove.playerIndex]?.id || null,
          r: state.pendingMove.r,
          c: state.pendingMove.c
        } : null,
        lastAutoPlay: state.lastAutoPlay || null,
        spectators: state.spectators || []
      };

      try { ws.send(JSON.stringify(payload)); } catch {}
    }
  }

  async webSocketClose(ws) {
    const attachment = ws.deserializeAttachment();
    const state = await this.load();
    const player = state.players.find(p => p.id === attachment?.pid);
    const spectator = (state.spectators || []).find(s => s.id === attachment?.pid);
    if (player) player.connected = false;
    if (spectator) spectator.connected = false;
    await this.save(state);
    await this.broadcastState();
  }

  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
}
