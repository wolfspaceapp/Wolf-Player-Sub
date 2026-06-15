/* ══════════════════════════════════════
   BRIGHTNESS CONTROL
   ══════════════════════════════════════ */

import { video } from './dom.js';
import { showHint } from './utils.js';

const btnBrightness = document.getElementById('btnBrightness');
const brightnessMenu = document.getElementById('brightnessMenu');

export function initBrightness() {
  if (!btnBrightness || !brightnessMenu) return;

  btnBrightness.addEventListener('click', e => {
    e.stopPropagation();
    brightnessMenu.classList.toggle('open');
    document.getElementById('speedMenu')?.classList.remove('open');
    document.getElementById('qualityMenu')?.classList.remove('open');
  });

  brightnessMenu.querySelectorAll('button[data-brightness]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const brightness = parseFloat(btn.dataset.brightness);
      setBrightness(brightness);
      brightnessMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      brightnessMenu.classList.remove('open');
      showHint(`☀️ Brillo: ${Math.round(brightness * 100)}%`);
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    brightnessMenu.classList.remove('open');
  });
}

function setBrightness(value) {
  video.style.filter = `brightness(${value})`;
}
