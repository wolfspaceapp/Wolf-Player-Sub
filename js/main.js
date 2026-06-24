/* ══════════════════════════════════════
   MAIN - Entry Point
   ══════════════════════════════════════ */

import { initUI } from './ui.js';
import { initPlayback } from './playback.js';
import { initSpinner } from './spinner.js';
import { initProgress, updateProgress } from './progress.js';
import { initSkip } from './skip.js';
import { initVolume } from './volume.js';
import { initSpeed } from './speed.js';
import { initQualityMenu } from './quality-menu.js';
import { initOverfit } from './overfit.js';
import { initPip } from './pip.js';
import { initFullscreen } from './fullscreen.js';
import { initKeyboard } from './keyboard.js';
import { loadSource } from './loaders.js';
import { rebindQualityAuto } from './quality.js';
import { initExtraButtons } from './extra-buttons.js';
import { initBrightness } from './brightness.js';

(function () {
  'use strict';

  // Initialize all modules
  initUI();
  initPlayback();
  initSpinner();
  initProgress();
  initSkip();
  initVolume();
  initSpeed();
  initQualityMenu();
  initOverfit();
  initPip();
  initFullscreen();
  initKeyboard();
  initExtraButtons();
  initBrightness();

  // Load video from URL parameter
  const autoSrc = new URLSearchParams(location.search).get('src');
  if (autoSrc) loadSource(autoSrc);

  // Initial setup
  rebindQualityAuto();
  updateProgress();

})();
