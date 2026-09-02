(() => {
  'use strict';
  const COLORS = ['blue','green','red'];
  let audioCtx = null;
  let muted = localStorage.getItem('sequence_sound_muted') === '1';
  let haptics = localStorage.getItem('sequence_haptics_enabled') !== '0';
  let lastLockedSignature = '';
  function ctx(){ if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended')audioCtx.resume(); return audioCtx; }
  function tone(freq,duration=.09,type='sine',volume=.035,when=0){if(muted)return;try{const ac=ctx(),now=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(ac.destination);o.start(now);o.stop(now+duration+.02)}catch{}}
  function silly(name){if(name==='card'){tone(360,.06,'triangle',.028);tone(520,.07,'triangle',.022,.035)}else if(name==='place'){tone(210,.06,'square',.025);tone(330,.10,'triangle',.028,.045)}else if(name==='remove'){tone(620,.06,'sawtooth',.022);tone(260,.13,'triangle',.03,.055)}else if(name==='finish'){tone(440,.08,'triangle',.03);tone(660,.08,'triangle',.03,.08);tone(880,.16,'triangle',.04,.16)}else if(name==='auto'){tone(180,.12,'sawtooth',.028);tone(120,.15,'square',.02,.10);tone(240,.12,'triangle',.025,.23)}else if(name==='hint'){tone(880,.06,'sine',.025);tone(1180,.09,'sine',.025,.07)}else if(name==='lock'){tone(520,.08,'triangle',.028);tone(780,.08,'triangle',.03,.07);tone(1040,.16,'sine',.035,.14)}}
  function buzz(pattern){if(!haptics||!('vibrate'in navigator))return;try{navigator.vibrate(pattern)}catch{}}
  const H={card:8,place:[10,20,10],remove:[25,35,25],finish:[12,25,18],auto:[35,25,35,25,55],hint:6,lock:[15,30,15,30,60]};
  function feedback(name){buzz(H[name]??8);silly(name)}
  const soundButton=document.createElement('button');soundButton.type='button';soundButton.id='soundToggle';soundButton.textContent=muted?'🔇':'🔊';soundButton.title='Toggle game sounds';soundButton.style.cssText='position:fixed;right:12px;bottom:12px;z-index:4000;width:40px;height:40px;border-radius:50%;border:1px solid #52749b;background:#0b2445;color:#fff;box-shadow:0 6px 18px #0006;cursor:pointer;font-size:18px';soundButton.onclick=()=>{muted=!muted;localStorage.setItem('sequence_sound_muted',muted?'1':'0');soundButton.textContent=muted?'🔇':'🔊';if(!muted)feedback('hint')};document.body.appendChild(soundButton);
  const hapticButton=document.createElement('button');hapticButton.type='button';hapticButton.id='hapticToggle';hapticButton.textContent=haptics?'📳':'📴';hapticButton.title='Toggle haptic feedback';hapticButton.style.cssText='position:fixed;right:58px;bottom:12px;z-index:4000;width:40px;height:40px;border-radius:50%;border:1px solid #52749b;background:#0b2445;color:#fff;box-shadow:0 6px 18px #0006;cursor:pointer;font-size:18px';hapticButton.onclick=()=>{haptics=!haptics;localStorage.setItem('sequence_haptics_enabled',haptics?'1':'0');hapticButton.textContent=haptics?'📳':'📴';if(haptics)buzz(18)};document.body.appendChild(hapticButton);
  function boardCells(){return[...document.querySelectorAll('#board .cell')]}
  function idx(r,c){return r*10+c}
  function hasToken(cells,r,c,color){const cell=cells[idx(r,c)];return!!cell?.querySelector('.token.'+color)}
  function isCorner(r,c){return(r===0||r===9)&&(c===0||c===9)}
  function occ(cells,r,c,color){return r>=0&&r<10&&c>=0&&c<10&&(isCorner(r,c)||hasToken(cells,r,c,color))}
  function sequencesFor(cells,color){const dirs=[[1,0],[0,1],[1,1],[1,-1]],out=[];for(let r=0;r<10;r++)for(let c=0;c<10;c++)for(const[dr,dc]of dirs){const pr=r-dr,pc=c-dc;if(occ(cells,pr,pc,color)||!occ(cells,r,c,color))continue;const run=[];let rr=r,cc=c;while(occ(cells,rr,cc,color)){run.push([rr,cc]);rr+=dr;cc+=dc}for(let k=0;k<=run.length-5;k++)out.push(run.slice(k,k+5))}return out}
  function markLockedSequences(){const cells=boardCells();if(cells.length!==100)return;const locked=new Set();COLORS.forEach(color=>sequencesFor(cells,color).forEach(seq=>seq.forEach(([r,c])=>locked.add(idx(r,c)))));const signature=[...locked].sort((a,b)=>a-b).join(',');cells.forEach((cell,i)=>{const token=cell.querySelector('.token');const should=locked.has(i);token?.classList.toggle('sequence-locked',should);cell.classList.toggle('sequence-locked-cell',should)});if(signature&&signature!==lastLockedSignature){lastLockedSignature=signature;feedback('lock')}if(!signature)lastLockedSignature=''}
  const start=()=>{const b=document.querySelector('#board');if(b){new MutationObserver(()=>{if(document.querySelector('#game:not(.hidden)'))markLockedSequences()}).observe(b,{childList:true,subtree:true});markLockedSequences()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  document.addEventListener('click',e=>{if(e.target.closest?.('#cards .cardhand'))feedback('card');if(e.target.closest?.('#hintBtn'))feedback('hint');if(e.target.closest?.('#finishBtn'))feedback('finish');if(e.target.closest?.('#autoBtn'))feedback('auto');if(e.target.closest?.('#board .cell')){feedback('place');setTimeout(markLockedSequences,40)}},true);
})();

/* Post-game rematch. Use the real game state so the button appears only after a win. */
(()=>{
  let restartButton=null;
  function currentState(){try{return typeof state!=='undefined'?state:null}catch{return null}}
  function gameFinished(){const s=currentState();if(s?.status==='finished')return true;const turn=document.getElementById('turnText')?.textContent||'';return /\bwins!\s*$/i.test(turn)}
  function ensureButton(){const win=document.getElementById('win');if(!win)return;if(!restartButton||!restartButton.isConnected){restartButton=document.createElement('button');restartButton.type='button';restartButton.id='newGameBtn';restartButton.style.cssText='display:none;margin:12px auto 0;padding:11px 18px;border:2px solid #efc55d;border-radius:16px;background:linear-gradient(135deg,#ffeaa7,#f4c44c 55%,#d99a1f);color:#3f2d08;font-weight:1000;box-shadow:0 8px 18px #0004;cursor:pointer;position:relative;z-index:50';restartButton.onclick=restart;win.appendChild(restartButton)}const s=currentState(),finished=gameFinished(),host=!!s?.isHost;restartButton.style.display=finished?'block':'none';restartButton.disabled=finished&&!host;restartButton.textContent=host?'🔄 New Game':'👑 Waiting for host…'}
  function restart(){const s=currentState();if(!s?.isHost){alert('Only the host can start the next game.');return}restartButton.disabled=true;restartButton.textContent='🔄 Resetting room…';try{send({type:'reset'})}catch{restartButton.disabled=false;restartButton.textContent='🔄 New Game';alert('The room could not be reset. Please try again.');return}setTimeout(()=>{const latest=currentState();if(latest?.status==='finished'){restartButton.disabled=false;restartButton.textContent='🔄 New Game'}},2500)}
  const observer=new MutationObserver(()=>ensureButton());function boot(){ensureButton();observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','class']});setInterval(ensureButton,500)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* Hush Five brand layer. Keeps game logic and deployment identifiers untouched. */
(()=>{
  const BRAND='Hush Five';
  let applying=false;
  function replaceWinnerLanguage(){const win=document.getElementById('win');if(!win)return;for(const node of win.childNodes){if(node.nodeType!==Node.TEXT_NODE)continue;const next=(node.nodeValue||'').replace(/completed two sequences!/gi,'claimed two lines!').replace(/completed two sequences/gi,'claimed two lines');if(next!==node.nodeValue)node.nodeValue=next}}
  function applyBrand(){if(applying)return;applying=true;try{
    if(document.title!==BRAND)document.title=BRAND;
    document.querySelectorAll('.logo').forEach(el=>{const wanted='Hush<span>Five</span><small>keep quiet. make five.</small>';if(el.innerHTML!==wanted)el.innerHTML=wanted});
    document.querySelectorAll('.hero').forEach(el=>{const wanted='Play <span>Hush Five</span>';if(el.innerHTML!==wanted)el.innerHTML=wanted});
    document.querySelectorAll('.crown b').forEach(el=>{if(el.textContent!==BRAND)el.textContent=BRAND});
    const lineStat=document.querySelector('.stats .stat:first-child');if(lineStat&&lineStat.dataset.hushFive!=='1'){lineStat.innerHTML='<b>🏆 2</b>Lines';lineStat.dataset.hushFive='1'}
    document.querySelectorAll('img[alt*="Sequence"],img[alt*="sequence"],img[alt*="QuinLume"]').forEach(img=>img.alt='Hush Five fox mascot');
    replaceWinnerLanguage();
  }finally{applying=false}}
  function boot(){applyBrand();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyBrand()})}).observe(document.body,{subtree:true,childList:true,characterData:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
