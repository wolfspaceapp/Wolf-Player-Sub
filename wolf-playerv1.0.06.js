/* ─────────────────────────────────────────
   WOLF PLAYER  –  HLS · MP4 · FLV · DASH · WebTorrent
   Modern Video Player Library
   
   Compatible con:
   - HLS (HTTP Live Streaming) via hls.js
   - DASH (Dynamic Adaptive Streaming) via dash.js
   - FLV (Flash Video) via flv.js
   - WebTorrent (P2P streaming) via webtorrent
   - MP4, WebM, Ogg (nativo HTML5)
   ───────────────────────────────────────── */

class WolfPlayer {
  // CDN URLs para librerías de streaming
  static CDN = {
    HLS: 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js',
    FLV: 'https://cdn.jsdelivr.net/npm/flv.js@latest/dist/flv.min.js',
    DASH: 'https://cdn.jsdelivr.net/npm/dashjs@latest/dist/dash.all.min.js',
    WEBTORRENT: 'https://cdn.jsdelivr.net/webtorrent@latest/webtorrent.min.js'
  };

  // Estado de carga de librerías
  static loadedLibraries = {
    hls: false,
    flv: false,
    dash: false,
    webtorrent: false
  };

  // Promesas de carga en progreso
  static loadingPromises = {};

  constructor(selector, options = {}) {
    // Default options
    this.options = {
      src: options.src || '',
      poster: options.poster || '',
      autoplay: options.autoplay || false,
      color: options.color || '#00e676',
      title: options.title || '',
      controls: options.controls !== false,
      keyboard: options.keyboard !== false,
      responsive: options.responsive !== false,
      volume: options.volume || 1,
      muted: options.muted || false,
      autoLoadLibraries: options.autoLoadLibraries !== false, // Cargar librerías automáticamente
      ...options
    };

    // Get container
    this.container = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;

    if (!this.container) {
      throw new Error('Wolf Player: Container not found');
    }

    // Initialize
    this.init();
  }

  // Cargar librería desde CDN
  static loadLibrary(name, url) {
    // Si ya está cargada, resolver inmediatamente
    if (this.loadedLibraries[name]) {
      return Promise.resolve();
    }

    // Si ya está en proceso de carga, retornar la promesa existente
    if (this.loadingPromises[name]) {
      return this.loadingPromises[name];
    }

    // Crear nueva promesa de carga
    this.loadingPromises[name] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        this.loadedLibraries[name] = true;
        delete this.loadingPromises[name];
        console.log(`Wolf Player: ${name} library loaded`);
        resolve();
      };
      
      script.onerror = () => {
        delete this.loadingPromises[name];
        console.warn(`Wolf Player: Failed to load ${name} library from ${url}`);
        reject(new Error(`Failed to load ${name}`));
      };
      
