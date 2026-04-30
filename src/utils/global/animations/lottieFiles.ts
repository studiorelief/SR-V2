import type { DotLottie as DotLottieType } from '@lottiefiles/dotlottie-web';
import gsap from 'gsap';

// DotLottie est chargé dynamiquement (~556 KB). Le chunk n'est téléchargé
// que sur les pages avec au moins un canvas Lottie (footer ou hover-pause).
type DotLottie = DotLottieType;
type DotLottieCtor = typeof DotLottieType;
let dotLottiePromise: Promise<DotLottieCtor> | null = null;
let DotLottieCtor: DotLottieCtor | null = null;
const loadDotLottie = (): Promise<DotLottieCtor> => {
  if (!dotLottiePromise) {
    dotLottiePromise = import('@lottiefiles/dotlottie-web').then((m) => {
      DotLottieCtor = m.DotLottie;
      return m.DotLottie;
    });
  }
  return dotLottiePromise;
};

interface LottieInstance {
  element: Element;
  dotLottie: DotLottie;
  container: Element;
  handleMouseEnter?: () => void;
  handleMouseLeave?: () => void;
  hoverPauseDelay?: gsap.core.Tween | null;
  hoverResumeDelay?: gsap.core.Tween | null;
}

const lottieInstances: LottieInstance[] = [];

// Observers actifs pour les Lotties en lazy init (à disconnect au cleanup)
const lottieObservers: IntersectionObserver[] = [];

// Marge de pré-chargement : on init le Lottie quand le canvas est à 200px du viewport
const LAZY_ROOT_MARGIN = '200px';

/**
 * Branche le hover-pause sur un canvas Lottie si l'attribut `trigger="hover-pause-lottie"`
 * est présent. Renvoie l'instance enrichie, ou null si aucun hover-pause.
 */
const initLottieAnimation = (element: Element, dotLottie: DotLottie): LottieInstance | null => {
  if ((element as HTMLElement).getAttribute('trigger') !== 'hover-pause-lottie') {
    return null;
  }

  const container = element.parentElement || element;
  const instance: LottieInstance = {
    element,
    dotLottie,
    container,
    hoverPauseDelay: null,
    hoverResumeDelay: null,
  };

  let isHovered = false;

  const handleMouseEnter = (): void => {
    isHovered = true;
    if (instance.hoverResumeDelay) {
      instance.hoverResumeDelay.kill();
      instance.hoverResumeDelay = null;
    }
    instance.hoverPauseDelay = gsap.delayedCall(0.1, () => {
      if (isHovered) dotLottie.pause();
    });
  };

  const handleMouseLeave = (): void => {
    isHovered = false;
    if (instance.hoverPauseDelay) {
      instance.hoverPauseDelay.kill();
      instance.hoverPauseDelay = null;
    }
    instance.hoverResumeDelay = gsap.delayedCall(0.1, () => {
      if (!isHovered) dotLottie.play();
    });
  };

  instance.handleMouseEnter = handleMouseEnter;
  instance.handleMouseLeave = handleMouseLeave;

  container.addEventListener('mouseenter', handleMouseEnter);
  container.addEventListener('mouseleave', handleMouseLeave);

  return instance;
};

/**
 * Détruit toutes les instances Lottie et nettoie les event listeners.
 * Appelé au changement de page par Swup.
 */
export const destroyLottieFiles = (): void => {
  lottieObservers.forEach((observer) => observer.disconnect());
  lottieObservers.length = 0;

  lottieInstances.forEach((instance) => {
    if (instance.hoverPauseDelay) {
      instance.hoverPauseDelay.kill();
      instance.hoverPauseDelay = null;
    }
    if (instance.hoverResumeDelay) {
      instance.hoverResumeDelay.kill();
      instance.hoverResumeDelay = null;
    }

    if (instance.handleMouseEnter && instance.container) {
      instance.container.removeEventListener('mouseenter', instance.handleMouseEnter);
    }
    if (instance.handleMouseLeave && instance.container) {
      instance.container.removeEventListener('mouseleave', instance.handleMouseLeave);
    }

    try {
      if (instance.dotLottie && typeof instance.dotLottie.destroy === 'function') {
        instance.dotLottie.destroy();
      }
    } catch {
      // Instance déjà détruite — ignorer.
    }
  });

  lottieInstances.length = 0;
};

