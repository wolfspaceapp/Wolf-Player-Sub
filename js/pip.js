/* ══════════════════════════════════════
   PICTURE-IN-PICTURE
   ══════════════════════════════════════ */

import { video, btnPip, btnPipTop } from './dom.js';

export async function togglePip() {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (video.requestPictureInPicture) {
      await video.requestPictureInPicture();
    }
  } catch (err) { 
    console.warn('PiP:', err); 
  }
}

export function initPip() {
  btnPip.addEventListener('click', e => { 
    e.stopPropagation(); 
    togglePip(); 
  });
  
  if (btnPipTop) {
    btnPipTop.addEventListener('click', e => { 
      e.stopPropagation(); 
      togglePip(); 
    });
  }
}
