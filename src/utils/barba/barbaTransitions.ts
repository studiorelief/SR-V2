import gsap from 'gsap';

import { animateGlobalHeroLeave, setupAndAnimateGlobalHero } from '$utils/barba/barbaGlobalHero';

/**
 * Animation de transition "Curved Curtain"
 *
 * Le rideau monte pour couvrir l'écran (Leave: Bas -> Haut avec courbe inversée),
 * puis continue de monter pour dévoiler la nouvelle page (Enter: Bas -> Haut).
 */

/*
 *============================================================================
 * TYPES
 *============================================================================
 */

interface BarbaLeaveData {
  current: { container: HTMLElement };
}

interface BarbaEnterData {
  next: { container: HTMLElement };
}

/*
 *============================================================================
 * SVG PATHS
 *============================================================================
 */

// --- PATHS POUR LEAVE (Montée simple) ---
// Ancrés en bas (M 0 100 ... L 0 100 Z)
// Courbe en arche avec Bézier cubique (C) - points de contrôle à 16% et 84%

const leave_start = 'M 0 100 V 100 C 16 100 84 100 100 100 V 100 L 0 100 Z'; // Plat en bas (Caché)
const leave_mid = 'M 0 100 V 50 C 16 0 84 0 100 50 V 100 L 0 100 Z'; // Arche vers le haut
const leave_end = 'M 0 100 V 0 C 16 0 84 0 100 0 V 100 L 0 100 Z'; // Plein écran

// --- PATHS POUR ENTER (Sortie avec courbe "ventre") ---
// Ancrés en haut (M 0 0 ... L 0 0 Z)
// Courbe en arche inversée avec Bézier cubique (C)

const enter_start = 'M 0 0 V 100 C 16 100 84 100 100 100 V 0 L 0 0 Z'; // Plein écran (Bottom plat)
const enter_mid = 'M 0 0 V 50 C 16 100 84 100 100 50 V 0 L 0 0 Z'; // Arche avec ventre vers le bas
const enter_end = 'M 0 0 V 0 C 16 0 84 0 100 0 V 0 L 0 0 Z'; // Plat en haut (Caché)

/*
 *============================================================================
 * TRANSITIONS
 *============================================================================
 */

/**
 * Leave transition - Curved curtain rises to cover the screen
 * @param data - Barba.js leave hook data containing the current container
 * @returns Promise that resolves when the animation is complete
 */
export const initLeaveAnimation = (data: BarbaLeaveData): Promise<void> => {
  return new Promise((resolve) => {
    const transitionComponent = document.querySelector('.transition_component') as HTMLElement;
    const path = document.querySelector('.overlay--background') as SVGPathElement;
    const logo = document.querySelector('.transition_logo') as HTMLElement;

    const tl = gsap.timeline({
      onComplete: resolve,
    });

    // Si les éléments de transition ne sont pas trouvés, résoudre immédiatement
    if (!transitionComponent || !path) {
      // console.warn('[Barba] Transition elements not found in leave, using fallback');
      tl.to({}, { duration: 0.1 });
      return;
    }

    // 1. Setup
    tl.set(transitionComponent, { display: 'flex', autoAlpha: 1 });
    tl.set(path, { attr: { d: leave_start } }); // Départ du bas

    if (logo) {
      tl.set(logo, { scale: 1, autoAlpha: 1, y: '50vh' }); // Logo en bas, prêt à monter
    }

    // 2. Montée (Cover)
    tl.to(path, {
      attr: { d: leave_mid },
      duration: 0.4,
      ease: 'power2.in',
    });
    tl.to(path, {
      attr: { d: leave_end },
      duration: 0.3,
      ease: 'power2.out',
    });

    // 3. Animation hero leave (suns descendent) - en même temps que le path
    // Revient au début de l'animation du path (0.4 + 0.3 = 0.7s en arrière)
    animateGlobalHeroLeave(tl, '-=0.7');

    // 4. Logo monte du bas vers le centre
    if (logo) {
      tl.to(
        logo,
        {
          y: '0vh',
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.5'
      );
    }

    // 5. Hide current container
    tl.set(data.current.container, { display: 'none' });
  });
};

/**
 * Enter transition - Curved curtain rises to reveal the new page
 * @param data - Barba.js enter hook data containing the next container
 * @param onAnimationComplete - Optional callback called exactly when the animation completes
 * @returns Promise that resolves when the animation is complete
 */
export const initEnterAnimation = (
  data: BarbaEnterData,
  onAnimationComplete?: () => void
): Promise<void> => {
  return new Promise((resolve) => {
    const transitionComponent = document.querySelector('.transition_component') as HTMLElement;
    const path = document.querySelector('.overlay--background') as SVGPathElement;
    const logo = document.querySelector('.transition_logo') as HTMLElement;

    const tl = gsap.timeline({
      onComplete: () => {
        if (transitionComponent) {
          gsap.set(transitionComponent, { display: 'none', autoAlpha: 0 });
        }
        // Reset logo pour la prochaine transition
        if (logo) {
          gsap.set(logo, { clearProps: 'y,scale,autoAlpha' });
        }
        gsap.set(data.next.container, { clearProps: 'all' });
        // Appeler le callback synchronisé avec la fin de l'animation
        onAnimationComplete?.();
        resolve();
      },
    });

    // Si les éléments de transition ne sont pas trouvés, résoudre après un délai minimal
    if (!transitionComponent || !path) {
      // console.warn('[Barba] Transition elements not found in enter, using fallback');
      tl.to({}, { duration: 0.1 });
      return;
    }

    // 1. Swap Path (Invisible car les deux sont plein écran)
    tl.set(path, { attr: { d: enter_start } });

    // 2. Scroll to top (synchrone, avant que Finsweet ne puisse interférer)
    tl.call(() => {
      window.scrollTo(0, 0);
      if (document.scrollingElement) {
        (document.scrollingElement as HTMLElement).scrollTop = 0;
      }
      // Force scroll using multiple methods for maximum compatibility
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
          document.documentElement.scrollLeft = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
          document.body.scrollLeft = 0;
        }
        // Also try scrollingElement for modern browsers
        if (document.scrollingElement) {
          (document.scrollingElement as HTMLElement).scrollTop = 0;
          (document.scrollingElement as HTMLElement).scrollLeft = 0;
        }
      });
    });

    // 3. Logo animations (démarrent ensemble après 0.2s pause)
    if (logo) {
      // Scale + AutoAlpha
      tl.to(
        logo,
        {
          scale: 4,
          autoAlpha: 0,
          duration: 0.4,
          ease: 'power2.in',
        },
        '+=0.2' // Attend 0.2s après la position actuelle
      );

      // Y - plus lent, démarre en même temps que scale/autoAlpha
      tl.to(
        logo,
        {
          y: '-50vh',
          duration: 0.5,
          ease: 'power2.in',
        },
        '<' // '<' = même position de départ que l'animation précédente
      );
    }

    // 4. Sortie vers le haut (Uncover)
    tl.to(
      path,
      {
        attr: { d: enter_mid },
        duration: 0.3,
        ease: 'power2.in',
      },
      logo ? '>-0.3' : '0' // Démarre plus tôt (overlap de 0.3s)
    );

    tl.to(path, {
      attr: { d: enter_end },
      duration: 0.3,
      ease: 'power2.out',
    });

    // 5. Setup + Animation hero (pendant que le rideau se lève)
    setupAndAnimateGlobalHero(tl, '<');
  });
};
