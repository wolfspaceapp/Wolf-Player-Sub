/* ══════════════════════════════════════
   PLAYBACK CONTROLS
   ══════════════════════════════════════ */

import { video, container, btnPlay, iconPlay, iconPause } from './dom.js';
import { pulseTap, showHint } from './utils.js';
import { state } from './state.js';
import { showUI } from './ui.js';

export function togglePlay() {
  if (video.paused) video.play(); 
  else video.pause();
  pulseTap();
}

export function syncPlayIcons(playing) {
  iconPlay.style.display   = playing ? 'none' : '';
  iconPause.style.display  = playing ? '' : 'none';
}

export function initPlayback() {
  video.addEventListener('play',  () => { 
    syncPlayIcons(true);  
    container.classList.remove('show-ui'); 
  });
  
  video.addEventListener('pause', () => { 
    syncPlayIcons(false); 
    container.classList.add('show-ui'); 
  });
  
  video.addEventListener('ended', () => syncPlayIcons(false));

  btnPlay.addEventListener('click', e => { 
    e.stopPropagation(); 
    togglePlay(); 
  });

  container.addEventListener('click', e => {
    if (e.target === container || e.target === video) togglePlay();
  });

  // Double-tap seek on mobile
  container.addEventListener('touchend', e => {
    state.tapCount++;
    if (state.tapCount === 1) {
      state.tapTimer = setTimeout(() => { 
        state.tapCount = 0; 
        showUI(); 
      }, 260);
    } else if (state.tapCount === 2) {
      clearTimeout(state.tapTimer); 
      state.tapCount = 0;
      const rect = container.getBoundingClientRect();
      const x = e.changedTouches[0].clientX - rect.left;
      if (x < rect.width / 2) { 
        video.currentTime -= 10; 
        showHint('⏪ −10s'); 
      } else { 
        video.currentTime += 10; 
        showHint('⏩ +10s'); 
      }
    }
  });
}
