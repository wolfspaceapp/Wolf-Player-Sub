/* ══════════════════════════════════════
   SPINNER
   ══════════════════════════════════════ */

import { video, spinner } from './dom.js';

export function initSpinner() {
  video.addEventListener('waiting', () => spinner.classList.add('active'));
  video.addEventListener('playing', () => spinner.classList.remove('active'));
  video.addEventListener('canplay', () => spinner.classList.remove('active'));
}
