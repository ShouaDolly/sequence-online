import { DurableObject } from "cloudflare:workers";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const BOARD = [["X", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "X"], ["6♣", "5♣", "4♣", "3♣", "2♣", "A♥", "K♥", "Q♥", "10♥", "10♠"], ["7♣", "A♠", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "9♥", "Q♠"], ["8♣", "K♠", "6♣", "5♣", "4♣", "3♣", "2♣", "8♦", "8♥", "K♠"], ["9♣", "Q♠", "7♣", "6♥", "5♥", "4♥", "A♥", "9♦", "7♥", "A♠"], ["10♣", "10♠", "8♣", "7♥", "2♥", "3♥", "K♥", "10♦", "6♥", "2♦"], ["Q♣", "9♠", "9♣", "8♥", "9♥", "10♥", "Q♥", "Q♦", "5♥", "3♦"], ["K♣", "8♠", "10♣", "Q♣", "K♣", "A♣", "A♦", "K♦", "4♥", "4♦"], ["A♣", "7♠", "6♠", "5♠", "4♠", "3♠", "2♠", "2♥", "3♥", "5♦"], ["X", "A♦", "K♦", "Q♦", "10♦", "9♦", "8♦", "7♦", "6♦", "X"]];

const CHIP_COLORS = ["blue","green","red"];

function playerLimit() { return 12; }
function randomizeTeams(players) {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const n = shuffled.length;
  let names;
  if (n === 2) names = ["Blue", "Red"];
  else if (n === 3) names = ["Blue", "Green", "Red"];
  else if (n === 4) names = ["Blue", "Red"];
  else names = ["Blue", "Green", "Red"];
  const teams = names.map((name,i)=>({id:`team-${i}`,name,color:name.toLowerCase()}));
  shuffled.forEach((p,i)=>{const t=teams[i%teams.length];Object.assign(p,{teamId:t.id,teamName:t.name,teamColor:t.color,tokenKey:t.id});});
  return {players:shuffled,teams};
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
function makeDeck(){const d=[];for(let n=0;n<2;n++)for(const s of SUITS)for(const r of RANKS)d.push({rank:r,suit:s,key:r+s});shuffle(d);return d;}
function isTwoEyed(c){return c?.rank==="J"&&(c.suit==="♣"||c.suit==="♦");}
function isOneEyed(c){return c?.rank==="J"&&(c.suit==="♠"||c.suit==="♥");}
function cleanName(n){return String(n||"").replace(/[^\p{L}\p{N} _-]/gu,"").trim().slice(0,20);}
function validRoom(r){return /^[A-Z0-9]{4,8}$/.test(r);}
function handSize(n){return n===2?7:n>=3&&n<=5?6:5;}
function clampTimer(n){n=Number(n);return Number.isFinite(n)?Math.max(10,Math.min(120,Math.round(n))):60;}
function getSequences(g,chip){const dirs=[[1,0],[0,1],[1,1],[1,-1]],out=[];for(let r=0;r<10;r++)for(let c=0;c<10;c++)for(const[dr,dc]of dirs){const cells=[];let ok=true;for(let k=0;k<5;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=10||cc<0||cc>=10||!(g[rr]?.[cc]===chip||g[rr]?.[cc]==="corner")){ok=false;break;}cells.push(`${rr},${cc}`);}if(ok)out.push(cells);}return out;}
function isProtectedChip(g,r,c,chip){return getSequences(g,chip).some(seq=>seq.includes(`${r},${c}`));}
function freshGame(players){const deck=makeDeck(),hands=players.map(()=>[]),hs=handSize(players.length);for(let i=0;i<hs;i++)for(let p=0;p<players.length;p++)if(deck.length)hands[p].push(deck.pop());const timers=players.map(p=>p.timerSeconds||60);return{status:"playing",board:BOARD.map(row=>row.map(v=>v==="X"?"corner":null)),deck,discard:players.map(()=>[]),hands,current:0,winner:null,winningCells:[],sequencesToWin:2,timerSeconds:timers,remainingSeconds:[...timers],lastTickAt:Date.now(),paused:false,pendingMove:null,teams:players.map(p=>({id:p.teamId,name:p.teamName,color:p.teamColor})),lastAutoPlay:null};}

export default{async fetch(request,env){const u=new URL(request.url);if(u.pathname==="/")return env.ASSETS.fetch(new Request(new URL("/index.html",request.url),request));if(u.pathname==="/health")return new Response("ok");if(u.pathname.startsWith("/ws/")){if(request.headers.get("Upgrade")!=="websocket")return new Response("Expected WebSocket",{status:426});const room=u.pathname.slice(4).toUpperCase();if(!validRoom(room))return new Response("Invalid room code",{status:400});return env.GAME_ROOM.get(env.GAME_ROOM.idFromName(room)).fetch(request);}return new Response("Not found",{status:404});}};

