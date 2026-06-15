/* ══════════════════════════════════════
   SKIP CONTROLS
   ══════════════════════════════════════ */

import { video, btnBack, btnFwd, btnTitleBack } from './dom.js';
import { showHint } from './utils.js';

export function initSkip() {
  btnBack.addEventListener('click', e => { 
    e.stopPropagation(); 
    video.currentTime -= 10; 
    showHint('⏪ −10s'); 
  });
  
  btnFwd.addEventListener('click', e => { 
    e.stopPropagation(); 
    video.currentTime += 10; 
    showHint('⏩ +10s'); 
  });
  
  btnTitleBack.addEventListener('click', e => { 
    e.stopPropagation(); 
    history.back(); 
  });
}
