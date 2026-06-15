/* ══════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════ */

import { video } from './dom.js';
import { togglePlay } from './playback.js';
import { setVolume, toggleMute } from './volume.js';
import { toggleFullscreen } from './fullscreen.js';
import { togglePip } from './pip.js';
import { showHint } from './utils.js';

export function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    
    switch (e.code) {
      case 'Space': 
      case 'KeyK':
        e.preventDefault(); 
        togglePlay();
        showHint(video.paused ? '⏸' : '▶'); 
        break;
        
      case 'ArrowLeft':
        e.preventDefault(); 
        video.currentTime -= 10; 
        showHint('⏪ −10s'); 
        break;
        
      case 'ArrowRight':
        e.preventDefault(); 
        video.currentTime += 10; 
        showHint('⏩ +10s'); 
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const newVolUp = Math.min(1, video.volume + 0.1);
        setVolume(newVolUp);
        showHint(`🔊 ${Math.round(newVolUp * 100)}%`); 
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const newVolDown = Math.max(0, video.volume - 0.1);
        setVolume(newVolDown);
        showHint(`🔉 ${Math.round(newVolDown * 100)}%`); 
        break;
        
      case 'KeyM':
        toggleMute();
        showHint(video.muted ? '🔇 Mute' : '🔊 Unmute'); 
        break;
        
      case 'KeyF': 
        toggleFullscreen(); 
        break;
        
      case 'KeyI': 
        togglePip(); 
        break;
    }
  });
}
