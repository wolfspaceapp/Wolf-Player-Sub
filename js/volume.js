/* ══════════════════════════════════════
   VOLUME CONTROLS
   ══════════════════════════════════════ */

import { video, btnMute, iconVol, iconMute } from './dom.js';

export function setVolume(v) {
  video.volume = v;
  video.muted  = v === 0;
  updateVolIcons();
}

export function toggleMute() {
  video.muted = !video.muted;
  if (!video.muted && video.volume === 0) setVolume(0.5);
  updateVolIcons();
}

export function updateVolIcons() {
  const muted = video.muted || video.volume === 0;
  iconVol.style.display   = muted ? 'none' : '';
  iconMute.style.display  = muted ? '' : 'none';
}

export function initVolume() {
  btnMute.addEventListener('click', e => { e.stopPropagation(); toggleMute(); });
  updateVolIcons();
}
