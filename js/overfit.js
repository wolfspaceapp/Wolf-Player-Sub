/* ══════════════════════════════════════
   OVERFIT (Zoom)
   ══════════════════════════════════════ */

import { container, btnOverfit, iconContain, iconCover } from './dom.js';
import { state } from './state.js';
import { showHint } from './utils.js';

export function toggleOverfit() {
  state.isOverfit = !state.isOverfit;
  container.classList.toggle('overfit', state.isOverfit);
  iconContain.style.display = state.isOverfit ? 'none' : '';
  iconCover.style.display   = state.isOverfit ? '' : 'none';
  showHint(state.isOverfit ? 'Zoom: Rellenar' : 'Zoom: Ajustar');
}

export function initOverfit() {
  if (btnOverfit) {
    btnOverfit.addEventListener('click', e => { 
      e.stopPropagation(); 
      toggleOverfit(); 
    });
  }
}
