/* ═════════════════════════════════════════════════════════════
   NGUYEN LE BAO NGAN — GAME ENGINE + INTERACTIONS
   ═════════════════════════════════════════════════════════════ */
'use strict';

/* ─── CONFIG ─── */
const WORLD_W   = 2600;
const WORLD_H   = 640;
const CHAR_SPEED = 3.5;           // px per frame
const GROUND_Y  = 200 + 24 + 2;  // pixels from bottom of world
const DOOR_PROXIMITY = 60;        // px to auto-trigger near door

/* ─── STATE ─── */
const state = {
  charX: 100,
  charY: 0,
  velX: 0,
  velY: 0,
  facingRight: true,
  walking: false,
  keys: {},
  targetX: null,
  scrollX: 0,
  viewW: 0,
  viewH: 0,
  activePanel: null,
  lightboxImages: [],
  lightboxIndex: 0,
  isDragging: false,
  dragStartX: 0,
  dragScrollX: 0,
  nearBuilding: null,
};

/* ─── DOM REFS ─── */
const worldWrap   = document.getElementById('world-wrap');
const world       = document.getElementById('world');
const character   = document.getElementById('character');
const mmPlayer    = document.getElementById('mm-player');
const clickRipple = document.getElementById('click-ripple');
const moveTarget  = document.getElementById('move-target');
const notif       = document.getElementById('notif');
const notifText   = document.getElementById('notif-text');
const overlay     = document.getElementById('panel-overlay');
const helpBtn     = document.getElementById('help-btn');
const helpPopup   = document.getElementById('help-popup');
const lightbox    = document.getElementById('lightbox');
const lbImg       = document.getElementById('lb-img');
const lbTitle     = document.getElementById('lb-title');
const lbDesc      = document.getElementById('lb-desc');

/* ─── LOADING ─── */
const loadBar  = document.getElementById('load-bar');
const loadHint = document.getElementById('load-hint');
const loading  = document.getElementById('loading');

const hints = [
  'Loading textures...', 'Spawning character...',
  'Building the world...', 'Ready to explore!'
];
let loadVal = 0;
const loadInterval = setInterval(() => {
  loadVal += Math.random() * 12 + 4;
  if (loadVal > 100) loadVal = 100;
  loadBar.style.width = loadVal + '%';
  loadHint.textContent = hints[Math.floor((loadVal / 100) * (hints.length - 1))];
  if (loadVal >= 100) {
    clearInterval(loadInterval);
    setTimeout(startGame, 500);
  }
}, 120);

function startGame() {
  loading.classList.add('out');
  setTimeout(() => { loading.remove(); }, 800);
  createStars();
  initWorld();
  loop();
}