export class GameRoom extends DurableObject{
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;}
  async load(){return await this.ctx.storage.get("state")||{status:"lobby",board:null,deck:[],discard:[],hands:[],current:0,winner:null,players:[],spectators:[],teams:[],pendingMove:null};}
  async save(s){await this.ctx.storage.put("state",s);}

  async fetch(request){
    const u=new URL(request.url),name=cleanName(u.searchParams.get("name")),pid=String(u.searchParams.get("pid")||"").slice(0,80),spectator=u.searchParams.get("spectator")==="1";
    if(!name||!pid)return new Response("Name and player id are required",{status:400});
    const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);server.serializeAttachment({pid,spectator});
    const state=await this.load();
    if(spectator){const s=(state.spectators||[]).find(x=>x.id===pid);if(s){s.name=name;s.connected=true;}else{state.spectators=[...(state.spectators||[]),{id:pid,name,connected:true}];}await this.save(state);await this.broadcastState();return new Response(null,{status:101,webSocket:client});}
    let p=state.players.find(x=>x.id===pid);
    if(!p){if(state.status!=="lobby"){server.send(JSON.stringify({type:"error",message:"This game has already started. Join as a spectator instead."}));server.close(1008,"Game started");return new Response(null,{status:101,webSocket:client});}if(state.players.length>=playerLimit()){server.send(JSON.stringify({type:"error",message:"This room is full."}));server.close(1008,"Room full");return new Response(null,{status:101,webSocket:client});}p={id:pid,name,teamId:null,teamName:null,teamColor:null,connected:true,timerSeconds:60};state.players.push(p);}else{p.name=name;p.connected=true;}
    await this.save(state);await this.broadcastState();return new Response(null,{status:101,webSocket:client});
  }

  async webSocketMessage(ws,message){
    let d;try{d=JSON.parse(message);}catch{return;}
    const a=ws.deserializeAttachment(),pid=a?.pid,isSpec=!!a?.spectator,state=await this.load(),i=state.players.findIndex(p=>p.id===pid);
    if(isSpec||i<0){if(d.type==="ping")ws.send(JSON.stringify({type:"pong"}));return;}
    if(d.type==="set_timer"){if(i!==0||state.status!=="lobby")return;const sec=clampTimer(d.seconds);state.players.forEach(p=>p.timerSeconds=sec);await this.save(state);return this.broadcastState();}
    if(d.type==="start"){if(i!==0||state.players.length<2||state.players.length>playerLimit()||state.status!=="lobby")return;const t=randomizeTeams(state.players);state.players=t.players;state.teams=t.teams;Object.assign(state,freshGame(state.players));await this.save(state);return this.broadcastState();}
    if(d.type==="pause"){if(i!==0||state.status!=="playing")return;state.paused=!state.paused;state.lastTickAt=Date.now();await this.save(state);return this.broadcastState();}
    if(d.type==="end_turn"){if(i!==0||state.status!=="playing"||state.paused)return;await this.finishOrAutoFinishCurrentTurn(state,"host");return;}
    if(d.type==="finish_turn"){if(state.status!=="playing"||state.paused||state.current!==i)return;await this.finishStagedTurn(state,i);return;}
    if(d.type==="undo_move"){if(state.status!=="playing"||state.paused||state.current!==i)return;await this.undoStagedMove(state,i);return;}
    if(d.type==="tick"){await this.handleTick(state);return;}
    if(d.type==="stage_play"){await this.stageMove(state,i,d);return;}
    if(d.type==="reset"&&i===0){state.status="lobby";state.board=null;state.deck=[];state.discard=[];state.hands=[];state.current=0;state.winner=null;state.winningCells=[];state.paused=false;state.pendingMove=null;state.lastAutoPlay=null;state.players.forEach(p=>{p.teamId=null;p.teamName=null;p.teamColor=null;});await this.save(state);return this.broadcastState();}
  }

  async stageMove(state,playerIndex,data){
    if(state.status!=="playing"||state.paused)return;
    if(state.current!==playerIndex)return this.sendToPlayer(state.players[playerIndex].id,{type:"error",message:"It isn't your turn."});
    if(state.pendingMove)return this.sendToPlayer(state.players[playerIndex].id,{type:"error",message:"Finish or undo your current move first."});
    const handIndex=Number.isInteger(data.handIndex)?data.handIndex:-1,r=Number.isInteger(data.r)?data.r:-1,c=Number.isInteger(data.c)?data.c:-1,hand=state.hands[playerIndex]||[],card=hand[handIndex];
    if(!card||r<0||r>=10||c<0||c>=10)return this.sendToPlayer(state.players[playerIndex].id,{type:"error",message:"Invalid move."});
    const player=state.players[playerIndex],face=BOARD[r][c],previous=state.board[r][c];
    if(face==="X")return this.sendToPlayer(player.id,{type:"error",message:"Corners are already wild."});
    let action="place";
    if(isOneEyed(card)){if(!previous||previous==="corner"||previous===player.teamId)return this.sendToPlayer(player.id,{type:"error",message:"Choose an opponent token to remove."});if(isProtectedChip(state.board,r,c,previous))return this.sendToPlayer(player.id,{type:"error",message:"That token is protected by a completed sequence."});state.board[r][c]=null;action="remove";}
    else{if(previous)return this.sendToPlayer(player.id,{type:"error",message:"That space is already occupied."});if(!isTwoEyed(card)&&face!==card.key)return this.sendToPlayer(player.id,{type:"error",message:`That space does not match ${card.rank}${card.suit}.`});state.board[r][c]=player.teamId;}
    state.pendingMove={playerIndex,handIndex,r,c,action,previous,cardKey:card.key};
    await this.save(state);await this.broadcastState();
  }

  async undoStagedMove(state,playerIndex){const p=state.pendingMove;if(!p||p.playerIndex!==playerIndex)return;state.board[p.r][p.c]=p.previous;state.pendingMove=null;await this.save(state);await this.broadcastState();}

  async finishStagedTurn(state,playerIndex){
    const p=state.pendingMove;if(!p||p.playerIndex!==playerIndex)return this.sendToPlayer(state.players[playerIndex].id,{type:"error",message:"Choose a card and board space first."});
    const hand=state.hands[playerIndex]||[],card=hand[p.handIndex];if(!card||card.key!==p.cardKey){state.pendingMove=null;return this.sendToPlayer(state.players[playerIndex].id,{type:"error",message:"That staged move is no longer valid."});}
    const player=state.players[playerIndex];state.discard[playerIndex].push(card);hand.splice(p.handIndex,1);if(state.deck.length)hand.push(state.deck.pop());state.pendingMove=null;
    const sequences=getSequences(state.board,player.teamId);if(sequences.length>=state.sequencesToWin){state.status="finished";state.winner=player.id;state.winningCells=[...new Set(sequences.flat())];}else{state.current=(state.current+1)%state.players.length;state.remainingSeconds[state.current]=state.timerSeconds[state.current];}
    state.lastTickAt=Date.now();await this.save(state);await this.broadcastState();
  }

  async finishOrAutoFinishCurrentTurn(state,reason){if(state.status!=="playing"||state.paused)return;if(state.pendingMove)return this.finishStagedTurn(state,state.pendingMove.playerIndex);return this.autoPlayTurn(state,state.current,reason);}

  async handleTick(state){if(state.status!=="playing"||state.paused)return;const now=Date.now(),elapsed=Math.floor((now-(state.lastTickAt||now))/1000);if(elapsed<=0)return;state.lastTickAt=now;const i=state.current;state.remainingSeconds[i]=Math.max(0,(state.remainingSeconds[i]??state.timerSeconds[i]??60)-elapsed);if(state.remainingSeconds[i]<=0){await this.finishOrAutoFinishCurrentTurn(state,"timer");return;}await this.save(state);await this.broadcastState();}

  async autoPlayTurn(state,playerIndex,reason="host"){
    if(state.status!=="playing")return;state.pendingMove=null;const player=state.players[playerIndex],teamId=player.teamId,hand=state.hands[playerIndex]||[],move=this.chooseStrategicMove(state,playerIndex);
    if(move){const card=hand[move.handIndex];if(move.kind==="remove")state.board[move.r][move.c]=null;else state.board[move.r][move.c]=teamId;state.discard[playerIndex].push(card);hand.splice(move.handIndex,1);if(state.deck.length)hand.push(state.deck.pop());const sequences=getSequences(state.board,teamId);if(sequences.length>=state.sequencesToWin){state.status="finished";state.winner=player.id;state.winningCells=[...new Set(sequences.flat())];}}
    else{const deadIndex=this.findDeadCardIndex(state,playerIndex);if(deadIndex>=0){const [card]=hand.splice(deadIndex,1);state.discard[playerIndex].push(card);if(state.deck.length)hand.push(state.deck.pop());}}
    if(state.status==="playing"){state.current=(state.current+1)%state.players.length;state.remainingSeconds[state.current]=state.timerSeconds[state.current];}state.lastTickAt=Date.now();state.lastAutoPlay={playerId:player.id,reason,summary:move?move.summary:"Auto-finish discarded an unavailable card."};await this.save(state);await this.broadcastState();
  }

  chooseStrategicMove(state,playerIndex){const player=state.players[playerIndex],teamId=player.teamId,hand=state.hands[playerIndex]||[],candidates=[];const place=(r,c,hi,reason)=>{const copy=state.board.map(row=>row.slice()),before=getSequences(state.board,teamId).length;copy[r][c]=teamId;const after=getSequences(copy,teamId).length;let adjacent=0;for(const[dr,dc]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<10&&cc>=0&&cc<10&&(copy[rr][cc]===teamId||copy[rr][cc]==="corner"))adjacent++;}candidates.push({kind:"place",handIndex:hi,r,c,score:after*1000+(after>before?5000:0)+adjacent*25+(8-Math.abs(r-4.5)-Math.abs(c-4.5)),summary:after>before?"Auto-finish created a sequence.":reason});};hand.forEach((card,hi)=>{if(isTwoEyed(card)){for(let r=0;r<10;r++)for(let c=0;c<10;c++)if(state.board[r][c]===null&&BOARD[r][c]!=="X")place(r,c,hi,"Auto-finish used a wild Jack offensively.");}else if(!isOneEyed(card)){for(let r=0;r<10;r++)for(let c=0;c<10;c++)if(state.board[r][c]===null&&BOARD[r][c]===card.key)place(r,c,hi,`Auto-finish played ${card.rank}${card.suit}.`);}});hand.forEach((card,hi)=>{if(!isOneEyed(card))return;for(let r=0;r<10;r++)for(let c=0;c<10;c++){const token=state.board[r][c];if(!token||token==="corner"||token===teamId||isProtectedChip(state.board,r,c,token))continue;const before=getSequences(state.board,token).length,copy=state.board.map(row=>row.slice());copy[r][c]=null;const after=getSequences(copy,token).length;candidates.push({kind:"remove",handIndex:hi,r,c,score:(before-after)*1200+(before>0?800:50),summary:before>after?"Auto-finish used a removal Jack to break a threat.":"Auto-finish used a removal Jack offensively."});}});candidates.sort((a,b)=>b.score-a.score);return candidates[0]||null;}
  findDeadCardIndex(state,playerIndex){const hand=state.hands[playerIndex]||[];for(let i=0;i<hand.length;i++){const card=hand[i];if(isTwoEyed(card)){if(state.board.some((row,r)=>row.some((v,c)=>v===null&&BOARD[r][c]!=="X")))continue;return i;}if(isOneEyed(card)){let removable=false;for(let r=0;r<10&&!removable;r++)for(let c=0;c<10;c++){const t=state.board[r][c];if(t&&t!=="corner"&&t!==state.players[playerIndex].teamId&&!isProtectedChip(state.board,r,c,t)){removable=true;break;}}if(!removable)return i;continue;}let playable=false;for(let r=0;r<10&&!playable;r++)for(let c=0;c<10;c++)if(state.board[r][c]===null&&BOARD[r][c]===card.key){playable=true;break;}if(!playable)return i;}return -1;}

  async sendToPlayer(pid,payload){for(const ws of this.ctx.getWebSockets()){const a=ws.deserializeAttachment();if(a?.pid===pid){try{ws.send(JSON.stringify(payload));}catch{}}}}
  async broadcastState(){const state=await this.load();for(const ws of this.ctx.getWebSockets()){const attachment=ws.deserializeAttachment(),pid=attachment?.pid,isSpectator=!!attachment?.spectator,me=state.players.findIndex(p=>p.id===pid);const payload={type:"state",status:state.status,players:state.players,board:state.board,current:state.current,currentPlayerId:state.players[state.current]?.id||null,winner:state.winner,winningCells:state.winningCells,sequencesToWin:2,me,isSpectator,hand:!isSpectator&&me>=0?state.hands[me]:[],discards:state.discard,deckCount:state.deck.length,timerSeconds:state.timerSeconds||[],remainingSeconds:state.remainingSeconds||[],teams:state.teams||[],paused:!!state.paused,pendingMove:state.pendingMove?{playerId:state.players[state.pendingMove.playerIndex]?.id||null,r:state.pendingMove.r,c:state.pendingMove.c,action:state.pendingMove.action}:null,lastAutoPlay:state.lastAutoPlay||null,spectators:state.spectators||[]};try{ws.send(JSON.stringify(payload));}catch{}}}
  async webSocketClose(ws){const a=ws.deserializeAttachment(),state=await this.load(),player=state.players.find(x=>x.id===a?.pid),spectator=(state.spectators||[]).find(x=>x.id===a?.pid);if(player)player.connected=false;if(spectator)spectator.connected=false;await this.save(state);await this.broadcastState();}
  async webSocketError(ws){await this.webSocketClose(ws);}
}
