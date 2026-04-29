import { DotLottie } from '@lottiefiles/dotlottie-web';
import gsap from 'gsap';

/**
 * Interface pour stocker les instances Lottie et leurs listeners
 */
interface LottieInstance {
  element: Element;
  dotLottie: DotLottie;
  container: Element;
  handleMouseEnter?: () => void;
  handleMouseLeave?: () => void;
  hoverPauseDelay?: gsap.core.Tween | null;
  hoverResumeDelay?: gsap.core.Tween | null;
}

// Stockage des instances Lottie pour pouvoir les détruire
const lottieInstances: LottieInstance[] = [];

// Observers actifs pour les Lotties en lazy init (à disconnect au cleanup)
const lottieObservers: IntersectionObserver[] = [];

// Marge de pré-chargement : on init le Lottie quand le canvas est à 200px du viewport
const LAZY_ROOT_MARGIN = '200px';

/**
 * Initializes a Lottie animation with hover pause functionality
 * Only applies pause behavior if element has trigger="hover-pause-lottie"
 */
const initLottieAnimation = (element: Element, dotLottie: DotLottie): LottieInstance | null => {
  // Check if element has the hover-pause trigger attribute
  const hasHoverPauseTrigger =
    (element as HTMLElement).getAttribute('trigger') === 'hover-pause-lottie';

  // Only add hover pause functionality if trigger is present
  if (!hasHoverPauseTrigger) {
    return null;
  }

  // Créer l'instance d'abord pour pouvoir y stocker les delays
  const container = element.parentElement || element;
  const instance: LottieInstance = {
    element,
    dotLottie,
    container,
    hoverPauseDelay: null,
    hoverResumeDelay: null,
  };

  // Pause on hover using GSAP for smooth control
  let isHovered = false;

  const handleMouseEnter = (): void => {
    isHovered = true;

    // Cancel any pending resume
    if (instance.hoverResumeDelay) {
      instance.hoverResumeDelay.kill();
      instance.hoverResumeDelay = null;
    }

    // Pause animation on hover (with optional slight delay for smoothness)
    instance.hoverPauseDelay = gsap.delayedCall(0.1, () => {
      if (isHovered) {
        dotLottie.pause();
      }
    });
  };

  const handleMouseLeave = (): void => {
    isHovered = false;

    // Cancel any pending pause
    if (instance.hoverPauseDelay) {
      instance.hoverPauseDelay.kill();
      instance.hoverPauseDelay = null;
    }

    // Resume animation when mouse leaves
    instance.hoverResumeDelay = gsap.delayedCall(0.1, () => {
      if (!isHovered) {
        dotLottie.play();
      }
    });
  };

  // Stocker les handlers dans l'instance
  instance.handleMouseEnter = handleMouseEnter;
  instance.handleMouseLeave = handleMouseLeave;

  // Add hover event listeners to the canvas or its parent container
  container.addEventListener('mouseenter', handleMouseEnter);
  container.addEventListener('mouseleave', handleMouseLeave);

  return instance;
};

/**
 * Détruit toutes les instances Lottie et nettoie les event listeners
 * Utile pour le cleanup lors d'un changement de page avec Barba.js
 */
export const destroyLottieFiles = (): void => {
  // Couper les observers des Lotties pas encore initialisés
  lottieObservers.forEach((observer) => observer.disconnect());
  lottieObservers.length = 0;

  lottieInstances.forEach((instance) => {
    // Tuer les GSAP delayed calls s'ils existent
    if (instance.hoverPauseDelay) {
      instance.hoverPauseDelay.kill();
      instance.hoverPauseDelay = null;
    }
    if (instance.hoverResumeDelay) {
      instance.hoverResumeDelay.kill();
      instance.hoverResumeDelay = null;
    }

    // Retirer les event listeners
    if (instance.handleMouseEnter && instance.container) {
      instance.container.removeEventListener('mouseenter', instance.handleMouseEnter);
    }
    if (instance.handleMouseLeave && instance.container) {
      instance.container.removeEventListener('mouseleave', instance.handleMouseLeave);
    }

    // Détruire l'instance DotLottie
    try {
      if (instance.dotLottie && typeof instance.dotLottie.destroy === 'function') {
        instance.dotLottie.destroy();
      }
    } catch {
      // Ignorer les erreurs de destruction si l'instance est déjà détruite
    }
  });

  // Vider le tableau
  lottieInstances.length = 0;
};

