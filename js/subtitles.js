/* ══════════════════════════════════════
   SUBTITLES MODULE
   ══════════════════════════════════════ */

import { video, container } from './dom.js';
import { showHint } from './utils.js';

let subtitlesMenu = null;
let subtitlesDisplay = null;
let btnSubtitles = null;
let currentTrack = null;
let subtitlesEnabled = true;

export function initSubtitles() {
  createSubtitlesButton();
  createSubtitlesDisplay();
  createSubtitlesMenu();
  setupSubtitlesEvents();
  detectExistingTracks();
}

// Crear botón de subtítulos
function createSubtitlesButton() {
  const ctrlRow = container.querySelector('.ctrl-row');
  if (!ctrlRow) return;

  // Crear el botón antes del botón de pantalla completa
  const btnFullscreen = container.querySelector('#btnFullscreen');
  
  btnSubtitles = document.createElement('button');
  btnSubtitles.className = 'opt-btn';
  btnSubtitles.id = 'btnSubtitles';
  btnSubtitles.title = 'Subtítulos';
  btnSubtitles.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>
    </svg>
    <span id="labelSubtitles">Subtítulos</span>
  `;
  
  if (btnFullscreen && btnFullscreen.parentNode) {
    btnFullscreen.parentNode.insertBefore(btnSubtitles, btnFullscreen);
  } else {
    ctrlRow.appendChild(btnSubtitles);
  }
}

// Crear contenedor para mostrar los subtítulos
function createSubtitlesDisplay() {
  subtitlesDisplay = document.createElement('div');
  subtitlesDisplay.className = 'subtitles-display';
  subtitlesDisplay.id = 'subtitlesDisplay';
  
  const playerContainer = container.querySelector('#playerContainer');
  if (playerContainer) {
    playerContainer.appendChild(subtitlesDisplay);
  }
}

// Crear menú de subtítulos
function createSubtitlesMenu() {
  subtitlesMenu = document.createElement('div');
  subtitlesMenu.className = 'subtitles-menu';
  subtitlesMenu.id = 'subtitlesMenu';
  subtitlesMenu.innerHTML = `
    <div class="subtitles-menu-header">
      <span>Subtítulos</span>
      <button class="subtitles-menu-close" id="btnSubtitlesMenuClose">
        <svg viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
    <div class="subtitles-menu-body">
      <div class="subtitles-menu-item" data-track="-1">
        <span>Desactivados</span>
        <svg class="checkmark" viewBox="0 0 24 24" style="display:none">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
    </div>
  `;
  
  const playerContainer = container.querySelector('#playerContainer');
  if (playerContainer) {
    playerContainer.appendChild(subtitlesMenu);
  }
}

// Configurar eventos
function setupSubtitlesEvents() {
  // Botón de subtítulos
  if (btnSubtitles) {
    btnSubtitles.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSubtitlesMenu();
    });
  }

  // Botón de cerrar menú
  const btnClose = subtitlesMenu.querySelector('#btnSubtitlesMenuClose');
  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSubtitlesMenu();
    });
  }

  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (subtitlesMenu && subtitlesMenu.classList.contains('open')) {
      if (!subtitlesMenu.contains(e.target) && !btnSubtitles.contains(e.target)) {
        closeSubtitlesMenu();
      }
    }
  });

  // Detectar nuevas pistas de subtítulos
  video.addEventListener('loadedmetadata', () => {
    detectExistingTracks();
  });

  // Actualizar subtítulos mostrados
  video.addEventListener('timeupdate', updateSubtitlesDisplay);
}

// Detectar pistas de subtítulos existentes
function detectExistingTracks() {
  if (!video.textTracks || video.textTracks.length === 0) {
    return;
  }

  const menuBody = subtitlesMenu.querySelector('.subtitles-menu-body');
  
  // Limpiar pistas anteriores (excepto "Desactivados")
  const items = menuBody.querySelectorAll('.subtitles-menu-item');
  items.forEach((item, index) => {
    if (index > 0) item.remove();
  });

  let forcedSpanishIndex = -1;
  let firstSpanishIndex = -1;
  let forcedIndex = -1;

  // Agregar las nuevas pistas
  Array.from(video.textTracks).forEach((track, index) => {
    const item = document.createElement('div');
    item.className = 'subtitles-menu-item';
    item.dataset.track = index;
    
    const label = track.label || track.language || `Pista ${index + 1}`;
    
    item.innerHTML = `
      <span>${label}</span>
      <svg class="checkmark" viewBox="0 0 24 24" style="display:none">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    `;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectSubtitleTrack(index);
    });
    
    menuBody.appendChild(item);

    // Configurar el track
    track.mode = 'hidden'; // Usamos 'hidden' para controlar la visualización manualmente
    
    // Escuchar eventos de cuechange
    track.addEventListener('cuechange', () => {
      if (track === currentTrack) {
        updateSubtitlesDisplay();
      }
    });

    // Detectar pistas "Spanish Forced" o "Español Forced"
    const labelLower = label.toLowerCase();
    const languageLower = (track.language || '').toLowerCase();
    
    // Buscar Spanish/Español + Forced
    if ((labelLower.includes('spanish') || labelLower.includes('español') || languageLower.includes('spa') || languageLower.includes('es')) 
        && labelLower.includes('forced')) {
      forcedSpanishIndex = index;
    }
    // Buscar cualquier pista Forced como segunda opción
    else if (labelLower.includes('forced')) {
      if (forcedIndex === -1) forcedIndex = index;
    }
    // Guardar la primera pista en español como tercera opción
    else if ((labelLower.includes('spanish') || labelLower.includes('español') || languageLower.includes('spa') || languageLower.includes('es')) 
             && firstSpanishIndex === -1) {
      firstSpanishIndex = index;
    }
  });

  // Activar pista automáticamente según prioridad
  if (subtitlesEnabled) {
    if (forcedSpanishIndex !== -1) {
      // Prioridad 1: Spanish Forced
      selectSubtitleTrack(forcedSpanishIndex);
      console.log('Wolf Player: Activando subtítulos Spanish Forced automáticamente');
    } else if (forcedIndex !== -1) {
      // Prioridad 2: Cualquier pista Forced
      selectSubtitleTrack(forcedIndex);
      console.log('Wolf Player: Activando subtítulos Forced automáticamente');
    } else if (firstSpanishIndex !== -1) {
      // Prioridad 3: Primera pista en español
      selectSubtitleTrack(firstSpanishIndex);
      console.log('Wolf Player: Activando subtítulos en español automáticamente');
    } else if (video.textTracks.length > 0) {
      // Prioridad 4: Primera pista disponible
      selectSubtitleTrack(0);
    }
  }

  // Actualizar label del botón
  updateSubtitlesLabel();
}

// Seleccionar pista de subtítulos
function selectSubtitleTrack(trackIndex) {
  // Desactivar todas las pistas
  Array.from(video.textTracks).forEach((track) => {
    track.mode = 'hidden';
  });

  // Actualizar checkmarks
  const items = subtitlesMenu.querySelectorAll('.subtitles-menu-item');
  items.forEach(item => {
    const checkmark = item.querySelector('.checkmark');
    if (checkmark) checkmark.style.display = 'none';
  });

  if (trackIndex === -1) {
    // Desactivar subtítulos
    currentTrack = null;
    subtitlesEnabled = false;
    subtitlesDisplay.textContent = '';
    subtitlesDisplay.classList.remove('active');
    
    // Marcar "Desactivados"
    const disabledItem = subtitlesMenu.querySelector('[data-track="-1"]');
    if (disabledItem) {
      const checkmark = disabledItem.querySelector('.checkmark');
      if (checkmark) checkmark.style.display = 'block';
    }
    
    showHint('Subtítulos desactivados');
  } else {
    // Activar pista seleccionada
    const track = video.textTracks[trackIndex];
    if (track) {
      track.mode = 'hidden'; // 'hidden' para que no use el estilo nativo del navegador
      currentTrack = track;
      subtitlesEnabled = true;
      
      // Marcar la pista seleccionada
      const selectedItem = subtitlesMenu.querySelector(`[data-track="${trackIndex}"]`);
      if (selectedItem) {
        const checkmark = selectedItem.querySelector('.checkmark');
        if (checkmark) checkmark.style.display = 'block';
      }
      
      const label = track.label || track.language || `Pista ${trackIndex + 1}`;
      showHint(`Subtítulos: ${label}`);
    }
  }

  updateSubtitlesLabel();
  closeSubtitlesMenu();
}

// Actualizar visualización de subtítulos
function updateSubtitlesDisplay() {
  if (!currentTrack || !subtitlesEnabled || currentTrack.mode === 'disabled') {
    subtitlesDisplay.textContent = '';
    subtitlesDisplay.classList.remove('active');
    return;
  }

  const activeCues = currentTrack.activeCues;
  
  if (activeCues && activeCues.length > 0) {
    // Mostrar todas las cues activas
    const text = Array.from(activeCues)
      .map(cue => cue.text)
      .join('\n');
    
    subtitlesDisplay.innerHTML = text;
    subtitlesDisplay.classList.add('active');
  } else {
    subtitlesDisplay.textContent = '';
    subtitlesDisplay.classList.remove('active');
  }
}

// Actualizar etiqueta del botón
function updateSubtitlesLabel() {
  const label = container.querySelector('#labelSubtitles');
  if (!label) return;

  if (!subtitlesEnabled || !currentTrack) {
    label.textContent = 'Subtítulos';
  } else {
    const trackLabel = currentTrack.label || currentTrack.language || 'Subtítulos';
    label.textContent = trackLabel;
  }
}

// Alternar menú de subtítulos
function toggleSubtitlesMenu() {
  if (subtitlesMenu.classList.contains('open')) {
    closeSubtitlesMenu();
  } else {
    openSubtitlesMenu();
  }
}

// Abrir menú de subtítulos
function openSubtitlesMenu() {
  subtitlesMenu.classList.add('open');
}

// Cerrar menú de subtítulos
function closeSubtitlesMenu() {
  subtitlesMenu.classList.remove('open');
}

// Función pública para agregar pistas de subtítulos programáticamente
export function addSubtitleTrack(src, label, language = '', isDefault = false) {
  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.src = src;
  track.label = label;
  track.srclang = language;
  if (isDefault) track.default = true;
  
  video.appendChild(track);
  
  // Esperar a que se cargue y actualizar el menú
  track.addEventListener('load', () => {
    detectExistingTracks();
  });
}

// Función pública para obtener el estado de los subtítulos
export function getSubtitlesState() {
  return {
    enabled: subtitlesEnabled,
    currentTrack: currentTrack,
    availableTracks: Array.from(video.textTracks).map((track, index) => ({
      index,
      label: track.label,
      language: track.language,
      kind: track.kind
    }))
  };
}
