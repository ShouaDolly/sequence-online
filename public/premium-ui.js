(()=> {
  if (window.__sequencePremiumUIv3Loaded) return;
  window.__sequencePremiumUIv3Loaded = true;

  // Custom avatar lineup. The hidden value remains the existing emoji identifier
  // for multiplayer compatibility; the UI renders the custom avatar artwork.
  const AVATARS = [
    ["😎",18,"turtle"],["🦊",1,"fox"],["🐼",2,"panda"],["🐱",0,"cat"],["🐯",4,"tiger"],
    ["🦄",5,"unicorn"],["🐸",6,"frog"],["🐰",3,"rabbit"],["🐻",7,"bear"],["🐙",8,"octopus"],
    ["🦋",9,"butterfly"],["🌸",10,"blossom"],["🌙",11,"moon"],["⭐",12,"star"],["🔥",13,"fire"],
    ["👻",14,"ghost"],["💎",15,"diamond"],["🍀",16,"clover"],["⚡",17,"wolf"],["🐲",19,"dragon"]
  ];
  const AVATAR_MAP = Object.fromEntries(AVATARS.map(([emoji,index,slug]) => [emoji,{index,slug}]));
  window.SEQUENCE_AVATAR_MAP = AVATAR_MAP;

  function avatarArt(emoji, extraClass="") {
    const meta = AVATAR_MAP[emoji] || AVATAR_MAP["🐱"];
    const el = document.createElement("span");
    el.className = `avatar-art ${extraClass}`.trim();
    el.dataset.emoji = emoji;
    el.dataset.avatarIndex = String(meta.index);
    el.title = meta.slug;
    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 100 100");
    svg.setAttribute("aria-hidden","true");
    const use = document.createElementNS("http://www.w3.org/2000/svg","use");
    const href = `/assets/sequence-avatars.svg#a${String(meta.index+1).padStart(2,"0")}`;
    use.setAttribute("href", href);
    use.setAttributeNS("http://www.w3.org/1999/xlink","href", href);
    svg.appendChild(use);
    el.appendChild(svg);
    return el;
  }

  function setAvatar(container, emoji) {
    if (!container) return;
    container.textContent = "";
    container.appendChild(avatarArt(emoji));
    container.dataset.avatarEmoji = emoji;
  }

  function patchPreview() {
    const emoji = document.getElementById("emoji")?.value || "😎";
    setAvatar(document.getElementById("emojiPreview"), emoji);
  }

  function rebuildPicker() {
    const picker = document.getElementById("emojiPicker");
    if (!picker) return;
    if (picker.dataset.avatarV3 === "1") {
      patchPreview();
      return;
    }
    picker.dataset.avatarV3 = "1";
    picker.innerHTML = "";

    for (const [emoji,index,slug] of AVATARS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "emoji-opt";
      b.dataset.emoji = emoji;
      b.title = slug.replace(/-/g," ");
      b.appendChild(avatarArt(emoji, "picker-avatar"));
      b.addEventListener("click", () => {
        const input = document.getElementById("emoji");
        if (input) input.value = emoji;
        patchPreview();
        document.getElementById("emojiMeta")?.replaceChildren(document.createTextNode("Selected avatar"));
        picker.querySelectorAll(".emoji-opt").forEach(x => x.classList.toggle("selected", x === b));
        const overlay = document.getElementById("emojiOverlay");
        overlay?.classList.remove("open");
        overlay?.setAttribute("aria-hidden","true");
        document.body.classList.remove("emoji-open");
      });
      picker.appendChild(b);
    }
    const current = document.getElementById("emoji")?.value || "😎";
    picker.querySelectorAll(".emoji-opt").forEach(b => b.classList.toggle("selected", b.dataset.emoji === current));
    patchPreview();
  }

  function patchGeneratedPlayers() {
    document.querySelectorAll(
      "#players span[style*='font-size:18px'], #playerStrip span[style*='font-size:17px']"
    ).forEach(el => {
      const emoji = el.textContent.trim();
      if (!AVATAR_MAP[emoji] || el.classList.contains("player-avatar-emoji")) return;
      el.className = "player-avatar-emoji";
      el.dataset.emoji = emoji;
      el.textContent = "";
      el.appendChild(avatarArt(emoji, "mini-avatar"));
    });
  }

  function syncScreens() {
    const screens = [
      document.getElementById("lobby"),
      document.getElementById("roomView"),
      document.getElementById("game")
    ].filter(Boolean);

    const visible = screens.filter(el => !el.classList.contains("hidden"));
    if (visible.length > 1) {
      const game = document.getElementById("game");
      const room = document.getElementById("roomView");
      const lobby = document.getElementById("lobby");
      if (game && !game.classList.contains("hidden")) {
        room?.classList.add("hidden");
        lobby?.classList.add("hidden");
      } else if (room && !room.classList.contains("hidden")) {
        lobby?.classList.add("hidden");
        game?.classList.add("hidden");
      } else {
        room?.classList.add("hidden");
        game?.classList.add("hidden");
      }
    }

    for (const el of screens) {
      const hidden = el.classList.contains("hidden");
      el.setAttribute("aria-hidden", hidden ? "true" : "false");
      if (hidden) {
        el.style.setProperty("display","none","important");
        el.style.setProperty("visibility","hidden","important");
        el.style.setProperty("opacity","0","important");
        el.style.setProperty("pointer-events","none","important");
      } else {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.style.removeProperty("pointer-events");
      }
    }
  }

  let scheduled = false;
  function refresh() {
    syncScreens();
    rebuildPicker();
    patchGeneratedPlayers();
    patchPreview();
  }
  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refresh();
    });
  }

  function boot() {
    document.documentElement.classList.add("sequence-premium-v3");
    refresh();
    const observer = new MutationObserver(() => scheduleRefresh());
    observer.observe(document.body, {
      subtree:true,
      childList:true,
      attributes:true,
      attributeFilter:["class"]
    });
    window.addEventListener("pageshow",scheduleRefresh,{passive:true});
    window.addEventListener("resize",scheduleRefresh,{passive:true});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  } else {
    boot();
  }
})();