/**
 * Config de rendu partagée — optimisations perf
 * - devicePixelRatio capé à 1.5 : évite le rendu à 2-3× sur retina (gros gain GPU, perte visuelle minime)
 * - freezeOnOffscreen : auto-pause quand le canvas sort du viewport
 * - useFrameInterpolation: false : skip l'interpolation, allège le CPU
 */
const LOTTIE_RENDER_CONFIG = {
  devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
  freezeOnOffscreen: true,
} as const;

/**
 * Initialise un Lottie avec fade-in une fois chargé
 */
const initLottieWithFadeIn = (canvas: HTMLCanvasElement, url: string): DotLottie => {
  // Cacher le canvas initialement
  gsap.set(canvas, { opacity: 0 });

  const dotLottie = new DotLottie({
    autoplay: true,
    loop: true,
    canvas,
    src: url,
    useFrameInterpolation: false,
    renderConfig: LOTTIE_RENDER_CONFIG,
  });

  // Fade-in une fois chargé
  dotLottie.addEventListener('load', () => {
    gsap.to(canvas, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  return dotLottie;
};

/**
 * Crée l'instance DotLottie + branche le hover-pause éventuel + l'enregistre dans le store.
 * Centralise le pattern dupliqué pour chaque Lottie.
 */
const initInstance = (canvas: HTMLCanvasElement, url: string): void => {
  const dotLottie = initLottieWithFadeIn(canvas, url);
  const instance = initLottieAnimation(canvas, dotLottie);
  if (instance) {
    lottieInstances.push(instance);
  } else {
    lottieInstances.push({
      element: canvas,
      dotLottie,
      container: canvas.parentElement || canvas,
    });
  }
};

/**
 * Init paresseux : on attend que le canvas approche du viewport avant de créer
 * l'instance DotLottie (parse JSON + alloc rendering). Évite de payer ce coût
 * pour les Lotties hors-écran au load (footer, sections basses).
 */
const lazyInitInstance = (canvas: HTMLCanvasElement, url: string): void => {
  // Fallback si IntersectionObserver indisponible (très vieux navigateurs)
  if (typeof IntersectionObserver === 'undefined') {
    initInstance(canvas, url);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();
        initInstance(canvas, url);
        return;
      }
    },
    { rootMargin: LAZY_ROOT_MARGIN }
  );
  observer.observe(canvas);
  lottieObservers.push(observer);
};

export const initLottieFiles = (): void => {
  // Footer Mascotte → lazy : init seulement quand on approche du footer au scroll
  const lottieMascotteFooter = document.querySelector<HTMLCanvasElement>('#lottie-footer');
  if (lottieMascotteFooter) {
    const footerLottieUrl =
      lottieMascotteFooter.dataset.lottieSrc ||
      'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/footer_mascotte-lottie-optimized_03.26.lottie';

    lazyInitInstance(lottieMascotteFooter, footerLottieUrl);
  }

  // Home Hero Mascotte
  const lottieMascotteHomeHero = document.querySelector<HTMLCanvasElement>('#lottie-home-hero');
  if (lottieMascotteHomeHero) {
    // Vérifier si déjà initialisé par le preloader
    const alreadyInitialized =
      lottieMascotteHomeHero.getAttribute('data-preloader-initialized') === 'true';

    if (!alreadyInitialized) {
      // Hero mascotte → eager : c'est au-dessus de la ligne de flottaison sur la home
      const homeHeroLottieUrl =
        lottieMascotteHomeHero.dataset.lottieSrc ||
        'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/hero_mascotte-lottie-optimized%20-%2003.26.lottie';

      initInstance(lottieMascotteHomeHero, homeHeroLottieUrl);
    }
    // Si déjà initialisé par le preloader, on skip - le preloader gère l'instance
  }

  // Home Hero Background → eager : Lottie central du hero, doit être prêt ASAP.
  // setLayout exige l'instance brute, donc on n'utilise pas initInstance ici.
  const lottieHomeHeroBg = document.querySelector<HTMLCanvasElement>('#lottie-home-hero-bg');
  if (lottieHomeHeroBg) {
    const homeHeroBgUrl =
      lottieHomeHeroBg.dataset.lottieSrc ||
      'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/home_hero/hero_all-04.26.json';

    // Canvas en 9:5.5, JSON couvre 100% du container
    Object.assign(lottieHomeHeroBg.style, {
      width: '100%',
      height: 'auto',
      aspectRatio: '9 / 5.5',
      display: 'block',
    });

    const dotLottieHomeHeroBg = initLottieWithFadeIn(lottieHomeHeroBg, homeHeroBgUrl);
    dotLottieHomeHeroBg.setLayout({ fit: 'contain', align: [0.5, 0.5] });

    const instance = initLottieAnimation(lottieHomeHeroBg, dotLottieHomeHeroBg);
    if (instance) {
      lottieInstances.push(instance);
    } else {
      lottieInstances.push({
        element: lottieHomeHeroBg,
        dotLottie: dotLottieHomeHeroBg,
        container: lottieHomeHeroBg.parentElement || lottieHomeHeroBg,
      });
    }
  }

  // Home Hero — éléments décoratifs (whale, fire, cascade, clouds, eagle, glider)
  // Désactivé : remplacé par une vidéo dans le hero (trop lourd à 6 Lotties simultanés).
  // Passer ENABLE_HOME_HERO_LOTTIES à true pour réactiver.
  const ENABLE_HOME_HERO_LOTTIES = false;
  const HOME_HERO_LOTTIES: Array<{ id: string; url: string }> = [
    {
      id: 'lottie-home-whale',
      url: 'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/home_hero/hero_whale-04.26.json',
    },
    {
      id: 'lottie-home-fire',
      url: 'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/home_hero/hero_fire-04.26.json',
    },
    {
      id: 'lottie-home-cascade',
      url: 'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/home_hero/hero_cascade-04.26.json',
    },
    {
      id: 'lottie-home-clouds',
      url: 'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/home_hero/hero_clouds-04.26.json',
    },
    {
      id: 'lottie-home-eagle',
      url: 'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/home_hero/hero_eagle-04.26.json',
    },
    {
      id: 'lottie-home-glider',
      url: 'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/home_hero/hero_glider-04.26.json',
    },
  ];

  if (ENABLE_HOME_HERO_LOTTIES) {
    // Décoratives du hero → lazy : 6 Lotties simultanés, on échelonne via IO
    HOME_HERO_LOTTIES.forEach(({ id, url }) => {
      const canvas = document.querySelector<HTMLCanvasElement>(`#${id}`);
      if (!canvas) return;

      const lottieUrl = canvas.dataset.lottieSrc || url;
      lazyInitInstance(canvas, lottieUrl);
    });
  }

  // Also initialize any other Lottie elements with trigger="hover-pause-lottie"
  const lottieElementsWithTrigger = document.querySelectorAll<HTMLCanvasElement>(
    '[trigger="hover-pause-lottie"]'
  );

  const homeHeroIds = new Set(HOME_HERO_LOTTIES.map(({ id }) => id));

  lottieElementsWithTrigger.forEach((element) => {
    // Skip if already processed above (by ID)
    if (
      element.id === 'lottie-footer' ||
      element.id === 'lottie-home-hero' ||
      homeHeroIds.has(element.id)
    ) {
      return;
    }

    // Get URL from data attribute (required for elements found only by trigger)
    const lottieUrl = element.dataset.lottieSrc;
    if (!lottieUrl) {
      console.error(
        'Lottie element with trigger="hover-pause-lottie" found but no data-lottie-src attribute specified.',
        element
      );
      return;
    }

    // Hover-pause générique → lazy : pas critique au load, dispatch un peu partout
    lazyInitInstance(element, lottieUrl);
  });
};
