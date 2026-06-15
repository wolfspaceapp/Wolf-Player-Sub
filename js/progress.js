/* ══════════════════════════════════════
   PROGRESS BAR
   ══════════════════════════════════════ */

import { video, progressWrap, progressFill, progressBuffered, progressThumb, progressTooltip, timeDisplay } from './dom.js';
import { state } from './state.js';
import { fmt } from './utils.js';

export function updateProgress() {
  const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  timeDisplay.textContent  = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
}

export function updateBuffered() {
  if (!video.duration) return;
  try {
    const buf = video.buffered;
    if (buf.length) progressBuffered.style.width = (buf.end(buf.length-1) / video.duration * 100) + '%';
  } catch (_) {}
}

export function seekTo(e) {
  const rect = progressWrap.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const pct = Math.max(0, Math.min(1, x / rect.width));
  if (video.duration) video.currentTime = pct * video.duration;
}

export function initProgress() {
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('progress', updateBuffered);
  video.addEventListener('durationchange', updateProgress);

  progressWrap.addEventListener('mousedown', e => { 
    state.isDragging = true; 
    seekTo(e); 
  });
  
  progressWrap.addEventListener('touchstart', e => { 
    state.isDragging = true; 
    seekTo(e); 
  }, { passive: true });

  document.addEventListener('mousemove', e => {
    if (!state.isDragging) return;
    const rect = progressWrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, (e.touches ? e.touches[0].clientX : e.clientX) - rect.left));
    const pct = x / rect.width;
    
    // Update UI only
    progressFill.style.width = (pct * 100) + '%';
    progressThumb.style.left = (pct * 100) + '%';
    progressTooltip.style.left = x + 'px';
    progressTooltip.textContent = fmt(pct * (video.duration || 0));
  });

  document.addEventListener('touchmove', e => {
    if (!state.isDragging) return;
    const rect = progressWrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
    const pct = x / rect.width;

    // Update UI only
    progressFill.style.width = (pct * 100) + '%';
    progressThumb.style.left = (pct * 100) + '%';
    progressTooltip.style.left = x + 'px';
    progressTooltip.textContent = fmt(pct * (video.duration || 0));
  }, { passive: true });
  
  document.addEventListener('mouseup',  (e) => { 
    if (state.isDragging) {
      state.isDragging = false; 
      seekTo(e);
    }
  });

  document.addEventListener('touchend', (e) => { 
    if (state.isDragging) {
      state.isDragging = false; 
      const rect = progressWrap.getBoundingClientRect();
      const x = (e.changedTouches ? e.changedTouches[0].clientX : 0) - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      if (video.duration) video.currentTime = pct * video.duration;
    }
  });

  progressWrap.addEventListener('mousemove', e => {
    const rect = progressWrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    progressTooltip.style.left = x + 'px';
    progressTooltip.textContent = fmt((x / rect.width) * (video.duration || 0));
  });
}
