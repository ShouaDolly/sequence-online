(()=>{
  const avatars={
    '😎':{id:'a01',name:'Royal Cat'},
    '🦊':{id:'a02',name:'Royal Fox'},
    '🐼':{id:'a03',name:'Panda'},
    '🐱':{id:'a04',name:'Bunny'},
    '🐯':{id:'a05',name:'Tiger'},
    '🦄':{id:'a06',name:'Unicorn'},
    '🐸':{id:'a07',name:'Frog Prince'},
    '🐰':{id:'a08',name:'Honey Bear'},
    '🐻':{id:'a09',name:'Octopus'},
    '🐙':{id:'a10',name:'Butterfly'},
    '🦋':{id:'a11',name:'Flower Spirit'},
    '🌸':{id:'a12',name:'Moon'},
    '🌙':{id:'a13',name:'Star'},
    '⭐':{id:'a14',name:'Fire Dragon'},
    '🔥':{id:'a15',name:'Ghost'},
    '👻':{id:'a16',name:'Crystal'},
    '💎':{id:'a17',name:'Clover'},
    '🍀':{id:'a18',name:'Storm Wolf'},
    '⚡':{id:'a19',name:'Turtle'},
    '🐲':{id:'a20',name:'Eastern Dragon'}
  };
  const avatarSvg=(id)=>`<svg class="avatar-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="/assets/sequence-avatars.svg#${id}"></use></svg>`;
  const getAvatar=value=>avatars[value]||avatars['😎'];

  // The original screen switching relies on .hidden. Explicitly synchronize
  // the three full-page screens as well so a browser compositor cannot leave
  // a stale layer from the previous screen visible underneath the new one.
  function syncScreens(){
    const screens=[document.getElementById('lobby'),document.getElementById('roomView'),document.getElementById('game')].filter(Boolean);
    for(const el of screens){
      const hidden=el.classList.contains('hidden');
      if(hidden){
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('opacity','0','important');
        el.style.setProperty('pointer-events','none','important');
        el.style.setProperty('transform','translateZ(0)','important');
      }else{
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
        el.style.setProperty('transform','translateZ(0)','important');
      }
    }
    // Force a clean paint of the page after a screen transition.
    const page=document.querySelector('.page');
    if(page){
      page.style.setProperty('transform','translateZ(0)','important');
      requestAnimationFrame(()=>requestAnimationFrame(()=>page.style.removeProperty('transform')));
    }
  }

  function decoratePicker(){
    document.querySelectorAll('.emoji-opt').forEach(btn=>{
      if(btn.dataset.avatarEnhanced==='1') return;
      const value=btn.dataset.emoji||'😎';
      const a=getAvatar(value);
      btn.innerHTML=avatarSvg(a.id);
      btn.dataset.avatarEnhanced='1';
      btn.setAttribute('aria-label',`Choose ${a.name}`);
      btn.setAttribute('title',a.name);
    });
  }
  function decoratePreview(){
    const preview=document.getElementById('emojiPreview');
    const hidden=document.getElementById('emoji');
    if(!preview||!hidden) return;
    const value=hidden.value||'😎';
    const a=getAvatar(value);
    if(preview.dataset.avatarValue===value) return;
    preview.innerHTML=avatarSvg(a.id);
    preview.dataset.avatarValue=value;
  }
  function decorateRoster(){
    for(const root of [document.getElementById('players'),document.getElementById('playerStrip')]){
      if(!root) continue;
      root.querySelectorAll('span:not(.teamdot):not(.avatar-mini)').forEach(span=>{
        const value=(span.textContent||'').trim();
        if(!avatars[value]) return;
        const a=getAvatar(value);
        const wrap=document.createElement('span');
        wrap.className='avatar-mini';
        wrap.title=a.name;
        wrap.innerHTML=avatarSvg(a.id);
        span.replaceWith(wrap);
      });
    }
  }
  let scheduled=false;
  function decorate(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      syncScreens();
      decoratePicker();
      decoratePreview();
      decorateRoster();
    });
  }
  function boot(){
    decorate();
    const observer=new MutationObserver(()=>decorate());
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
    const hidden=document.getElementById('emoji');
    if(hidden) hidden.addEventListener('input',decorate);
    window.addEventListener('pageshow',decorate);
    window.addEventListener('resize',decorate);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
