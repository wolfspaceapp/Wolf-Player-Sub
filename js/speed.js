/* ══════════════════════════════════════
   SPEED MENU
   ══════════════════════════════════════ */

import { video, btnSpeed, speedMenu, qualityMenu } from './dom.js';
import { showHint } from './utils.js';

export function initSpeed() {
  btnSpeed.addEventListener('click', e => {
    e.stopPropagation();
    speedMenu.classList.toggle('open');
    qualityMenu.classList.remove('open');
  });

  speedMenu.querySelectorAll('button[data-speed]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const spd = parseFloat(btn.dataset.speed);
      video.playbackRate = spd;
      speedMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      speedMenu.classList.remove('open');
      showHint(`${spd}×`);
    });
  });
}
