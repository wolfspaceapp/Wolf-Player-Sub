/* ══════════════════════════════════════
   VIDEO LOADERS (HLS, FLV, DASH, WebTorrent)
   ══════════════════════════════════════ */

import { video, videoTitle, qualityMenu } from './dom.js';
import { state } from './state.js';
import { showHint } from './utils.js';
import { buildQualityMenu, buildQualityMenuDash, updateQualityActive, rebindQualityAuto } from './quality.js';

export function destroyAll() {
  if (state.hlsInstance)  { state.hlsInstance.destroy();  state.hlsInstance  = null; }
  if (state.flvInstance)  { state.flvInstance.destroy();   state.flvInstance  = null; }
  if (state.dashInstance) { state.dashInstance.reset();    state.dashInstance = null; }
  if (state.wtInstance)   { state.wtInstance.destroy();    state.wtInstance   = null; }
  video.src = '';
  video.load();
  qualityMenu.innerHTML = '<div class="menu-label">Calidad</div><button data-level="-1" class="active">Auto</button>';
  rebindQualityAuto();
}

export function loadSource(url) {
  if (!url) return;
  destroyAll();
  videoTitle.textContent = decodeURIComponent(url.split('/').pop().split('?')[0]) || url;

  if      (/^magnet:|\.torrent$/i.test(url)) loadTorrent(url);
  else if (/\.m3u8(\?|$)/i.test(url))        loadHLS(url);
  else if (/\.flv(\?|$)/i.test(url))         loadFLV(url);
  else if (/\.mpd(\?|$)/i.test(url))         loadDASH(url);
  else { video.src = url; video.play().catch(() => {}); }
}

export function loadHLS(url) {
  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    state.hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
    state.hlsInstance.loadSource(url);
    state.hlsInstance.attachMedia(video);
    state.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    state.hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_, d) => updateQualityActive(d.level));
    state.hlsInstance.on(Hls.Events.MANIFEST_LOADED, (_, d) => buildQualityMenu(d.levels));
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url; video.play().catch(() => {});
  }
}

export function loadFLV(url) {
  if (typeof flvjs !== 'undefined' && flvjs.isSupported()) {
    state.flvInstance = flvjs.createPlayer({ type: 'flv', url });
    state.flvInstance.attachMediaElement(video);
    state.flvInstance.load(); 
    state.flvInstance.play();
  }
}

export function loadDASH(url) {
  if (typeof dashjs !== 'undefined') {
    state.dashInstance = dashjs.MediaPlayer().create();
    state.dashInstance.initialize(video, url, true);
    state.dashInstance.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      buildQualityMenuDash(state.dashInstance.getBitrateInfoListFor('video'));
    });
  }
}

export function loadTorrent(magnetOrUrl) {
  if (typeof WebTorrent === 'undefined') { alert('WebTorrent no disponible'); return; }
  state.wtInstance = new WebTorrent();
  showHint('⏳ Conectando peers…');
  state.wtInstance.add(magnetOrUrl, torrent => {
    const file = torrent.files.find(f => /\.(mp4|mkv|webm|mov|avi)$/i.test(f.name));
    if (!file) { showHint('No se encontró video'); return; }
    videoTitle.textContent = file.name;
    file.renderTo(video, { autoplay: true });
  });
}
