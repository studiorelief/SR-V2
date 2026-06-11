/**
 *==========================================
 * LAZY VIDEO
 * ↳ Charge & joue les vidéos uniquement quand visibles
 *==========================================
 *
 * Modes pilotés par l'attribut `data-lazy-video` côté Webflow :
 *  - "true"  → load + play quand visible dans le viewport, pause quand sort
 *  - "hover" → load au 1er hover du parent (desktop) / fallback viewport (mobile)
 *
 * Optimisations :
 *  - Skip strip-src si la vidéo est déjà in-viewport au load (préserve le LCP du hero)
 *  - Vérif visibilité réelle (display, visibility, dimensions) avant load
 *  - IntersectionObserver unique partagé entre toutes les vidéos
 *  - `fetchpriority="low"` sur les lazy
 *  - `prefers-reduced-motion` → pas d'autoplay
 *  - Connexion 2g/slow-2g → pas de chargement auto
 */

const ROOT_MARGIN = '200px';
const SELECTOR = '[data-lazy-video]';

interface NetworkInformation {
  effectiveType?: string;
  saveData?: boolean;
}
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

interface LazyVideoState {
  video: HTMLVideoElement;
  mode: 'viewport' | 'hover';
  loaded: boolean;
  hoverTarget: HTMLElement | null;
  handleEnter: (() => void) | null;
  handleLeave: (() => void) | null;
}

const states = new Map<HTMLVideoElement, LazyVideoState>();
let observer: IntersectionObserver | null = null;

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isTouchOnly = (): boolean => window.matchMedia('(hover: none)').matches;

const isSlowConnection = (): boolean => {
  const conn = (navigator as NavigatorWithConnection).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
};

/**
 * Vérifie qu'une vidéo est *réellement* affichée (pas juste dans le DOM/viewport).
 * Couvre display:none, visibility:hidden, opacity:0 et dimensions nulles.
 */
const isActuallyVisible = (el: HTMLElement): boolean => {
  if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
  const style = getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  if (parseFloat(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const isInInitialViewport = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
};

const stripSrc = (video: HTMLVideoElement): void => {
  const src = video.getAttribute('src');
  if (src && !video.hasAttribute('data-src')) {
    video.setAttribute('data-src', src);
    video.removeAttribute('src');
    video.load();
  }
  const source = video.querySelector('source');
  if (source) {
    const sourceSrc = source.getAttribute('src');
    if (sourceSrc && !source.hasAttribute('data-src')) {
      source.setAttribute('data-src', sourceSrc);
      source.removeAttribute('src');
    }
  }
};

const restoreSrc = (video: HTMLVideoElement): boolean => {
  const dataSrc = video.getAttribute('data-src');
  let restored = false;

  if (dataSrc && video.getAttribute('src') !== dataSrc) {
    video.setAttribute('src', dataSrc);
    restored = true;
  }

  const source = video.querySelector('source');
  if (source) {
    const sourceData = source.getAttribute('data-src');
    if (sourceData && source.getAttribute('src') !== sourceData) {
      source.setAttribute('src', sourceData);
      restored = true;
    }
  }

  if (restored) video.load();
  return restored;
};

const tryPlay = (video: HTMLVideoElement): void => {
  if (prefersReducedMotion()) return;
  video.play().catch(() => {
    /* autoplay bloqué par le navigateur — silencieux */
  });
};

const loadAndPlay = (state: LazyVideoState): void => {
  const { video } = state;
  if (!isActuallyVisible(video)) return;

  if (!state.loaded) {
    restoreSrc(video);
    state.loaded = true;
  }
  tryPlay(video);
};

const handleIntersection: IntersectionObserverCallback = (entries) => {
  for (const entry of entries) {
    const video = entry.target as HTMLVideoElement;
    const state = states.get(video);
    if (!state) continue;

    if (entry.isIntersecting) {
      loadAndPlay(state);
    } else if (state.loaded) {
      video.pause();
    }
  }
};

const getObserver = (): IntersectionObserver => {
  if (!observer) {
    observer = new IntersectionObserver(handleIntersection, {
      rootMargin: ROOT_MARGIN,
      threshold: 0,
    });
  }
  return observer;
};

const setupHoverMode = (state: LazyVideoState): void => {
  const target = state.video.closest<HTMLElement>('#animation-video') ?? state.video.parentElement;
  if (!target) return;

  state.hoverTarget = target;

  state.handleEnter = () => {
    if (!isActuallyVisible(state.video)) return;
    if (!state.loaded) {
      restoreSrc(state.video);
      state.loaded = true;
    }
    state.video.play().catch(() => {
      /* silencieux */
    });
  };

  state.handleLeave = () => {
    state.video.pause();
  };

  target.addEventListener('mouseenter', state.handleEnter);
  target.addEventListener('mouseleave', state.handleLeave);
};

/**
 * Initialise le lazy load pour toutes les vidéos avec `data-lazy-video`.
 */
export const initLazyVideos = (): void => {
  const videos = document.querySelectorAll<HTMLVideoElement>(SELECTOR);
  if (!videos.length) return;

  const slow = isSlowConnection();
  const touch = isTouchOnly();

  for (const video of videos) {
    if (states.has(video)) continue;

    const attr = video.getAttribute('data-lazy-video');
    // "false" = opt-out explicite (ex: vidéos services home pilotées par homeServices.ts)
    if (attr === 'false') continue;
    const wantsHover = attr === 'hover';
    // Sur mobile (pas de hover), on bascule les vidéos hover en mode viewport.
    const mode: 'viewport' | 'hover' = wantsHover && !touch ? 'hover' : 'viewport';

    const state: LazyVideoState = {
      video,
      mode,
      loaded: false,
      hoverTarget: null,
      handleEnter: null,
      handleLeave: null,
    };
    states.set(video, state);

    video.setAttribute('fetchpriority', 'low');

    // Hero / déjà visible au chargement : on laisse le src intact pour préserver le LCP.
    // On observe quand même pour gérer pause/play si la vidéo sort du viewport.
    const inInitialViewport = mode === 'viewport' && isInInitialViewport(video);

    if (!inInitialViewport) {
      video.preload = 'none';
      if (!slow) stripSrc(video);
    } else {
      state.loaded = true;
    }

    if (mode === 'hover') {
      setupHoverMode(state);
    } else {
      getObserver().observe(video);
    }
  }
};

/**
 * Cleanup complet — appelé sur `swup content:replace`.
 */
export const destroyLazyVideos = (): void => {
  for (const state of states.values()) {
    if (state.hoverTarget && state.handleEnter && state.handleLeave) {
      state.hoverTarget.removeEventListener('mouseenter', state.handleEnter);
      state.hoverTarget.removeEventListener('mouseleave', state.handleLeave);
    }
    state.video.pause();
  }
  states.clear();

  if (observer) {
    observer.disconnect();
    observer = null;
  }
};
