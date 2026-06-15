/* ══════════════════════════════════════
   EXTRA BUTTONS (Lock, Episodes, Next Ep)
   ══════════════════════════════════════ */

import { btnLock, btnEpisodes, btnNextEp } from './dom.js';
import { showHint } from './utils.js';

export function initExtraButtons() {
  if (btnLock) {
    btnLock.addEventListener('click', e => {
      e.stopPropagation();
      showHint('🔒 Lock');
    });
  }

  if (btnEpisodes) {
    btnEpisodes.addEventListener('click', e => {
      e.stopPropagation();
      showHint('📺 Episodes');
    });
  }

  if (btnNextEp) {
    btnNextEp.addEventListener('click', e => {
      e.stopPropagation();
      showHint('⏭️ Next Episode');
    });
  }
}