/**
 * Config de rendu partagée — optimisations perf
 * - devicePixelRatio capé à 1.5 : évite le rendu à 2-3× sur retina (gros gain GPU, perte visuelle minime)
 * - freezeOnOffscreen : auto-pause quand le canvas sort du viewport
 */
const LOTTIE_RENDER_CONFIG = {
  devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
  freezeOnOffscreen: true,
} as const;

/**
 * Crée l'instance DotLottie + fade-in une fois chargée.
 * Tous les Lotties restants (footer + hover-pause) bouclent ; freezeOnOffscreen
 * gère la pause hors viewport (donc 0 coût CPU pour Lighthouse, qui ne scrolle pas).
 */
const initLottieWithFadeIn = (canvas: HTMLCanvasElement, url: string): DotLottie => {
  if (!DotLottieCtor) {
    throw new Error('[lottieFiles] DotLottie ctor non chargé. Appeler loadDotLottie() avant.');
  }

  gsap.set(canvas, { opacity: 0 });

  const dotLottie = new DotLottieCtor({
    autoplay: true,
    loop: true,
    canvas,
    src: url,
    useFrameInterpolation: false,
    renderConfig: LOTTIE_RENDER_CONFIG,
  });

  dotLottie.addEventListener('load', () => {
    gsap.to(canvas, { opacity: 1, duration: 0.3, ease: 'power2.out' });
  });

  return dotLottie;
};

/**
 * Crée l'instance DotLottie + branche le hover-pause éventuel + l'enregistre dans le store.
 */
const initInstance = (canvas: HTMLCanvasElement, url: string): void => {
  const dotLottie = initLottieWithFadeIn(canvas, url);
  const instance = initLottieAnimation(canvas, dotLottie);
  lottieInstances.push(
    instance ?? {
      element: canvas,
      dotLottie,
      container: canvas.parentElement || canvas,
    }
  );
};

/**
 * Init paresseux : on attend que le canvas approche du viewport avant de créer
 * l'instance DotLottie. Évite de payer le coût (parse JSON + alloc rendering)
 * pour les Lotties hors-écran au load.
 */
const lazyInitInstance = (canvas: HTMLCanvasElement, url: string): void => {
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

const FOOTER_LOTTIE_URL =
  'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/SR_assets/lotties/footer_mascotte-lottie-optimized_03.26.lottie';

export const initLottieFiles = async (): Promise<void> => {
  // Early-exit : si aucun canvas Lottie sur la page, on ne charge pas le SDK.
  const hasAnyLottie =
    document.querySelector('#lottie-footer, [trigger="hover-pause-lottie"]') !== null;
  if (!hasAnyLottie) return;

  await loadDotLottie();

  // Footer mascotte → lazy : init seulement quand on approche du footer au scroll
  const lottieMascotteFooter = document.querySelector<HTMLCanvasElement>('#lottie-footer');
  if (lottieMascotteFooter) {
    const footerLottieUrl = lottieMascotteFooter.dataset.lottieSrc || FOOTER_LOTTIE_URL;
    lazyInitInstance(lottieMascotteFooter, footerLottieUrl);
  }

  // Lotties génériques avec trigger="hover-pause-lottie" (hors footer)
  const lottieElementsWithTrigger = document.querySelectorAll<HTMLCanvasElement>(
    '[trigger="hover-pause-lottie"]'
  );

  lottieElementsWithTrigger.forEach((element) => {
    if (element.id === 'lottie-footer') return;

    const lottieUrl = element.dataset.lottieSrc;
    if (!lottieUrl) {
      console.error(
        'Lottie element with trigger="hover-pause-lottie" found but no data-lottie-src attribute specified.',
        element
      );
      return;
    }

    lazyInitInstance(element, lottieUrl);
  });
};
