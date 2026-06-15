/* ══════════════════════════════════════
   QUALITY MENU UI
   ══════════════════════════════════════ */

import { btnQuality, qualityMenu, speedMenu } from './dom.js';

export function initQualityMenu() {
  btnQuality.addEventListener('click', e => {
    e.stopPropagation();
    qualityMenu.classList.toggle('open');
    speedMenu.classList.remove('open');
  });

  document.addEventListener('click', () => {
    speedMenu.classList.remove('open');
    qualityMenu.classList.remove('open');
  });
}
