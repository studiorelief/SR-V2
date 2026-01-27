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

export const initLottieFiles = (): void => {
  // Footer Mascotte
  const lottieMascotteFooter = document.querySelector<HTMLCanvasElement>('#lottie-footer');
  if (lottieMascotteFooter) {
    const footerLottieUrl =
      lottieMascotteFooter.dataset.lottieSrc ||
      'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/Assets/Studio%20Relief%20-%20V2/lottie_mascotte-footer.lottie';

    const dotLottieFooter = initLottieWithFadeIn(lottieMascotteFooter, footerLottieUrl);

    // Stocker l'instance (avec ou sans hover)
    const instance = initLottieAnimation(lottieMascotteFooter, dotLottieFooter);
    if (instance) {
      lottieInstances.push(instance);
    } else {
      lottieInstances.push({
        element: lottieMascotteFooter,
        dotLottie: dotLottieFooter,
        container: lottieMascotteFooter.parentElement || lottieMascotteFooter,
      });
    }
  }

  // Home Hero Mascotte
  const lottieMascotteHomeHero = document.querySelector<HTMLCanvasElement>('#lottie-home-hero');
  if (lottieMascotteHomeHero) {
    // Vérifier si déjà initialisé par le preloader
    const alreadyInitialized =
      lottieMascotteHomeHero.getAttribute('data-preloader-initialized') === 'true';

    if (!alreadyInitialized) {
      const homeHeroLottieUrl =
        lottieMascotteHomeHero.dataset.lottieSrc ||
        'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/Assets/Studio%20Relief%20-%20V2/lottie_mascotte-home-hero.lottie';

      const dotLottieHomeHero = initLottieWithFadeIn(lottieMascotteHomeHero, homeHeroLottieUrl);

      // Stocker l'instance (avec ou sans hover)
      const instance = initLottieAnimation(lottieMascotteHomeHero, dotLottieHomeHero);
      if (instance) {
        lottieInstances.push(instance);
      } else {
        lottieInstances.push({
          element: lottieMascotteHomeHero,
          dotLottie: dotLottieHomeHero,
          container: lottieMascotteHomeHero.parentElement || lottieMascotteHomeHero,
        });
      }
    }
    // Si déjà initialisé par le preloader, on skip - le preloader gère l'instance
  }

  // Also initialize any other Lottie elements with trigger="hover-pause-lottie"
  const lottieElementsWithTrigger = document.querySelectorAll<HTMLCanvasElement>(
    '[trigger="hover-pause-lottie"]'
  );

  lottieElementsWithTrigger.forEach((element) => {
    // Skip if already processed above (by ID)
    if (element.id === 'lottie-footer' || element.id === 'lottie-home-hero') {
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

    const dotLottie = initLottieWithFadeIn(element, lottieUrl);

    const instance = initLottieAnimation(element, dotLottie);
    if (instance) {
      lottieInstances.push(instance);
    } else {
      lottieInstances.push({
        element,
        dotLottie,
        container: element.parentElement || element,
      });
    }
  });
};
