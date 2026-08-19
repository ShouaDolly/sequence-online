(() => {
  'use strict';
  const COLORS = ['blue','green','red'];
  let audioCtx = null;
  let muted = localStorage.getItem('sequence_sound_muted') === '1';

  function ctx(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, duration=.09, type='sine', volume=.035, when=0){
    if(muted) return;
    try{
      const ac=ctx(), now=ac.currentTime+when, o=ac.createOscillator(), g=ac.createGain();
      o.type=type; o.frequency.setValueAtTime(freq,now);
      g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(volume,now+.008); g.gain.exponentialRampToValueAtTime(0.0001,now+duration);
      o.connect(g).connect(ac.destination); o.start(now); o.stop(now+duration+.02);
    }catch{}
  }
  function silly(name){
    if(name==='card'){tone(360,.06,'triangle',.028);tone(520,.07,'triangle',.022,.035)}
    else if(name==='place'){tone(210,.06,'square',.025);tone(330,.10,'triangle',.028,.045)}
    else if(name==='remove'){tone(620,.06,'sawtooth',.022);tone(260,.13,'triangle',.03,.055)}
    else if(name==='finish'){tone(440,.08,'triangle',.03);tone(660,.08,'triangle',.03,.08);tone(880,.16,'triangle',.04,.16)}
    else if(name==='auto'){tone(180,.12,'sawtooth',.028);tone(120,.15,'square',.02,.10);tone(240,.12,'triangle',.025,.23)}
    else if(name==='hint'){tone(880,.06,'sine',.025);tone(1180,.09,'sine',.025,.07)}
    else if(name==='lock'){tone(520,.08,'triangle',.028);tone(780,.08,'triangle',.03,.07);tone(1040,.16,'sine',.035,.14)}
  }

  const soundButton=document.createElement('button');
  soundButton.type='button'; soundButton.id='soundToggle'; soundButton.textContent=muted?'🔇':'🔊'; soundButton.title='Toggle game sounds';
  soundButton.style.cssText='position:fixed;right:12px;bottom:12px;z-index:4000;width:40px;height:40px;border-radius:50%;border:1px solid #52749b;background:#0b2445;color:#fff;box-shadow:0 6px 18px #0006;cursor:pointer;font-size:18px;';
  soundButton.onclick=()=>{muted=!muted;localStorage.setItem('sequence_sound_muted',muted?'1':'0');soundButton.textContent=muted?'🔇':'🔊';if(!muted)silly('hint')};
  document.body.appendChild(soundButton);

  function boardCells(){return [...document.querySelectorAll('#board .cell')];}
  function idx(r,c){return r*10+c}
  function hasToken(cells,r,c,color){const cell=cells[idx(r,c)];return !!cell?.querySelector('.token.'+color)}
  function isCorner(r,c){return (r===0||r===9)&&(c===0||c===9)}
  function occ(cells,r,c,color){return r>=0&&r<10&&c>=0&&c<10&&(isCorner(r,c)||hasToken(cells,r,c,color))}
  function sequencesFor(cells,color){
    const dirs=[[1,0],[0,1],[1,1],[1,-1]],out=[];
    for(let r=0;r<10;r++)for(let c=0;c<10;c++)for(const [dr,dc] of dirs){
      const pr=r-dr,pc=c-dc;if(occ(cells,pr,pc,color)||!occ(cells,r,c,color))continue;
      const run=[];let rr=r,cc=c;while(occ(cells,rr,cc,color)){run.push([rr,cc]);rr+=dr;cc+=dc}
      for(let k=0;k<Math.floor((run.length-1)/4);k++)out.push(run.slice(k*4,k*4+5));
    }
    return out;
  }
  function markLockedSequences(playSound=false){
    const cells=boardCells(); if(cells.length!==100)return;
    const locked=new Set();
    COLORS.forEach(color=>sequencesFor(cells,color).forEach(seq=>seq.forEach(([r,c])=>locked.add(idx(r,c)))));
    let newly=false;
    cells.forEach((cell,i)=>{
      const token=cell.querySelector('.token');
      const should=locked.has(i);
      if(token && should && !token.classList.contains('sequence-locked')) newly=true;
      token?.classList.toggle('sequence-locked',should);
      cell.classList.toggle('sequence-locked-cell',should);
    });
    if(playSound && newly)silly('lock');
    return newly;
  }
  const boardObserver=new MutationObserver(()=>{ if(document.querySelector('#game:not(.hidden)')) markLockedSequences(true); });
  const start=()=>{
    const b=document.querySelector('#board');
    if(b){boardObserver.observe(b,{childList:true,subtree:true});markLockedSequences(false)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();

  document.addEventListener('click',e=>{
    const t=e.target.closest?.('#cards .cardhand'); if(t)silly('card');
    if(e.target.closest?.('#hintBtn'))silly('hint');
    if(e.target.closest?.('#finishBtn'))silly('finish');
    if(e.target.closest?.('#autoBtn'))silly('auto');
    if(e.target.closest?.('#board .cell'))setTimeout(()=>markLockedSequences(false),40);
  },true);
})();
