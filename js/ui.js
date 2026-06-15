/* ══════════════════════════════════════
   UI AUTO-HIDE
   ══════════════════════════════════════ */

import { container, video } from './dom.js';
import { state } from './state.js';

export function showUI() {
  container.classList.add('show-ui');
  clearTimeout(state.hideTimer);
  state.hideTimer = setTimeout(() => {
    if (!video.paused) container.classList.remove('show-ui');
  }, 3200);
}

export function initUI() {
  container.addEventListener('mousemove', showUI);
  container.addEventListener('touchstart', showUI, { passive: true });
}