      document.head.appendChild(script);
    });

    return this.loadingPromises[name];
  }

  // Detectar tipo de fuente y cargar librería necesaria
  async loadRequiredLibrary(url) {
    if (!this.options.autoLoadLibraries) {
      return;
    }

    try {
      if (/\.m3u8(\?|$)/i.test(url)) {
        // HLS
        if (typeof Hls === 'undefined') {
          await WolfPlayer.loadLibrary('hls', WolfPlayer.CDN.HLS);
        }
      } else if (/\.flv(\?|$)/i.test(url)) {
        // FLV
        if (typeof flvjs === 'undefined') {
          await WolfPlayer.loadLibrary('flv', WolfPlayer.CDN.FLV);
        }
      } else if (/\.mpd(\?|$)/i.test(url)) {
        // DASH
        if (typeof dashjs === 'undefined') {
          await WolfPlayer.loadLibrary('dash', WolfPlayer.CDN.DASH);
        }
      } else if (/^magnet:|\.torrent$/i.test(url)) {
        // WebTorrent
        if (typeof WebTorrent === 'undefined') {
          await WolfPlayer.loadLibrary('webtorrent', WolfPlayer.CDN.WEBTORRENT);
        }
      }
    } catch (error) {
      console.error('Wolf Player: Error loading library', error);
    }
  }

  init() {
    // Si el contenedor está vacío, crear la estructura HTML
    if (!this.container.querySelector('#playerContainer')) {
      this.createPlayerStructure();
    }
    
    this.setupDOM();
    this.setupState();
    this.applyColor(this.options.color);
    this.setupEvents();
    
    if (this.options.poster) {
      this.setPoster(this.options.poster);
    }
    
    this.video.volume = this.options.volume;
    this.video.muted = this.options.muted;
    
    // Actualizar iconos de mute si está muteado por defecto
    if (this.options.muted) {
      this.updateVolIcons();
    }
    
    // Configurar título si existe
    if (this.options.title && this.options.title !== 'Sin título') {
      this.videoTitle.textContent = this.options.title;
      this.titleBar.style.display = 'flex';
    } else {
      this.videoTitle.textContent = '';
      this.titleBar.style.display = 'none';
    }
    
    // Cargar fuente si existe
    if (this.options.src) {
      this.loadSource(this.options.src);
    }
  }

  // Crear estructura HTML del reproductor
  createPlayerStructure() {
    this.container.innerHTML = `
  <!-- ══ VIDEO CONTAINER ══ -->
  <div class="player-container" id="playerContainer">
    <video id="video" playsinline preload="metadata" crossorigin="anonymous"></video>
    <div class="video-poster" id="videoPoster"></div>

    <!-- ══ TITLE BAR ══ -->
    <div class="title-bar" id="titleBar">
      <span id="videoTitle">Sin título</span>
    </div>

    <!-- SPINNER -->
    <div class="spinner" id="spinner">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
        <circle cx="32" cy="32" r="28" fill="none" stroke="#00e676" stroke-width="4"
          stroke-dasharray="140 50" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- PLAY PULSE -->
    <div class="overlay">
      <div class="play-pulse" id="playPulse">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>

    <!-- KBD HINT -->
    <div class="kbd-hint" id="kbdHint"></div>

    <div class="gradient-top"></div>
    <div class="gradient-bottom"></div>
    <div class="gradient-right"></div>

    <!-- ══ BOTONES SUPERIORES DERECHA ══ -->
    <div class="top-right-controls">
      <!-- VOLUMEN/MUTE -->
      <button class="adapt-btn" id="btnMute" title="Silenciar">
        <svg id="iconVol" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        <svg id="iconMute" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
      </button>
      
      <!-- ADAPTAR -->
      <button class="adapt-btn" id="btnOverfit" title="Adaptar pantalla">
        <svg id="iconContain" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
        <svg id="iconCover" viewBox="0 0 24 24" style="display:none"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
      </button>


    </div>

    <!-- ══ CENTER CONTROLS ══ -->
    <div class="center-controls" id="centerControls">
      <button class="ctrl-btn cc-btn" id="btnBack" title="−10s">
        <svg viewBox="0 0 24 24">
          <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
        <span class="skip-text">10</span>
      </button>
      <button class="ctrl-btn cc-btn cc-play" id="btnPlay" title="Play/Pause">
        <svg id="iconPlay" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        <svg id="iconPause" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      </button>
      <button class="ctrl-btn cc-btn" id="btnFwd" title="+10s">
        <svg viewBox="0 0 24 24">
          <path d="M11.99 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
        </svg>
        <span class="skip-text">10</span>
      </button>
    </div>

    <!-- ══ BOTTOM CONTROLS ══ -->
    <div class="controls" id="controls">

      <!-- PROGRESS -->
      <div class="progress-wrap" id="progressWrap">
        <div class="progress-times">
          <span class="progress-time-current" id="progressTimeCurrent">0:00</span>
          <span class="progress-time-duration" id="progressTimeDuration">0:00</span>
        </div>
        <div class="progress-track">
          <div class="progress-buffered" id="progressBuffered"></div>
          <div class="progress-fill" id="progressFill"></div>
        </div>
        <div class="progress-thumb" id="progressThumb"></div>
        <div class="progress-tooltip" id="progressTooltip">0:00</div>
      </div>

      <!-- CTRL ROW: velocidad · bloquear · calidad · spacer · volumen · pantalla completa -->
      <div class="ctrl-row">

        <!-- VELOCIDAD -->
        <div class="select-btn-wrap">
          <button class="opt-btn" tabindex="-1">
            <svg viewBox="0 0 24 24"><path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/></svg>
            <span id="labelSpeed">1×</span>
          </button>
          <select class="select-overlay" id="selectSpeed">
            <option value="0.5">0.5×</option>
            <option value="0.75">0.75×</option>
            <option value="1" selected>1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </div>

        <!-- CALIDAD -->
        <div class="select-btn-wrap">
          <button class="opt-btn" tabindex="-1">
            <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
            <span id="labelQuality">Auto</span>
          </button>
          <select class="select-overlay" id="selectQuality">
            <option value="-1" selected>Auto</option>
          </select>
        </div>

        <!-- BRILLO -->
        <button class="opt-btn" id="btnBrightness">
          <svg viewBox="0 0 24 24"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>
          <span id="labelBrightness">100%</span>
        </button>

        <!-- CAPTURA -->
        <button class="opt-btn" id="btnScreenshot" title="Capturar fotograma">
          <svg viewBox="0 0 24 24"><path d="M4 4h7V2H4c-1.1 0-2 .9-2 2v7h2V4zm6 9l-4 5h12l-3-4-2.03 2.71L10 13zm7-4.5c0-.83-.67-1.5-1.5-1.5S14 7.67 14 8.5 14.67 10 15.5 10 17 9.33 17 8.5zM20 2h-7v2h7v7h2V4c0-1.1-.9-2-2-2zm0 18h-7v2h7c1.1 0 2-.9 2-2v-7h-2v7zM4 13H2v7c0 1.1.9 2 2 2h7v-2H4v-7z"/></svg>
          <span>Foto</span>
        </button>

        <div class="spacer"></div>

        <!-- PiP -->
        <button class="opt-btn" id="btnPip" title="Ventana flotante (PiP)">
          <svg viewBox="0 0 24 24"><path d="M19 7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 10h-8v-5h8v5z"/></svg>
          <span>PiP</span>
        </button>

        <!-- PANTALLA COMPLETA -->
        <button class="opt-btn" id="btnFullscreen">
          <svg id="iconExpand" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
          <svg id="iconCompress" viewBox="0 0 24 24" style="display:none"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
          <span id="fsLabel">Pantalla completa</span>
        </button>

      </div>
    </div>
  </div>

  <!-- MODAL BRILLO -->
  <div class="modal-backdrop" id="brightnessModal">
    <div class="modal-panel" role="dialog" aria-label="Brillo">
      <div class="modal-header">
        <svg viewBox="0 0 24 24"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>
        <span>Brillo</span>
        <button class="modal-close" id="btnBrightnessClose" aria-label="Cerrar">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <!-- DIAL BRÚJULA -->
        <div class="brightness-dial-wrap">
          <svg class="brightness-dial-svg" id="brightnessDial" viewBox="0 0 200 200" touch-action="none">
            <!-- Pista de fondo -->
            <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14" stroke-linecap="round"
              stroke-dasharray="408 490" stroke-dashoffset="-41" />
            <!-- Pista activa -->
            <circle cx="100" cy="100" r="78" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round"
              id="dialArc"
              stroke-dasharray="0 490" stroke-dashoffset="-41"
              style="filter: drop-shadow(0 0 8px var(--accent-glow))" />
            <!-- Marcas de tick -->
            <g id="dialTicks" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"></g>
            <!-- Valor central -->
            <text x="100" y="93" text-anchor="middle" fill="var(--accent)" font-size="34" font-weight="900" font-family="inherit" id="dialText">100</text>
            <text x="100" y="113" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="11" font-weight="600" font-family="inherit">BRILLO %</text>
            <!-- Indicador min/max -->
            <text x="26" y="164" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="10" font-family="inherit">10</text>
            <text x="174" y="164" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="10" font-family="inherit">200</text>
          </svg>
        </div>
        <!-- Presets rápidos -->
        <div class="brightness-presets">
          <button data-val="50">50%</button>
          <button data-val="75">75%</button>
          <button data-val="100" class="active">100%</button>
          <button data-val="150">150%</button>
          <button data-val="200">200%</button>
        </div>
        <!-- Hidden input para compatibilidad interna -->
        <input type="range" id="brightnessSlider" class="brightness-slider-hidden"
               min="10" max="200" step="5" value="100" />
        <div class="brightness-value" id="brightnessValue" style="display:none">100%</div>
      </div>
    </div>
  </div>
`;
  }

  setupDOM() {
    // Get all DOM elements from existing HTML structure
    this.wrapper = this.container;
    this.playerContainer = this.container.querySelector('#playerContainer');
    this.video = this.container.querySelector('#video');
    this.videoPoster = this.container.querySelector('#videoPoster');
    this.spinner = this.container.querySelector('#spinner');
    this.playPulse = this.container.querySelector('#playPulse');
    this.kbdHint = this.container.querySelector('#kbdHint');
    this.titleBar = this.container.querySelector('#titleBar');
    this.videoTitle = this.container.querySelector('#videoTitle');
    
    this.btnPlay = this.container.querySelector('#btnPlay');
    this.iconPlay = this.container.querySelector('#iconPlay');
    this.iconPause = this.container.querySelector('#iconPause');
    
    this.btnBack = this.container.querySelector('#btnBack');
    this.btnFwd = this.container.querySelector('#btnFwd');
    
    this.btnMute = this.container.querySelector('#btnMute');
    this.iconVol = this.container.querySelector('#iconVol');
    this.iconMute = this.container.querySelector('#iconMute');
    
    this.progressWrap = this.container.querySelector('#progressWrap');
    this.progressFill = this.container.querySelector('#progressFill');
    this.progressBuffered = this.container.querySelector('#progressBuffered');
    this.progressThumb = this.container.querySelector('#progressThumb');
    this.progressTooltip = this.container.querySelector('#progressTooltip');
    
    this.selectSpeed = this.container.querySelector('#selectSpeed');
    this.selectQuality = this.container.querySelector('#selectQuality');
    this.labelSpeed = this.container.querySelector('#labelSpeed');
    this.labelQuality = this.container.querySelector('#labelQuality');
    this.labelBrightness = this.container.querySelector('#labelBrightness');
    this.btnBrightness = this.container.querySelector('#btnBrightness');
    this.brightnessModal = this.container.querySelector('#brightnessModal');
    this.btnBrightnessClose = this.container.querySelector('#btnBrightnessClose');
    this.brightnessSlider = this.container.querySelector('#brightnessSlider');
    this.brightnessValue = this.container.querySelector('#brightnessValue');
    this.brightnessDial = this.container.querySelector('#brightnessDial');
    this.dialArc = this.container.querySelector('#dialArc');
    this.dialText = this.container.querySelector('#dialText');
    this.dialTicks = this.container.querySelector('#dialTicks');
    
    this.btnOverfit = this.container.querySelector('#btnOverfit');
    this.iconContain = this.container.querySelector('#iconContain');
    this.iconCover = this.container.querySelector('#iconCover');
    
    this.btnFullscreen = this.container.querySelector('#btnFullscreen');
    this.iconExpand = this.container.querySelector('#iconExpand');
    this.iconCompress = this.container.querySelector('#iconCompress');
    this.fsLabel = this.container.querySelector('#fsLabel');

    // Nuevas funciones
    this.btnScreenshot = this.container.querySelector('#btnScreenshot');
    this.btnPip = this.container.querySelector('#btnPip');
  }

  setupState() {
    this.hlsInstance = null;
    this.flvInstance = null;
    this.dashInstance = null;
    this.wtInstance = null;
    this.hintTimer = null;
    this.isDragging = false;
    this.isOverfit = false;
    this.currentBrightness = 1;
    this.hideUITimer = null;
    this.mouseMoveThrottle = null;
    this.ignoreMouseMove = false;
    this.lastTouchTime = 0;
    this.tapTimer = null;
    this.tapCount = 0;
    this.isChangingQuality = false;
    this.spinnerTimeout = null;
    this.spinnerDebounce = null;
    this.isPip = false;
  }

  // Apply custom color theme
  applyColor(color) {
    const root = document.documentElement;
    const rgb = this.hexToRgb(color);
    
    // Actualizar todas las variables de color premium
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-dim', this.adjustBrightness(color, -20));
    root.style.setProperty('--accent-glow', `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
    root.style.setProperty('--accent-soft', `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`);
    root.style.setProperty('--border-accent', `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
    
    // Actualizar shadow-glow premium
    root.style.setProperty('--shadow-glow', `0 0 20px rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 230, b: 118 };
  }

  adjustBrightness(hex, percent) {
    const rgb = this.hexToRgb(hex);
    const adjust = (val) => Math.max(0, Math.min(255, val + (val * percent / 100)));
    return `#${[rgb.r, rgb.g, rgb.b].map(v => adjust(v).toString(16).padStart(2, '0')).join('')}`;
  }

  setupEvents() {
    // Ocultar poster cuando el video empiece a reproducirse
    this.video.addEventListener('play', () => {
      if (this.videoPoster) {
        this.videoPoster.classList.add('hidden');
      }
    });
    
    // Mostrar poster cuando el video termine
    this.video.addEventListener('ended', () => {
      if (this.videoPoster && this.options.poster) {
        this.videoPoster.classList.remove('hidden');
      }
    });

    // UI auto-hide
    this.playerContainer.addEventListener('mousemove', () => {
      if (Date.now() - this.lastTouchTime < 1000) return;
      if (this.ignoreMouseMove) return;
      if (!this.mouseMoveThrottle) {
        this.showUI();
        this.mouseMoveThrottle = setTimeout(() => {
          this.mouseMoveThrottle = null;
        }, 150);
      }
    });

    this.video.addEventListener('play', () => this.showUI());
    this.video.addEventListener('pause', () => {
      this.playerContainer.classList.add('show-ui');
      clearTimeout(this.hideUITimer);
    });
    this.video.addEventListener('ended', () => {
      this.playerContainer.classList.add('show-ui');
      clearTimeout(this.hideUITimer);
    });

    // Play/Pause
    this.video.addEventListener('play', () => this.syncPlayIcons(true));
    this.video.addEventListener('pause', () => this.syncPlayIcons(false));
    this.video.addEventListener('ended', () => this.syncPlayIcons(false));
    this.btnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlay();
      this.btnPlay.blur();
    });

    // Container click
    this.playerContainer.addEventListener('touchstart', () => {
      this.lastTouchTime = Date.now();
    }, { passive: true });

    this.playerContainer.addEventListener('click', (e) => {
      // Prevenir si fue un touch reciente
      if (Date.now() - this.lastTouchTime < 1000) return;
      // Prevenir si el modal está abierto
      if (this.brightnessModal.classList.contains('open')) return;
      
      const isControl = e.target.closest('button, .controls, .center-controls, .top-right-controls, .title-bar, .progress-wrap');
      if (!isControl) {
        // Alternar UI
        if (this.playerContainer.classList.contains('show-ui')) {
          this.hideUI();
        } else {
          this.showUI();
        }
      }
    });

    // Double-tap seek
    this.playerContainer.addEventListener('touchend', (e) => {
      this.lastTouchTime = Date.now();
      this.tapCount++;
      if (this.tapCount === 1) {
        this.tapTimer = setTimeout(() => {
          this.tapCount = 0;
          const isControl = e.target.closest('button, .controls, .center-controls, .top-right-controls, .title-bar, .progress-wrap');
          if (!isControl && !this.brightnessModal.classList.contains('open')) {
            // Alternar UI con toque simple
            if (this.playerContainer.classList.contains('show-ui')) {
              this.hideUI();
            } else {
              this.showUI();
            }
          }
        }, 260);
      } else if (this.tapCount === 2) {
        clearTimeout(this.tapTimer);
        this.tapCount = 0;
        const rect = this.playerContainer.getBoundingClientRect();
        const x = e.changedTouches[0].clientX - rect.left;
        if (x < rect.width / 2) {
          this.video.currentTime -= 10;
          this.showHint('−10s', 'left');
        } else {
          this.video.currentTime += 10;
          this.showHint('+10s', 'right');
        }
      }
    });

    // Spinner - Optimizado para móviles y HLS
    this.video.addEventListener('waiting', () => {
      // Solo mostrar spinner si realmente está esperando por más de 200ms
      clearTimeout(this.spinnerTimeout);
      this.spinnerDebounce = setTimeout(() => {
        this.spinner.classList.add('active');
      }, 200);
      
      // Timer de seguridad: ocultar spinner automáticamente
      this.spinnerTimeout = setTimeout(() => {
        this.spinner.classList.remove('active');
        console.warn('Wolf Player: Spinner auto-hidden after timeout');
      }, 3000); // Reducido de 10s a 3s
    });
    
    this.video.addEventListener('playing', () => {
      clearTimeout(this.spinnerDebounce);
      clearTimeout(this.spinnerTimeout);
      this.spinner.classList.remove('active');
    });
    
    this.video.addEventListener('canplay', () => {
      clearTimeout(this.spinnerDebounce);
      clearTimeout(this.spinnerTimeout);
      this.spinner.classList.remove('active');
    });
    
    this.video.addEventListener('canplaythrough', () => {
      clearTimeout(this.spinnerDebounce);
      clearTimeout(this.spinnerTimeout);
      this.spinner.classList.remove('active');
    });
    
    this.video.addEventListener('seeking', () => {
      // Solo mostrar spinner al buscar si tarda más de 300ms
      clearTimeout(this.spinnerDebounce);
      this.spinnerDebounce = setTimeout(() => {
        this.spinner.classList.add('active');
      }, 300);
      
      // Timer de seguridad más corto para seeking
      clearTimeout(this.spinnerTimeout);
      this.spinnerTimeout = setTimeout(() => {
        this.spinner.classList.remove('active');
      }, 2000); // Reducido de 5s a 2s
    });
    
    this.video.addEventListener('seeked', () => {
      clearTimeout(this.spinnerDebounce);
      // Ocultar spinner inmediatamente cuando termine de buscar
      setTimeout(() => {
        if (this.video.readyState >= 2) { // HAVE_CURRENT_DATA o superior
          clearTimeout(this.spinnerTimeout);
          this.spinner.classList.remove('active');
        }
      }, 100);
    });
    
    // Evento adicional para asegurar que se oculte el spinner
    this.video.addEventListener('timeupdate', () => {
      // Si el video está reproduciéndose, asegurar que no hay spinner
      if (!this.video.paused && !this.video.seeking && this.video.readyState >= 2) {
        this.spinner.classList.remove('active');
      }
    });

    // Progress
    this.video.addEventListener('timeupdate', () => this.updateProgress());
    this.video.addEventListener('progress', () => this.updateBuffered());
    this.video.addEventListener('durationchange', () => this.updateProgress());

    this.progressWrap.addEventListener('mousedown', (e) => {
      if (e.target === this.progressTime) return;
      this.isDragging = true;
      this.seekTo(e);
    });
    this.progressWrap.addEventListener('touchstart', (e) => {
      this.isDragging = true;
      this.seekTo(e);
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const track = this.progressWrap.querySelector('.progress-track');
      const rect = track ? track.getBoundingClientRect() : this.progressWrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const pct = x / rect.width;
      
      // Update UI only
      this.progressFill.style.width = (pct * 100) + '%';
      this.progressThumb.style.left = (pct * 100) + '%';
      this.progressTooltip.style.left = (track ? track.offsetLeft + x : x) + 'px';
      this.progressTooltip.textContent = this.fmt(pct * (this.video.duration || 0));
    });

    document.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      const track = this.progressWrap.querySelector('.progress-track');
      const rect = track ? track.getBoundingClientRect() : this.progressWrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
      const pct = x / rect.width;

      // Update UI only
      this.progressFill.style.width = (pct * 100) + '%';
      this.progressThumb.style.left = (pct * 100) + '%';
      this.progressTooltip.style.left = (track ? track.offsetLeft + x : x) + 'px';
      this.progressTooltip.textContent = this.fmt(pct * (this.video.duration || 0));
    }, { passive: true });

    document.addEventListener('mouseup', (e) => { 
      if (this.isDragging) {
        this.isDragging = false;
        this.seekTo(e);
      }
    });

    document.addEventListener('touchend', (e) => { 
      if (this.isDragging) {
        this.isDragging = false;
        // Para touch, usamos changedTouches para el seek final
        const track = this.progressWrap.querySelector('.progress-track');
        const rect = track ? track.getBoundingClientRect() : this.progressWrap.getBoundingClientRect();
        const x = (e.changedTouches ? e.changedTouches[0].clientX : 0) - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        if (this.video.duration) this.video.currentTime = pct * this.video.duration;
      }
    });

    this.progressWrap.addEventListener('mousemove', (e) => {
      const track = this.progressWrap.querySelector('.progress-track');
      const rect = track ? track.getBoundingClientRect() : this.progressWrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      this.progressTooltip.style.left = (track ? track.offsetLeft + x : x) + 'px';
      this.progressTooltip.textContent = this.fmt((x / rect.width) * (this.video.duration || 0));
    });

    // Skip buttons
    this.btnBack.addEventListener('click', (e) => {
      e.stopPropagation();
      this.video.currentTime -= 10;
      this.showHint('−10s', 'left');
      this.btnBack.blur();
    });
    this.btnFwd.addEventListener('click', (e) => {
      e.stopPropagation();
      this.video.currentTime += 10;
      this.showHint('+10s', 'right');
      this.btnFwd.blur();
    });

    // Volume
    this.btnMute.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute();
    });

    // Speed
    this.selectSpeed.addEventListener('change', () => {
      const speed = parseFloat(this.selectSpeed.value);
      
      // Mostrar spinner mientras se cambia la velocidad
      this.spinner.classList.add('active');
      
      this.video.playbackRate = speed;
      this.labelSpeed.textContent = speed === 1 ? '1×' : speed + '×';
      this.showHint(`Cambiada velocidad a ${speed}×`, 'bottom');
      
      // Ocultar spinner después de un breve momento
      setTimeout(() => {
        this.spinner.classList.remove('active');
      }, 500);
      
      document.activeElement.blur();
    });

    // Quality
    this.selectQuality.addEventListener('change', () => {
      const level = parseInt(this.selectQuality.value);
      const qualityText = this.selectQuality.options[this.selectQuality.selectedIndex].textContent;
      this.labelQuality.textContent = qualityText;
      
      // Mostrar spinner mientras se cambia la calidad
      this.spinner.classList.add('active');
      
      // Flag para controlar el spinner
      this.isChangingQuality = true;
      
      if (this.hlsInstance) {
        // El valor ya contiene el originalIndex correcto
        this.setQuality(level);
      } else if (this.dashInstance) {
        this.dashInstance.setQualityFor('video', level);
      }
      
      // Ocultar spinner después de que el video esté listo
      const hideSpinner = () => {
        if (this.isChangingQuality) {
          this.spinner.classList.remove('active');
          this.isChangingQuality = false;
        }
      };
      
      // Ocultar spinner cuando el video esté listo o después de un timeout
      const playingHandler = () => {
        hideSpinner();
        this.video.removeEventListener('playing', playingHandler);
        this.video.removeEventListener('canplay', playingHandler);
      };
      
      this.video.addEventListener('playing', playingHandler);
      this.video.addEventListener('canplay', playingHandler);
      
      // Timeout de seguridad
      setTimeout(() => {
        hideSpinner();
      }, 2000);
      
      // Mostrar hint con la calidad seleccionada
      this.showHint(`Cambiada calidad a ${qualityText}`, 'bottom');
      document.activeElement.blur();
    });

    // Brightness
    this.btnBrightness.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openBrightnessModal();
    });
    this.btnBrightnessClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeBrightnessModal();
    });
    this.brightnessModal.addEventListener('click', (e) => {
      if (e.target === this.brightnessModal) this.closeBrightnessModal();
    });
    this.brightnessSlider.addEventListener('input', () => {
      this.applyBrightness(parseInt(this.brightnessSlider.value) / 100);
    });
    this.brightnessModal.querySelectorAll('.brightness-presets button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyBrightness(parseInt(btn.dataset.val) / 100);
      });
    });
    // Dial drag (mouse + touch)
    this._dialDragging = false;
    this._dialInitAngle = 0;
    this._dialInitVal = 100;
    const getDialAngle = (e, rect) => {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const px = (e.touches ? e.touches[0].clientX : e.clientX) - cx;
      const py = (e.touches ? e.touches[0].clientY : e.clientY) - cy;
      return Math.atan2(py, px) * (180 / Math.PI);
    };
    const dialStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._dialDragging = true;
      const rect = this.brightnessDial.getBoundingClientRect();
      this._dialInitAngle = getDialAngle(e, rect);
      this._dialInitVal = this.currentBrightness * 100;
    };
    const dialMove = (e) => {
      if (!this._dialDragging) return;
      e.preventDefault();
      const rect = this.brightnessDial.getBoundingClientRect();
      let delta = getDialAngle(e, rect) - this._dialInitAngle;
      // Normalizar delta para evitar saltos al cruzar -180/180
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      // 1° = ~1.05 unidades de brillo (rango 10-200 = 190 en ~180°)
      const newVal = Math.round(Math.max(10, Math.min(200, this._dialInitVal + delta * 1.05)));
      this.applyBrightness(newVal / 100);
    };
    const dialEnd = () => { this._dialDragging = false; };
    this.brightnessDial.addEventListener('mousedown', dialStart);
    this.brightnessDial.addEventListener('touchstart', dialStart, { passive: false });
    document.addEventListener('mousemove', dialMove);
    document.addEventListener('touchmove', dialMove, { passive: false });
    document.addEventListener('mouseup', dialEnd);
    document.addEventListener('touchend', dialEnd);
    this._initDialTicks();

    // Overfit
    this.btnOverfit.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleOverfit();
    });

    // Fullscreen
    this.btnFullscreen.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });
    document.addEventListener('fullscreenchange', () => this.onFsChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFsChange());

    // Keyboard
    if (this.options.keyboard) {
      document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // Remove focus from buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('button')) {
        this.playerContainer.classList.add('no-hover');
        setTimeout(() => {
          if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
          }
        }, 100);
      }
    });
    document.addEventListener('touchend', (e) => {
      const button = e.target.closest('button');
      if (button) {
        this.playerContainer.classList.add('no-hover');
        button.blur();
        button.style.background = '';
        button.style.borderColor = '';
        button.style.color = '';
        setTimeout(() => {
          if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
          }
        }, 50);
      }
    }, { passive: false });
    this.playerContainer.addEventListener('mousemove', () => {
      this.playerContainer.classList.remove('no-hover');
    });

    this.updateVolIcons();
    this.updateProgress();
    this.syncPlayIcons(false);
    this.playerContainer.classList.add('show-ui');

    // ── Nuevas funciones ──
    // Screenshot (solo disponible en desktop)
    if (this.btnScreenshot) {
      const isDesktopForScreenshot = window.matchMedia('(min-width: 1024px)').matches;
      if (isDesktopForScreenshot) {
        this.btnScreenshot.style.display = 'flex';
        this.btnScreenshot.addEventListener('click', (e) => { e.stopPropagation(); this.takeScreenshot(); });
      } else {
        this.btnScreenshot.style.display = 'none';
      }
    }

    // PiP (solo mostrar en desktop)
    if (this.btnPip) {
      // Detectar si es desktop
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      if (isDesktop && document.pictureInPictureEnabled) {
        this.btnPip.style.display = 'flex';
        this.btnPip.addEventListener('click', (e) => { e.stopPropagation(); this.togglePip(); });
      } else {
        this.btnPip.style.display = 'none';
      }
    }
    
    this.video.addEventListener('enterpictureinpicture', () => {
      this.isPip = true;
      this.btnPip.classList.add('active');
      this.showHint('📺 Ventana flotante');
    });
    this.video.addEventListener('leavepictureinpicture', () => {
      this.isPip = false;
      this.btnPip.classList.remove('active');
      
      // Restaurar título original al salir de PiP
      if (this._originalTitle) {
        document.title = this._originalTitle;
        this._originalTitle = null;
      }
    });
  }

  // Utility methods
  fmt(s) {
    if (!isFinite(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  }

  showHint(msg, position = 'center') {
    if (msg.includes('−10s')) {
      this.kbdHint.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:4px"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg><span style="vertical-align:middle">−10s</span>';
    } else if (msg.includes('+10s')) {
      this.kbdHint.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:4px"><path d="M11.99 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg><span style="vertical-align:middle">+10s</span>';
    } else {
      this.kbdHint.textContent = msg;
    }
    this.kbdHint.classList.remove('hint-left', 'hint-right', 'hint-bottom', 'show');
    if (position === 'left') this.kbdHint.classList.add('hint-left');
    else if (position === 'right') this.kbdHint.classList.add('hint-right');
    else if (position === 'bottom') this.kbdHint.classList.add('hint-bottom');
    void this.kbdHint.offsetWidth;
    this.kbdHint.classList.add('show');
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      this.kbdHint.classList.remove('show');
    }, 1200);
  }

  pulseTap() {
    this.playPulse.classList.remove('show');
    void this.playPulse.offsetWidth;
    this.playPulse.classList.add('show');
  }

  showUI() {
    this.playerContainer.classList.add('show-ui');
    clearTimeout(this.hideUITimer);
    // Auto-ocultar solo si el video está reproduciendo
    if (!this.video.paused && !this.video.ended) {
      this.hideUITimer = setTimeout(() => {
        this.hideUI();
      }, 3000);
    }
  }

  hideUI() {
    // Solo ocultar UI si no estamos en pausa o si el modal está cerrado
    if (!this.brightnessModal.classList.contains('open')) {
      this.playerContainer.classList.remove('show-ui');
      clearTimeout(this.hideUITimer);
      
      // FIX CRÍTICO: Forzar visibilidad del video al ocultar UI
      // Esto previene pantalla negra en táctil + fullscreen
      setTimeout(() => {
        this.video.style.opacity = '1';
        this.video.style.visibility = 'visible';
        this.video.style.display = 'block';
        this.video.style.zIndex = '1';
      }, 10);
    }
  }

  // Playback methods
  togglePlay() {
    if (this.video.paused) this.video.play();
    else this.video.pause();
    this.pulseTap();
  }

  syncPlayIcons(playing) {
    this.iconPlay.style.display = playing ? 'none' : '';
    this.iconPause.style.display = playing ? '' : 'none';
    // Alternar clase visual en botón de play
    if (this.btnPlay) {
      this.btnPlay.classList.toggle('is-paused', !playing);
    }
  }

  // Progress methods
  updateProgress() {
    const pct = this.video.duration ? (this.video.currentTime / this.video.duration) * 100 : 0;
    this.progressFill.style.width = pct + '%';
    this.progressThumb.style.left = pct + '%';
    const currentEl = this.container.querySelector('#progressTimeCurrent');
    const durationEl = this.container.querySelector('#progressTimeDuration');
    if (currentEl) currentEl.textContent = this.fmt(this.video.currentTime);
    if (durationEl) durationEl.textContent = this.fmt(this.video.duration);
  }

  updateBuffered() {
    if (!this.video.duration) return;
    try {
      const buf = this.video.buffered;
      if (buf.length) this.progressBuffered.style.width = (buf.end(buf.length-1) / this.video.duration * 100) + '%';
    } catch (_) {}
  }

  seekTo(e) {
    const track = this.progressWrap.querySelector('.progress-track');
    const rect = track ? track.getBoundingClientRect() : this.progressWrap.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (this.video.duration) this.video.currentTime = pct * this.video.duration;
  }

  // Volume methods
  toggleMute() {
    this.video.muted = !this.video.muted;
    if (!this.video.muted && this.video.volume === 0) this.video.volume = 0.5;
    this.updateVolIcons();
    this.btnMute.blur();
  }

  updateVolIcons() {
    const muted = this.video.muted || this.video.volume === 0;
    this.iconVol.style.display = muted ? 'none' : '';
    this.iconMute.style.display = muted ? '' : 'none';
  }

  // Brightness methods
  openBrightnessModal() {
    this.brightnessModal.classList.add('open');
    this._updateDial(Math.round(this.currentBrightness * 100));
    this.btnBrightness.blur();
  }

  closeBrightnessModal() {
    this.brightnessModal.classList.remove('open');
  }

  applyBrightness(val) {
    this.currentBrightness = val;
    this.video.style.filter = `brightness(${val})`;
    const pct = Math.round(val * 100);
    if (this.brightnessValue) this.brightnessValue.textContent = pct + '%';
    if (this.brightnessSlider) this.brightnessSlider.value = pct;
    this.labelBrightness.textContent = pct + '%';
    this.brightnessModal.querySelectorAll('.brightness-presets button').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val) === pct);
    });
    this._updateDial(pct);
  }

  _initDialTicks() {
    if (!this.dialTicks) return;
    // 19 ticks cada 10 unidades de 10 a 200
    let html = '';
    for (let i = 0; i <= 19; i++) {
      const val = 10 + i * 10; // 10..200
      const angle = this._valToAngle(val);
      const rad = angle * Math.PI / 180;
      const r1 = i % 5 === 0 ? 65 : 70;
      const r2 = 76;
      const x1 = 100 + r1 * Math.cos(rad);
      const y1 = 100 + r1 * Math.sin(rad);
      const x2 = 100 + r2 * Math.cos(rad);
      const y2 = 100 + r2 * Math.sin(rad);
      html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${i % 5 === 0 ? 2.5 : 1}"/>`;
    }
    this.dialTicks.innerHTML = html;
  }

  // Convierte valor (10-200) a ángulo en grados (el arco va de ~135° a ~405°, empieza abajo-izquierda)
  _valToAngle(val) {
    const MIN = 10, MAX = 200, START = 135, END = 405;
    return START + ((val - MIN) / (MAX - MIN)) * (END - START);
  }

  _updateDial(pct) {
    if (!this.dialArc || !this.dialText) return;
    const CIRCUMFERENCE = 2 * Math.PI * 78; // ~490
    const MIN = 10, MAX = 200;
    const frac = (pct - MIN) / (MAX - MIN);
    const arcLen = frac * (270 / 360) * CIRCUMFERENCE; // 270° de los 360° totales
    this.dialArc.setAttribute('stroke-dasharray', `${arcLen.toFixed(2)} ${CIRCUMFERENCE}`);
    this.dialText.textContent = pct;
    // Color del arco según nivel
    if (pct < 50) {
      this.dialArc.style.stroke = '#ff9800';
    } else if (pct > 150) {
      this.dialArc.style.stroke = '#fff176';
    } else {
      this.dialArc.style.stroke = 'var(--accent)';
    }
  }

  // Overfit methods
  toggleOverfit() {
    this.isOverfit = !this.isOverfit;
    this.playerContainer.classList.toggle('overfit', this.isOverfit);
    // Aplicar object-fit directamente al video como fallback robusto
    this.video.style.objectFit = this.isOverfit ? 'cover' : 'contain';
    this.iconContain.style.display = this.isOverfit ? 'none' : '';
    this.iconCover.style.display = this.isOverfit ? '' : 'none';
    this.showHint(this.isOverfit ? '▣ Llenar pantalla' : '⛶ Ajustar pantalla');
    this.btnOverfit.blur();
  }

  // ──────────────────────────────────────
  // NUEVAS FUNCIONES
  // ──────────────────────────────────────

  async takeScreenshot() {
    if (!this.video.videoWidth || !this.video.videoHeight) { 
      this.showHint('Sin video'); 
      return; 
    }

    try {
      // Crear canvas con el frame del video
      const canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      try {
        ctx.drawImage(this.video, 0, 0);
        
        // Intentar usar File System Access API (Chrome 86+)
        if ('showSaveFilePicker' in window) {
          try {
            // Mostrar diálogo para elegir dónde guardar
            const handle = await window.showSaveFilePicker({
              suggestedName: `wolf-screenshot-${Date.now()}.png`,
              types: [{
                description: 'Imagen PNG',
                accept: { 'image/png': ['.png'] }
              }]
            });
            
            // Convertir canvas a blob
            canvas.toBlob(async (blob) => {
              if (blob) {
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                this.showHint('📸 Captura guardada');
              } else {
                this.showHint('❌ Error al capturar');
              }
            }, 'image/png');
            
          } catch (err) {
            // Usuario canceló o error
            if (err.name === 'AbortError') {
              this.showHint('❌ Cancelado');
            } else {
              // Fallback a descarga automática
              this.screenshotFallbackDownload(canvas);
            }
          }
        } else {
          // Navegador no soporta File System Access API
          // Usar método de descarga automática
          this.screenshotFallbackDownload(canvas);
        }
        
      } catch (corsError) {
        // Error CORS: intentar método alternativo
        console.warn('CORS error, intentando método alternativo:', corsError);
        this.screenshotAlternative();
      }
      
    } catch (error) {
      console.error('Error en captura:', error);
      this.screenshotAlternative();
    }
    
    this.btnScreenshot.blur();
  }

  // Método fallback de descarga automática (sin preguntar ubicación)
  screenshotFallbackDownload(canvas) {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `wolf-screenshot-${Date.now()}.png`;
          link.href = url;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 100);
          this.showHint('📸 Captura guardada');
        } else {
          this.screenshotFallbackDataURL(canvas);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error en fallback download:', error);
      this.screenshotFallbackDataURL(canvas);
    }
  }

  // Método fallback usando dataURL
  screenshotFallbackDataURL(canvas) {
    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `wolf-screenshot-${Date.now()}.png`;
      link.href = dataURL;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showHint('📸 Captura guardada');
    } catch (error) {
      console.error('Error en fallback dataURL:', error);
      this.showHint('❌ Error al capturar');
    }
  }

  // Método alternativo para videos con CORS
  screenshotAlternative() {
    try {
      // Intentar con crossOrigin
      if (!this.video.crossOrigin) {
        this.video.crossOrigin = 'anonymous';
        this.showHint('🔄 Reintentando...');
        
        // Esperar un poco y reintentar
        setTimeout(() => {
          if (this.video.readyState >= 2) {
            this.takeScreenshot();
          } else {
            this.showHint('❌ No se pudo capturar');
          }
        }, 500);
      } else {
        // Si ya tiene crossOrigin y sigue fallando
        this.showHint('❌ Video protegido');
      }
    } catch (error) {
      this.showHint('❌ No se pudo capturar');
      console.error('Error en método alternativo:', error);
    }
  }

  togglePip() {
    if (!document.pictureInPictureEnabled) {
      this.showHint('PiP no disponible');
      return;
    }
    
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
      
      // Restaurar título original
      if (this._originalTitle) {
        document.title = this._originalTitle;
        this._originalTitle = null;
      }
    } else {
      // Guardar título original
      this._originalTitle = document.title;
      
      // Cambiar título a algo genérico
      // NOTA: La URL del dominio seguirá visible por limitaciones del navegador
      // Esto es intencional por razones de seguridad y no se puede evitar
      document.title = this.options.title || 'Video';
      
      // Configurar metadatos mínimos
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: this.options.title || 'Video',
            artist: '',
            album: '',
            artwork: []
          });
        } catch (e) {
          // Silenciar errores
        }
      }
      
      this.video.requestPictureInPicture().catch(() => {
        this.showHint('No se pudo abrir PiP');
        
        // Restaurar título si falla
        if (this._originalTitle) {
          document.title = this._originalTitle;
          this._originalTitle = null;
        }
      });
    }
    this.btnPip.blur();
  }



  // Fullscreen methods
  toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const fsPromise = (this.wrapper.requestFullscreen || this.wrapper.webkitRequestFullscreen).call(this.wrapper);
      if (fsPromise && screen.orientation && screen.orientation.lock) {
        fsPromise.then(() => {
          screen.orientation.lock('landscape').catch(() => {});
        }).catch(() => {});
      }
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    }
    this.btnFullscreen.blur();
  }

  onFsChange() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    this.iconExpand.style.display = isFs ? 'none' : '';
    this.iconCompress.style.display = isFs ? '' : 'none';
    if (this.fsLabel) this.fsLabel.textContent = isFs ? 'Salir pantalla completa' : 'Pantalla completa';
    
    // Fix crítico: Asegurar que el video siempre esté visible al cambiar fullscreen
    // Esto previene pantalla negra en móviles táctiles
    setTimeout(() => {
      this.video.style.opacity = '1';
      this.video.style.visibility = 'visible';
      this.video.style.zIndex = '1';
      
      // Forzar repaint del video
      this.video.style.display = 'none';
      void this.video.offsetHeight; // Trigger reflow
      this.video.style.display = 'block';
    }, 50);
    
    // Mostrar controles al entrar/salir de fullscreen
    this.showUI();
  }

  // Keyboard handler
  handleKeyboard(e) {
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    switch (e.code) {
      case 'Space': case 'KeyK':
        e.preventDefault();
        this.togglePlay();
        this.showHint(this.video.paused ? '⏸' : '▶');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.video.currentTime -= 10;
        this.showHint('−10s');
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.video.currentTime += 10;
        this.showHint('+10s');
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.video.volume = Math.min(1, this.video.volume + 0.1);
        this.video.muted = false;
        this.updateVolIcons();
        this.showHint(`🔊 ${Math.round(this.video.volume * 100)}%`);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.video.volume = Math.max(0, this.video.volume - 0.1);
        this.updateVolIcons();
        this.showHint(`🔉 ${Math.round(this.video.volume * 100)}%`);
        break;
      case 'KeyM':
        this.toggleMute();
        this.showHint(this.video.muted ? '🔇 Mute' : '🔊 Unmute');
        break;
      case 'KeyF':
        this.toggleFullscreen();
        break;
    }
  }

  // Load source methods
  destroyAll() {
    if (this.hlsInstance) { this.hlsInstance.destroy(); this.hlsInstance = null; }
    if (this.flvInstance) { this.flvInstance.destroy(); this.flvInstance = null; }
    if (this.dashInstance) { this.dashInstance.reset(); this.dashInstance = null; }
    if (this.wtInstance) { this.wtInstance.destroy(); this.wtInstance = null; }
    this.video.src = '';
    this.video.load();
    
    // Resetear menú de calidad
    this.selectQuality.innerHTML = '<option value="-1" selected>Auto</option>';
    this.selectQuality.disabled = true;
    this.labelQuality.textContent = 'Auto';
  }

  async loadSource(url) {
    if (!url) return;
    this.destroyAll();
    
    // No modificar el título aquí - mantener el configurado en init()

    // Cargar librería necesaria si autoLoadLibraries está habilitado
    await this.loadRequiredLibrary(url);

    if (/^magnet:|\.torrent$/i.test(url)) this.loadTorrent(url);
    else if (/\.m3u8(\?|$)/i.test(url)) this.loadHLS(url);
    else if (/\.flv(\?|$)/i.test(url)) this.loadFLV(url);
    else if (/\.mpd(\?|$)/i.test(url)) this.loadDASH(url);
    else {
      // Para MP4 y otros formatos nativos, no hay cambio de calidad
      this.video.src = url;
      this.selectQuality.disabled = true;
      this.labelQuality.textContent = 'Auto';
      
      if (this.options.autoplay) {
        // Pequeño delay para asegurar que el video esté listo
        setTimeout(() => {
          this.video.play().catch(err => {
            console.warn('Wolf Player: Autoplay failed', err);
          });
        }, 100);
      }
    }
  }

  loadHLS(url) {
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      // Configuración optimizada para móviles y evitar pantalla negra
      this.hlsInstance = new Hls({ 
        enableWorker: true, 
        lowLatencyMode: false, // Desactivar para mejor estabilidad en móviles
        // Buffer optimizado para móviles
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        maxBufferSize: 40 * 1000 * 1000,
        maxBufferHole: 0.3,
        // Optimización para recuperación rápida
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 3,
        // Configuración para evitar pausas
        abrEwmaDefaultEstimate: 500000,
        startLevel: -1, // Auto start quality
        // Importante: backBufferLength ayuda a liberar memoria
        backBufferLength: 30
      });
      this.hlsInstance.loadSource(url);
      this.hlsInstance.attachMedia(this.video);
      
      // Evento cuando el manifiesto está parseado
      this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        // Asegurar que el spinner se oculte
        setTimeout(() => {
          this.spinner.classList.remove('active');
        }, 100);
        
        if (this.options.autoplay) {
          setTimeout(() => {
            this.video.play().catch(err => {
              console.warn('Wolf Player: Autoplay failed', err);
            });
          }, 150);
        }
      });
      
      // Evento cuando cambia el nivel de calidad
      this.hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_, d) => {
        this.updateQualityActive(d.level);
        // Ocultar spinner inmediatamente después de cambio de calidad
        setTimeout(() => {
          this.spinner.classList.remove('active');
          clearTimeout(this.spinnerTimeout);
        }, 200);
      });
      
      // Evento cuando se carga el manifiesto
      this.hlsInstance.on(Hls.Events.MANIFEST_LOADED, (_, d) => {
        const uniqueLevels = this.getUniqueLevels(d.levels);
        this.buildQualityMenu(uniqueLevels);
      });
      
      // IMPORTANTE: Eventos de buffering optimizados para evitar spinner innecesario
      // que causa pantalla negra en móviles
      
      this.hlsInstance.on(Hls.Events.BUFFER_APPENDED, () => {
        // Datos cargados, ocultar spinner agresivamente
        if (this.video.readyState >= 3) {
          this.spinner.classList.remove('active');
        }
      });
      
      // Manejar errores de HLS
      this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Wolf Player: HLS network error, trying to recover...');
              this.hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Wolf Player: HLS media error, trying to recover...');
              this.hlsInstance.recoverMediaError();
              break;
            default:
              console.error('Wolf Player: HLS fatal error, destroying instance');
              this.hlsInstance.destroy();
              break;
          }
        }
      });
      
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari nativo
      this.video.src = url;
      this.selectQuality.disabled = true;
      this.labelQuality.textContent = 'Auto';
      
      if (this.options.autoplay) {
        setTimeout(() => {
          this.video.play().catch(err => {
            console.warn('Wolf Player: Autoplay failed', err);
          });
        }, 100);
      }
    } else {
      console.error('Wolf Player: HLS not supported. Library may not be loaded yet.');
    }
  }

  loadFLV(url) {
    if (typeof flvjs !== 'undefined' && flvjs.isSupported()) {
      this.flvInstance = flvjs.createPlayer({ type: 'flv', url });
      this.flvInstance.attachMediaElement(this.video);
      this.flvInstance.load();
      if (this.options.autoplay) {
        setTimeout(() => {
          this.flvInstance.play();
        }, 100);
      }
    } else {
      console.error('Wolf Player: FLV not supported. Library may not be loaded yet.');
    }
  }

  loadDASH(url) {
    if (typeof dashjs !== 'undefined') {
      this.dashInstance = dashjs.MediaPlayer().create();
      this.dashInstance.initialize(this.video, url, this.options.autoplay);
      this.dashInstance.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        this.buildQualityMenuDash(this.dashInstance.getBitrateInfoListFor('video'));
      });
    } else {
      console.error('Wolf Player: DASH not supported. Library may not be loaded yet.');
    }
  }

  loadTorrent(magnetOrUrl) {
    if (typeof WebTorrent === 'undefined') {
      console.error('Wolf Player: WebTorrent not supported. Library may not be loaded yet.');
      return;
    }
    this.wtInstance = new WebTorrent();
    this.showHint('⏳ Conectando peers…');
    this.wtInstance.add(magnetOrUrl, torrent => {
      const file = torrent.files.find(f => /\.(mp4|mkv|webm|mov|avi)$/i.test(f.name));
      if (!file) {
        this.showHint('No se encontró video');
        return;
      }
      // Solo mostrar el nombre del archivo si no hay título configurado
      if (!this.options.title || this.options.title === '') {
        this.videoTitle.textContent = '';
        this.titleBar.style.display = 'none';
      }
      file.renderTo(this.video, { autoplay: this.options.autoplay });
    });
  }

  // Obtener niveles únicos por resolución
  getUniqueLevels(levels) {
    if (!levels || levels.length === 0) return [];
    
    const seen = new Map();
    const unique = [];
    
    levels.forEach((level, index) => {
      const height = level.height || 0;
      const bitrate = level.bitrate || 0;
      
      // Solo agregar si es una resolución válida y no duplicada
      if (height > 0 && !seen.has(height)) {
        seen.set(height, true);
        unique.push({ ...level, originalIndex: index });
      } else if (height === 0 && bitrate > 0 && !seen.has(bitrate)) {
        // Para niveles sin altura, usar bitrate
        seen.set(bitrate, true);
        unique.push({ ...level, originalIndex: index });
      }
    });
    
    // Ordenar por altura (mayor a menor)
    unique.sort((a, b) => (b.height || 0) - (a.height || 0));
    
    return unique;
  }

  // Quality menu methods
  buildQualityMenu(levels) {
    this.selectQuality.innerHTML = '<option value="-1" selected>Auto</option>';
    
    if (!levels || levels.length === 0) {
      // Si no hay niveles, deshabilitar el selector
      this.selectQuality.disabled = true;
      this.labelQuality.textContent = 'Auto';
      return;
    }
    
    // Si solo hay un nivel, deshabilitar el selector
    if (levels.length === 1) {
      this.selectQuality.disabled = true;
      this.labelQuality.textContent = 'Auto';
      return;
    }
    
    // Habilitar el selector si hay múltiples niveles
    this.selectQuality.disabled = false;
    
    levels.forEach((lvl) => {
      const opt = document.createElement('option');
      opt.value = lvl.originalIndex !== undefined ? lvl.originalIndex : lvl.height;
      
      if (lvl.height) {
        opt.textContent = `${lvl.height}p`;
      } else if (lvl.bitrate) {
        opt.textContent = `${Math.round(lvl.bitrate/1000)}k`;
      } else {
        return; // Saltar niveles sin información
      }
      
      this.selectQuality.appendChild(opt);
    });
    
    this.labelQuality.textContent = 'Auto';
  }

  buildQualityMenuDash(list) {
    if (!list || list.length === 0) {
      // Si no hay calidades, deshabilitar el selector
      this.selectQuality.innerHTML = '<option value="-1" selected>Auto</option>';
      this.selectQuality.disabled = true;
      this.labelQuality.textContent = 'Auto';
      return;
    }
    
    // Habilitar el selector si hay calidades
    this.selectQuality.disabled = false;
    this.selectQuality.innerHTML = '';
    
    list.forEach((info, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = info.height ? `${info.height}p` : `${Math.round(info.bitrate/1000)}k`;
      if (i === 0) opt.selected = true;
      this.selectQuality.appendChild(opt);
    });
    this.labelQuality.textContent = this.selectQuality.options[0]?.textContent || 'Auto';
  }

  setQuality(level) {
    if (!this.hlsInstance) return;
    this.hlsInstance.currentLevel = level;
  }

  updateQualityActive(level) {
    // Update quality label when auto-switching
    if (this.selectQuality.value === '-1') {
      // Buscar la opción que corresponde al nivel actual
      const options = Array.from(this.selectQuality.options);
      const matchingOption = options.find(opt => parseInt(opt.value) === level);
      
      if (matchingOption) {
        this.labelQuality.textContent = `Auto (${matchingOption.textContent})`;
      } else {
        this.labelQuality.textContent = 'Auto';
      }
    }
  }

  // Public API methods
  play() {
    return this.video.play();
  }

  pause() {
    this.video.pause();
  }

  stop() {
    this.video.pause();
    this.video.currentTime = 0;
  }

  setVolume(vol) {
    this.video.volume = Math.max(0, Math.min(1, vol));
    this.updateVolIcons();
  }

  getVolume() {
    return this.video.volume;
  }

  mute() {
    this.video.muted = true;
    this.updateVolIcons();
  }

  unmute() {
    this.video.muted = false;
    this.updateVolIcons();
  }

  seek(time) {
    this.video.currentTime = time;
  }

  getCurrentTime() {
    return this.video.currentTime;
  }

  getDuration() {
    return this.video.duration;
  }

  setSpeed(speed) {
    this.video.playbackRate = speed;
    this.selectSpeed.value = speed;
    this.labelSpeed.textContent = speed === 1 ? '1×' : speed + '×';
  }

  getSpeed() {
    return this.video.playbackRate;
  }

  setColor(color) {
    this.options.color = color;
    this.applyColor(color);
  }

  setPoster(url) {
    this.options.poster = url;
    if (this.videoPoster) {
      this.videoPoster.style.backgroundImage = `url(${url})`;
      this.videoPoster.classList.remove('hidden');
    }
  }

  setTitle(title) {
    this.options.title = title;
    if (title && title !== 'Sin título') {
      this.videoTitle.textContent = title;
      this.titleBar.style.display = 'flex';
    } else {
      this.videoTitle.textContent = '';
      this.titleBar.style.display = 'none';
    }
  }

  destroy() {
    this.destroyAll();
    // Remove all event listeners would go here
    // For simplicity, we'll just destroy media instances
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WolfPlayer;
}
if (typeof window !== 'undefined') {
  window.WolfPlayer = WolfPlayer;
}
