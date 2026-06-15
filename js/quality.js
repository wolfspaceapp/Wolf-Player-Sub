/* ══════════════════════════════════════
   QUALITY MENU
   ══════════════════════════════════════ */

import { qualityMenu } from './dom.js';
import { state } from './state.js';

export function buildQualityMenu(levels) {
  qualityMenu.innerHTML = '<div class="menu-label">Calidad</div>';
  const auto = document.createElement('button');
  auto.dataset.level = '-1'; 
  auto.textContent = 'Auto'; 
  auto.classList.add('active');
  auto.addEventListener('click', () => setQuality(-1));
  qualityMenu.appendChild(auto);
  
  levels.forEach((lvl, i) => {
    const btn = document.createElement('button');
    btn.dataset.level = i;
    btn.textContent = lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate/1000)}k`;
    btn.addEventListener('click', () => setQuality(i));
    qualityMenu.appendChild(btn);
  });
}

export function buildQualityMenuDash(list) {
  qualityMenu.innerHTML = '<div class="menu-label">Calidad</div>';
  list.forEach((info, i) => {
    const btn = document.createElement('button');
    btn.dataset.level = i;
    btn.textContent = info.height ? `${info.height}p` : `${Math.round(info.bitrate/1000)}k`;
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => { 
      state.dashInstance.setQualityFor('video', i); 
      updateQualityActive(i); 
    });
    qualityMenu.appendChild(btn);
  });
}

export function setQuality(level) {
  if (!state.hlsInstance) return;
  state.hlsInstance.currentLevel = level;
  updateQualityActive(level);
}

export function updateQualityActive(level) {
  qualityMenu.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.level) === level));
}

export function rebindQualityAuto() {
  const autoBtn = qualityMenu.querySelector('[data-level="-1"]');
  if (autoBtn) autoBtn.addEventListener('click', () => setQuality(-1));
}
