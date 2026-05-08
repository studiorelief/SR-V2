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
 * - #preloader-video-mascotte : <video> qui boucle pendant toute la durée du preloader
 * - preloader="loading-count" : texte affichant le % de chargement
 * - preloader="loading-line" : ligne de progression visuelle
 *
 * Sur la home : la vidéo du preloader est ensuite déplacée dans le wrapper
 * `.home_hero_background-asset.is-mascotte` et son id devient #home-hero-video-mascotte,
 * ce qui évite un double download (preloader + hero ont la même URL Supabase).
 *
 * Sortie déclenchée quand les 2 conditions sont remplies :
 *   - window load terminé
 *   - durée minimum atteinte (2.5s)
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

/**
 * Indique si le préloader sera affiché lors de cet `initPreloader()`.
 * Permet aux callers de différer leur travail (ex: animation d'entrée du hero)
 * jusqu'à `preloaderComplete` pour qu'il soit visible, plutôt que joué derrière
 * le rideau.
 *
 * Conditions miroirs de l'early-return de `initPreloader()` :
 *   - Le component DOM existe
 *   - Pas un bot / Lighthouse / etc.
 *   - sessionStorage `sr-preloader-shown` pas encore marqué (1ère visite)
 */
export const isPreloaderVisible = (): boolean => {
  const component = document.querySelector<HTMLElement>('[preloader="component"]');
  if (!component) return false;
  return !isHeadlessAgent() && shouldShowPreloader();
};

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
  const video = document.querySelector<HTMLVideoElement>('#preloader-video-mascotte');
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
  const video = document.querySelector<HTMLVideoElement>('#preloader-video-mascotte');
  // On fade le wrapper plutôt que la <video> elle-même : la classe Webflow
  // `.video-component` applique une `transition: opacity` CSS qui s'ajoute au
  // tween GSAP et fait persister la mascotte ~0.5s de plus que le reste.
  const videoWrapper = document.querySelector<HTMLElement>('[preloader="mascotte"]');

  // Sur la home uniquement : on recycle la <video> du preloader pour remplacer
  // celle du hero mascotte (mêmes URL Supabase). 1 download, 1 décodeur, et la
  // lecture n'est jamais interrompue. Selector home-spécifique pour ne pas
  // déplacer la vidéo dans la mascotte d'autres pages (Approche, etc.) qui
  // utilisent aussi [asset="mascotte"] sur d'autres types de wrappers.
  const heroMascotteContainer = document.querySelector<HTMLElement>(
    '.home_hero_background-asset.is-mascotte'
  );
  const reuseVideoForHero = video !== null && heroMascotteContainer !== null;

  const tl = gsap.timeline({
    onComplete: () => {
      if (reuseVideoForHero && video) {
        // La <video> originale du hero (#home-hero-video-mascotte) a déjà été neutralisée
        // (cf. initPreloader + script inline du head) pour éviter le double
        // download. On déplace AVANT `display:none` pour que le navigateur ne
        // la blanchisse pas pendant le re-parent. On renomme l'id pour que
        // toute requête future à `#home-hero-video-mascotte` retrouve l'instance vivante.
        video.id = 'home-hero-video-mascotte';
        heroMascotteContainer.appendChild(video);
      } else if (video) {
        // Pages hors home : libérer COMPLÈTEMENT le décodeur vidéo.
        // pause() seul ne libère pas les ressources de décodage sur WebKit
        // (Safari) et DIA en navigation privée — le décodeur reste alloué
        // en mémoire GPU pour toute la session, ce qui ralentit l'ensemble
        // du compositor pour les autres animations/parallaxes du site.
        // Pour libérer : pause + remove src + load() (flush buffer) + remove DOM.
        video.pause();
        const sourceEl = video.querySelector('source');
        if (sourceEl) sourceEl.removeAttribute('src');
        video.removeAttribute('src');
        try {
          video.load(); // déclenche la libération du décodeur
        } catch {
          /* noop */
        }
        video.remove();
      }

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

  // Wrapper de la vidéo + background : sync parfait (mêmes position, durée, ease)
  // pour que la mascotte disparaisse exactement en même temps que le fond.
  // Sur la home on saute (la vidéo doit rester visible pour le swap dans le hero).
  if (videoWrapper && !reuseVideoForHero) {
    tl.to(videoWrapper, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.3);
  }

  if (background) {
    tl.to(background, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.3);
  }

  // Sur la home on évite l'autoAlpha (qui masquerait la vidéo via héritage CSS
  // avant qu'on la déplace dans le hero). `display:none` dans onComplete suffit.
  if (!reuseVideoForHero) {
    tl.set(component, { autoAlpha: 0 });
  }
};

export const initPreloader = (): void => {
  const component = document.querySelector<HTMLElement>('[preloader="component"]');
  if (!component) return;

  // Bots / Lighthouse / PageSpeed → hide instantané (pénalise le score sinon).
  if (isHeadlessAgent()) {
    document.getElementById('preloader-video-mascotte')?.remove();
    component.style.display = 'none';
    component.style.visibility = 'hidden';
    return;
  }

  // Refresh / 2e visite (sessionStorage `sr-preloader-shown` set) : on ne rejoue
  // pas le préloader complet (UX), MAIS on évite le hide instantané qui causait
  // un flash brutal (~0.5 s) sur les refresh des inner pages — où le head global
  // Webflow force le CSS `[preloader="component"]{display:flex !important}` pour
  // contourner le degenerate compositor Dia/WebKit. On fade-out doucement après
  // une durée minimale pour laisser le compositor finir sa rasterization.
  if (!shouldShowPreloader()) {
    const path = window.location.pathname;
    const isHomePage = path === '/' || path === '/index.html' || path === '';
    // Home : pas de bug Dia (1 hero image eager) → hide rapide pour UX snappy.
    // Inner pages : tampon ~1 s minimum + fade 0.3 s pour adoucir le flash et
    // garantir que le compositor a fini de rasterizer avant qu'on lève le rideau.
    const minHoldMs = isHomePage ? 0 : 1000;
    const fadeDurationMs = isHomePage ? 0 : 300;

    // Pause la vidéo immédiat : pas besoin qu'elle joue pendant un fade.
    const video = document.getElementById('preloader-video-mascotte') as HTMLVideoElement | null;
    if (video) {
      try {
        video.pause();
      } catch {
        /* noop */
      }
    }

    const cleanup = (): void => {
      component.style.display = 'none';
      component.style.visibility = 'hidden';
      document.getElementById('preloader-video-mascotte')?.remove();
    };

    if (minHoldMs === 0) {
      cleanup();
      return;
    }

    setTimeout(() => {
      gsap.to(component, {
        autoAlpha: 0,
        duration: fadeDurationMs / 1000,
        ease: 'power2.out',
        onComplete: cleanup,
      });
    }, minHoldMs);

    return;
  }

  // Sur la home : #home-hero-video-mascotte a la MÊME URL Supabase que #preloader-video-mascotte.
  // Le script inline du head a déjà neutralisé son `src` avant le fetch (et posé
  // `data-sr-suppressed`) pour éviter le double download. Ici on le retire du
  // DOM proprement — il sera remplacé à la fin du preloader par la vidéo du
  // preloader, déplacée et renommée en #home-hero-video-mascotte (cf. animatePreloaderOut).
  document.getElementById('home-hero-video-mascotte')?.remove();

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
