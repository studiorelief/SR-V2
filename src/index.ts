/*
 *==========================================
 * GLOBAL - IMPORT
 *==========================================
 */

import './index.css';

import barba from '@barba/core';
import { restartWebflow } from '@finsweet/ts-utils';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 *==========================================
 * FUNCTION - IMPORT
 *==========================================
 */

import { initGlobalHero } from '$utils/barba/barbaGlobalHero';
import { enterAnimation, leaveAnimation } from '$utils/barba/barbaTransitions';
import { destroyAllButtons, initButtonHover } from '$utils/component/global/button';
import {
  /* destroyAllCtaHeadings, */
  destroyAllCtaAnimations,
  initCtaAnimation,
  initCtaHeading,
} from '$utils/component/global/cta';
import { initCtaFixed } from '$utils/component/global/ctaFixed';
import { destroyAllDraggables, initDraggable } from '$utils/component/global/draggable';
import { initFooter } from '$utils/component/global/footer';
import { initNavbar } from '$utils/component/global/navbar';
import { destroyAllStickers, initSticker } from '$utils/component/global/sticker';
import { initClientLoop } from '$utils/component/section/clientsLoop';
import { initReviewSlider } from '$utils/component/section/reviewSlider';
import { initScrollTop } from '$utils/global/animations/scrollTop';
import { initSunHeroParallax } from '$utils/global/animations/sunHero';
import { /* destroyAllTextPaths, */ initTextPath } from '$utils/global/animations/textPath';
// import { initMarker } from '$utils/global/script/marker';
import { initHomeHeroSun } from '$utils/page/hero/homeHeroV2';
// import { initCloudAnimations } from '$utils/page/hero/homeHero';

/*
 *==========================================
 * CALL - GLOBAL FUNCTIONS
 *==========================================
 */

const initGlobalFunctions = (): void => {
  // initMarker();
  initScrollTop();
  initFooter();

  // Global Animations

  initTextPath();
  initSunHeroParallax();

  // Utilise un double requestAnimationFrame pour s'assurer que tous les ScrollTriggers sont créés
  // avant de faire le refresh global. Cela évite les glitches au refresh de page au milieu.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      initButtonHover();
      initCtaHeading();
      initCtaAnimation();
      initCtaFixed();
      initDraggable();
      initSticker();
    });
  });
};

// Call on first load
initGlobalFunctions();
initGlobalHero(); // Animation hero au premier chargement (sans transition Barba)

// Navbar is initialized once and persists across page transitions
initNavbar();

/*
 *==========================================
 * BARBA
 * ↳ TRANSITIONS
 *==========================================
 */

barba.init({
  preventRunning: true,
  transitions: [
    {
      name: 'swap-transition',
      leave(data: { current: { container: HTMLElement } }) {
        return leaveAnimation(data);
      },
      enter(data: { next: { container: HTMLElement } }) {
        ScrollTrigger.refresh();
        return enterAnimation(data);
      },
    },
    {
      name: 'self',
      leave(data: { current: { container: HTMLElement }; next: { url: { hash: string } } }) {
        // Ne pas exécuter l'animation si c'est une ancre vers la page
        if (data.next.url.hash) {
          return Promise.resolve();
        }
        return leaveAnimation(data);
      },
      enter(data: { next: { container: HTMLElement; url: { hash: string } } }) {
        // Ne pas exécuter l'animation si c'est une ancre vers la page
        if (data.next.url.hash) {
          return Promise.resolve();
        }
        return enterAnimation(data);
      },
    },
  ],

  /*
   *==========================================
   * BARBA
   * ↳ VIEWS
   *==========================================
   */

  views: [
    {
      namespace: 'home',
      beforeEnter() {
        // initCloudAnimations();
        initHomeHeroSun();
        initClientLoop();
        initReviewSlider();
      },
    },
    {
      namespace: 'expertises',
      beforeEnter() {},
    },
  ],
});

/*
 *==========================================
 * BARBA
 * ↳ HOOKS
 *==========================================
 */

barba.hooks.beforeLeave(() => {
  // Nettoyer les instances de boutons avant de quitter la page

  destroyAllButtons();
  // destroyAllCtaHeadings();
  destroyAllCtaAnimations();
  destroyAllDraggables();
  destroyAllStickers();
  // destroyAllTextPaths();
});

barba.hooks.enter(() => {
  initGlobalFunctions();

  // initGlobalHero est maintenant appelé dans enterAnimation (barbaTransitions.ts)
  requestAnimationFrame(() => {
    restartWebflow();
  });
});