/* ─── STARS ─── */
function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    const size = Math.random() * 2.5 + .5;
    const op   = Math.random() * .7 + .2;
    const dur  = Math.random() * 3 + 2;
    s.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:white;
      left:${Math.random() * 100}%;
      top:${Math.random() * 80}%;
      opacity:${op};
      animation:starTwinkle ${dur}s ease-in-out infinite;
      animation-delay:${Math.random()*3}s;
    `;
    container.appendChild(s);
  }
  // inject twinkle keyframe
  const style = document.createElement('style');
  style.textContent = `
    @keyframes starTwinkle {
      0%,100%{opacity:.2;transform:scale(1);}
      50%{opacity:.9;transform:scale(1.4);}
    }`;
  document.head.appendChild(style);
}

/* ─── INIT WORLD ─── */
function initWorld() {
  state.viewW = worldWrap.clientWidth;
  state.viewH = worldWrap.clientHeight;
  state.charX = 100;
  updateCharPos(false);
  updateScroll(false);
}

/* ─── GAME LOOP ─── */
function loop() {
  update();
  requestAnimationFrame(loop);
}

function update() {
  if (state.activePanel) return; // freeze while panel open

  handleKeyMovement();
  handleTargetMovement();
  applyPosition();
  checkProximity();
  updateMinimap();
}

/* ─── KEY MOVEMENT ─── */
function handleKeyMovement() {
  const left  = state.keys['ArrowLeft']  || state.keys['a'] || state.keys['A'];
  const right = state.keys['ArrowRight'] || state.keys['d'] || state.keys['D'];
  const up    = state.keys['ArrowUp']    || state.keys['w'] || state.keys['W'];
  const down  = state.keys['ArrowDown']  || state.keys['s'] || state.keys['S'];

  if (left || right || up || down) {
    state.targetX = null; // cancel click-target if key pressed
    moveTarget.classList.remove('show');
  }

  if (left)  { state.charX -= CHAR_SPEED; state.facingRight = false; state.walking = true; }
  if (right) { state.charX += CHAR_SPEED; state.facingRight = true;  state.walking = true; }
  if (!left && !right) {
    if (!state.targetX) state.walking = false;
  }

  // clamp
  state.charX = Math.max(20, Math.min(WORLD_W - 60, state.charX));
}

/* ─── TARGET MOVEMENT (click) ─── */
function handleTargetMovement() {
  if (state.targetX === null) return;
  const diff = state.targetX - state.charX;
  if (Math.abs(diff) < CHAR_SPEED) {
    state.charX = state.targetX;
    state.targetX = null;
    state.walking = false;
    moveTarget.classList.remove('show');
  } else {
    const dir = diff > 0 ? 1 : -1;
    state.charX += dir * CHAR_SPEED;
    state.facingRight = dir > 0;
    state.walking = true;
  }
}

/* ─── APPLY POSITION ─── */
function applyPosition() {
  updateCharPos(true);
  updateScroll(true);
}

function updateCharPos(smooth) {
  character.style.left = state.charX + 'px';

  const sprite = document.getElementById('char-sprite');
  if (state.walking) {
    sprite.style.transform = state.facingRight ? '' : 'scaleX(-1)';
    if (state.facingRight) {
      character.classList.add('walking-right');
      character.classList.remove('walking-left');
    } else {
      character.classList.add('walking-left');
      character.classList.remove('walking-right');
    }
  } else {
    character.classList.remove('walking-right','walking-left');
  }
}

function updateScroll(smooth) {
  // center character in viewport
  const targetScroll = state.charX - state.viewW * 0.4;
  const clamped = Math.max(0, Math.min(WORLD_W - state.viewW, targetScroll));

  if (smooth) {
    state.scrollX += (clamped - state.scrollX) * 0.1;
  } else {
    state.scrollX = clamped;
  }
  world.style.transform = `translateX(${-state.scrollX}px)`;
}

/* ─── MINIMAP ─── */
function updateMinimap() {
  const pct = (state.charX / WORLD_W) * 100;
  mmPlayer.style.left = pct + '%';
}

/* ─── PROXIMITY CHECK ─── */
const buildings = document.querySelectorAll('.building');

function checkProximity() {
  let closest = null;
  let closestDist = Infinity;

  buildings.forEach(bld => {
    const bldLeft = parseInt(bld.style.left || getComputedStyle(bld).left);
    const bldCenter = bldLeft + 80; // half bld-w
    const dist = Math.abs(state.charX - bldCenter);

    if (dist < DOOR_PROXIMITY * 1.8 && dist < closestDist) {
      closest = bld;
      closestDist = dist;
    }
  });

  // update glow on nearest building
  buildings.forEach(bld => {
    const door = bld.querySelector('.bld-door');
    const prox = bld.querySelector('.bld-prox-ring');
    if (bld === closest && closestDist < DOOR_PROXIMITY) {
      if (!prox) {
        const ring = document.createElement('div');
        ring.className = 'bld-prox-ring';
        bld.appendChild(ring);
      }
      bld.style.filter = 'drop-shadow(0 0 24px rgba(168,85,247,.6))';
      showNotif(`Press Enter or walk into "${bld.dataset.label}" to enter`);
    } else {
      if (prox) prox.remove();
      bld.style.filter = '';
    }
  });

  if (!closest || closestDist >= DOOR_PROXIMITY) {
    hideNotif();
  }

  // auto-open on very close
  if (closest && closestDist < 30 && !state.activePanel) {
    const panelId = closest.dataset.panel;
    if (panelId) openPanel(panelId, closest);
  }

  state.nearBuilding = closest;
}

/* ─── ENTER KEY ─── */
document.addEventListener('keydown', e => {
  state.keys[e.key] = true;

  if (e.key === 'Enter' && state.nearBuilding && !state.activePanel) {
    const panelId = state.nearBuilding.dataset.panel;
    if (panelId) openPanel(panelId, state.nearBuilding);
  }

  if (e.key === 'Escape') {
    if (isLightboxOpen()) closeLightbox();
    else closePanel();
  }
});

document.addEventListener('keyup', e => {
  delete state.keys[e.key];
});

/* ─── CLICK TO MOVE ─── */
worldWrap.addEventListener('click', e => {
  if (state.activePanel) return;
  if (state.isDragging) return;

  const rect = worldWrap.getBoundingClientRect();
  const worldX = e.clientX - rect.left + state.scrollX;

  state.targetX = Math.max(20, Math.min(WORLD_W - 60, worldX));

  // ripple
  clickRipple.style.left = e.clientX - rect.left + 'px';
  clickRipple.style.top  = e.clientY - rect.top  + 'px';
  clickRipple.classList.remove('pop');
  void clickRipple.offsetWidth;
  clickRipple.classList.add('pop');

  // move target marker
  moveTarget.style.left = worldX + 'px';
  moveTarget.style.top  = (state.viewH - GROUND_Y - 20) + 'px';
  moveTarget.classList.add('show');
});

/* ─── DRAG TO SCROLL ─── */
worldWrap.addEventListener('mousedown', e => {
  if (state.activePanel) return;
  state.isDragging = false;
  state.dragStartX  = e.clientX;
  state.dragScrollX = state.scrollX;
  worldWrap.classList.add('dragging');
});

worldWrap.addEventListener('mousemove', e => {
  if (!worldWrap.classList.contains('dragging')) return;
  const dx = e.clientX - state.dragStartX;
  if (Math.abs(dx) > 5) {
    state.isDragging = true;
    const newScroll = state.dragScrollX - dx;
    state.scrollX = Math.max(0, Math.min(WORLD_W - state.viewW, newScroll));
    world.style.transform = `translateX(${-state.scrollX}px)`;
    // also move character with drag
    state.charX = state.scrollX + state.viewW * 0.4;
    state.charX = Math.max(20, Math.min(WORLD_W - 60, state.charX));
    character.style.left = state.charX + 'px';
  }
});

document.addEventListener('mouseup', () => {
  worldWrap.classList.remove('dragging');
  setTimeout(() => { state.isDragging = false; }, 50);
});

/* ─── DOOR CLICK ─── */
document.querySelectorAll('.bld-door').forEach(door => {
  door.addEventListener('click', e => {
    e.stopPropagation();
    const bld = door.closest('.building');
    const panelId = bld.dataset.panel;
    openPanel(panelId, bld);
  });
});

/* ─── BUILDING SIGN CLICK ─── */
document.querySelectorAll('.bld-sign').forEach(sign => {
  sign.addEventListener('click', e => {
    e.stopPropagation();
    const bld = sign.closest('.building');
    const panelId = bld.dataset.panel;
    openPanel(panelId, bld);
  });
});

/* ─── TOUCH support ─── */
let touchStartX = 0, touchScrollX = 0;
worldWrap.addEventListener('touchstart', e => {
  touchStartX  = e.touches[0].clientX;
  touchScrollX = state.scrollX;
  state.targetX = null;
}, { passive:true });

worldWrap.addEventListener('touchmove', e => {
  const dx = e.touches[0].clientX - touchStartX;
  state.scrollX = Math.max(0, Math.min(WORLD_W - state.viewW, touchScrollX - dx));
  world.style.transform = `translateX(${-state.scrollX}px)`;
  state.charX = state.scrollX + state.viewW * 0.4;
  state.charX = Math.max(20, Math.min(WORLD_W - 60, state.charX));
  character.style.left = state.charX + 'px';
}, { passive:true });

/* ─── PANEL OPEN/CLOSE ─── */
function openPanel(panelId, bldEl) {
  if (state.activePanel === panelId) return;
  closePanel(false);

  const panel = document.getElementById(panelId);
  if (!panel) return;

  state.activePanel = panelId;
  overlay.classList.add('open');
  panel.classList.add('open');

  // door animation
  if (bldEl) {
    const door = bldEl.querySelector('.bld-door');
    if (door) door.classList.add('opened');
  }

  hideNotif();

  // trap focus
  panel.focus && panel.focus();
}

function closePanel(animate = true) {
  if (!state.activePanel) return;
  const panel = document.getElementById(state.activePanel);
  if (panel) panel.classList.remove('open');
  overlay.classList.remove('open');

  // reset door
  document.querySelectorAll('.bld-door.opened').forEach(d => d.classList.remove('opened'));

  state.activePanel = null;
}

// overlay click to close
overlay.addEventListener('click', () => closePanel());

/* ─── NOTIFICATIONS ─── */
let notifTimeout;
function showNotif(msg) {
  notifText.textContent = msg;
  notif.classList.remove('hidden');
  clearTimeout(notifTimeout);
}
function hideNotif() {
  notifTimeout = setTimeout(() => {
    notif.classList.add('hidden');
  }, 800);
}
document.getElementById('notif-close').addEventListener('click', () => notif.classList.add('hidden'));

/* ─── HELP ─── */
helpBtn.addEventListener('click', e => {
  e.stopPropagation();
  helpPopup.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!helpPopup.contains(e.target) && e.target !== helpBtn) {
    helpPopup.classList.remove('open');
  }
});

/* ─── LIGHTBOX ─── */
let lbImages = [];
let lbIdx = 0;

function openLightbox(src, title, desc) {
  // build images list from current open panel
  lbImages = [];
  const panelId = state.activePanel;
  if (panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.querySelectorAll('.gallery-item img').forEach(img => {
        const item = img.closest('.gallery-item');
        lbImages.push({
          src: img.src,
          title: item.querySelector('.gallery-label span')?.textContent || img.alt,
          desc: '',
        });
      });
    }
  }
  if (!lbImages.length) lbImages = [{ src, title, desc }];

  // find index
  lbIdx = lbImages.findIndex(i => i.src === src || i.src.endsWith(src.split('/').pop()));
  if (lbIdx < 0) lbIdx = 0;

  showLbItem();
  lightbox.classList.add('open');
}

function showLbItem() {
  const item = lbImages[lbIdx];
  lbImg.style.opacity = '0';
  setTimeout(() => {
    lbImg.src = item.src;
    lbImg.alt = item.title;
    lbTitle.textContent = item.title;
    lbDesc.textContent  = item.desc;
    lbImg.style.opacity = '1';
  }, 150);
}

function lbNav(dir) {
  lbIdx = (lbIdx + dir + lbImages.length) % lbImages.length;
  showLbItem();
}

function closeLightbox() {
  lightbox.classList.remove('open');
}
function closeLB(e) {
  if (!e || e.target === lightbox || e.target.id === 'lb-close') closeLightbox();
}

function isLightboxOpen() { return lightbox.classList.contains('open'); }

/* keyboard for lightbox */
document.addEventListener('keydown', e => {
  if (!isLightboxOpen()) return;
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'ArrowRight') lbNav(1);
});

/* ─── CONTACT FORM ─── */
function handleForm(e) {
  e.preventDefault();
  const btn = document.getElementById('cf-submit');
  const span = btn.querySelector('span');
  const orig = span.textContent;

  span.textContent = 'Đang gửi...';
  btn.disabled = true;
  btn.style.opacity = '.7';

  setTimeout(() => {
    span.textContent = '✓ Đã gửi thành công!';
    btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
    btn.style.opacity = '1';
    e.target.reset();

    setTimeout(() => {
      span.textContent = orig;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }, 1500);
}

/* ─── RESIZE ─── */
window.addEventListener('resize', () => {
  state.viewW = worldWrap.clientWidth;
  state.viewH = worldWrap.clientHeight;
});

/* ─── HUD BUILDING SHORTCUTS ─── */
// Click minimap building dots to teleport
document.querySelectorAll('.mm-building').forEach((dot, idx) => {
  const blds = Array.from(buildings);
  dot.style.cursor = 'pointer';
  dot.title = blds[idx]?.dataset?.label || '';
  dot.addEventListener('click', e => {
    e.stopPropagation();
    if (blds[idx]) {
      const bldLeft = parseInt(blds[idx].style.left);
      state.targetX = bldLeft + 80;
    }
  });
});

console.log('%c✦ NBN Portfolio Loaded ⚡', 'color:#a855f7;font-size:16px;font-weight:bold;');
