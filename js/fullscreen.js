/* ══════════════════════════════════════
   FULLSCREEN
   ══════════════════════════════════════ */

import { wrapper, btnFullscreen, iconExpand, iconCompress, fsLabel } from './dom.js';

export function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    (wrapper.requestFullscreen || wrapper.webkitRequestFullscreen).call(wrapper);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }
}

export function onFsChange() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  iconExpand.style.display   = isFs ? 'none' : '';
  iconCompress.style.display = isFs ? '' : 'none';
  if (fsLabel) fsLabel.textContent = isFs ? 'Salir' : 'Pantalla';
}

export function initFullscreen() {
  btnFullscreen.addEventListener('click', e => { 
    e.stopPropagation(); 
    toggleFullscreen(); 
  });

  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
}
