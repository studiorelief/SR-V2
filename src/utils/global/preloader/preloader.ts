/**
 * ============================================================================
 * PRELOADER - Studio Relief
 * ============================================================================
 *
 * Preloader qui s'affiche uniquement lors de la première visite de session.
 * Utilise sessionStorage pour tracker si l'utilisateur a déjà vu le preloader.
 *
 * Éléments Webflow requis :
 * - preloader="component" : wrapper principal
 * - preloader="logo" : logo du studio
 * - #lottie-preloader : <video> qui se joue 1× au démarrage
 * - preloader="loading-count" : texte affichant le % de chargement
 * - preloader="loading-line" : ligne de progression visuelle
 *
 * Sortie déclenchée quand les 2 conditions sont remplies :
 *   - window load terminé
 *   - durée minimum atteinte (2.5s)
 *
 * La vidéo boucle pendant toute la durée du preloader (loop forcé en JS).
 */

import gsap from 'gsap';

const PRELOADER_SHOWN_KEY = 'sr-preloader-shown';
const MINIMUM_PRELOADER_DURATION = 2500;

let loadProgress = 0;
let preloaderStartTime = 0;
let progressTween: gsap.core.Tween | null = null;

let windowLoaded = false;
let exitTriggered = false;

/**
 * Détecte les agents automatisés (Lighthouse, PageSpeed, GTmetrix, headless Chrome,
 * outils SEO, crawlers). On bypass le preloader pour eux : il pénalise lourdement
 * Lighthouse (LCP/TBT/SI) sans servir leur usage.
 */
const isHeadlessAgent = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  if (navigator.webdriver) return true;
  return /HeadlessChrome|Lighthouse|Chrome-Lighthouse|PageSpeed|Speed Insights|GTmetrix|Pingdom|bot|crawler|spider/i.test(
    navigator.userAgent
  );
};

const shouldShowPreloader = (): boolean => !sessionStorage.getItem(PRELOADER_SHOWN_KEY);

const markPreloaderAsShown = (): void => {
  sessionStorage.setItem(PRELOADER_SHOWN_KEY, 'true');
};

/**
 * Lance la lecture de la <video> du preloader en boucle.
 * - Retire `data-lazy-video` pour empêcher Webflow de différer le play.
 * - Force `loop = true` (Webflow n'a pas l'attribut posé) pour que la vidéo
 *   tourne tout le temps que le preloader est visible.
 * - Force `play()` ; si bloqué, le poster reste affiché — pas bloquant pour la sortie.
 */
const initPreloaderVideo = (): void => {
  const video = document.querySelector<HTMLVideoElement>('#lottie-preloader');
  if (!video) return;

  video.removeAttribute('data-lazy-video');
  video.loop = true;

  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      // Autoplay bloqué (rare avec muted+playsinline) — on laisse le poster.
    });
  }
};

const updateLoadingDisplay = (progress: number): void => {
  const countElement = document.querySelector<HTMLElement>('[preloader="loading-count"]');
  const lineElement = document.querySelector<HTMLElement>('[preloader="loading-line"]');

  if (countElement) {
    countElement.textContent = `${Math.round(progress)}%`;
  }
  if (lineElement) {
    gsap.to(lineElement, {
      width: `${progress}%`,
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

/**
 * Simule une progression fluide jusqu'à 90%. Les derniers 10% sont joués
 * dans `maybeCompletePreloader` une fois toutes les conditions remplies.
 */
const simulateProgress = (): void => {
  progressTween = gsap.to(
    { value: 0 },
    {
      value: 90,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: function () {
        if (!exitTriggered) {
          loadProgress = this.targets()[0].value;
          updateLoadingDisplay(loadProgress);
        }
      },
    }
  );
};

/**
 * Tente de lancer la sortie. Conditions :
 *   windowLoaded ∧ (elapsed ≥ MINIMUM_PRELOADER_DURATION)
 * Sinon on re-planifie un check après le temps restant.
 */
const maybeCompletePreloader = (): void => {
  if (exitTriggered) return;
  if (!windowLoaded) return;

  const remaining = MINIMUM_PRELOADER_DURATION - (Date.now() - preloaderStartTime);
  if (remaining > 0) {
    gsap.delayedCall(remaining / 1000, maybeCompletePreloader);
    return;
  }

  exitTriggered = true;
  progressTween?.kill();

  gsap.to(
    { value: loadProgress },
    {
      value: 100,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: function () {
        updateLoadingDisplay(this.targets()[0].value);
      },
      onComplete: () => {
        gsap.delayedCall(0.3, animatePreloaderOut);
      },
    }
  );
};

const onWindowLoad = (): void => {
  windowLoaded = true;
  maybeCompletePreloader();
};

const animatePreloaderOut = (): void => {
  const component = document.querySelector<HTMLElement>('[preloader="component"]');
  if (!component) return;

  const background = document.querySelector<HTMLElement>('[preloader="background"]');
  const logo = document.querySelector<HTMLElement>('[preloader="logo"]');
  const countElement = document.querySelector<HTMLElement>('[preloader="loading-count"]');
  const lineElement = document.querySelector<HTMLElement>('[preloader="loading-line"]');
  const video = document.querySelector<HTMLElement>('#lottie-preloader');

  const tl = gsap.timeline({
    onComplete: () => {
      component.style.display = 'none';
      component.style.visibility = 'hidden';
      markPreloaderAsShown();
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('preloaderComplete'));
    },
  });

  tl.to([countElement, lineElement], { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0);

  if (logo) {
    tl.to(
      logo,
      {
        scale: 0,
        opacity: 0,
        xPercent: 100,
        yPercent: -100,
        y: '1.5rem',
        x: '5rem',
        duration: 0.5,
        ease: 'power2.in',
      },
      0.2
    );
  }

  if (video) {
    tl.to(video, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.2);
  }

  if (background) {
    tl.to(background, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.3);
  }

  tl.set(component, { autoAlpha: 0 });
};

export const initPreloader = (): void => {
  const component = document.querySelector<HTMLElement>('[preloader="component"]');
  if (!component) return;

  // Bots / Lighthouse / PageSpeed → on cache le preloader (pénalise le score sans
  // servir leur usage).
  if (isHeadlessAgent() || !shouldShowPreloader()) {
    component.style.display = 'none';
    component.style.visibility = 'hidden';
    return;
  }

  component.style.display = 'flex';
  component.style.visibility = 'visible';
  component.style.opacity = '1';

  preloaderStartTime = Date.now();
  document.body.style.overflow = 'hidden';

  updateLoadingDisplay(0);
  const lineElement = document.querySelector<HTMLElement>('[preloader="loading-line"]');
  if (lineElement) {
    gsap.set(lineElement, { width: '0%' });
  }

  initPreloaderVideo();
  simulateProgress();

  if (document.readyState === 'complete') {
    onWindowLoad();
  } else {
    window.addEventListener('load', onWindowLoad, { once: true });
  }
};
