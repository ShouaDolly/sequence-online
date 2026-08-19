(()=>{
  // Safe to load more than once; the worker may also inject this file.
  if(window.__sequencePremiumUILoaded)return;
  window.__sequencePremiumUILoaded=true;

  function syncScreens(){
    const screens=[
      document.getElementById('lobby'),
      document.getElementById('roomView'),
      document.getElementById('game')
    ].filter(Boolean);

    for(const el of screens){
      const hidden=el.classList.contains('hidden');
      if(hidden){
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('opacity','0','important');
        el.style.setProperty('pointer-events','none','important');
      }else{
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
      }
    }
  }

  let scheduled=false;
  function refresh(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      syncScreens();
    });
  }

  function boot(){
    refresh();
    // IMPORTANT: do not rewrite the emoji picker DOM. The game's native
    // picker relies on the original emoji text/value when an option is clicked.
    const observer=new MutationObserver(()=>refresh());
    observer.observe(document.body,{
      subtree:true,
      childList:true,
      attributes:true,
      attributeFilter:['class']
    });
    window.addEventListener('pageshow',refresh,{passive:true});
    window.addEventListener('resize',refresh,{passive:true});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
