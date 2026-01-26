/*
 *==========================================
 ! TODO :
 * [ ] Issue on Scroll Top when Blog inner > Other
  *      ↳ Sûrement lié aux scripts de Finsweet Attributes
  *      ↳ Conflit avec toc
  *           ↳ Issue vient de fs-toc-offsettop="1.875rem" -> Retoré mais à fix côté webflow (+ scroll smooth)
  *           ↳ Links are anchor
 * [ ] Fix LottieFiles issue on Anchor Links (interne) -> Ex Home & Portfolio Kill Lottie (14.01.2026)
 *      ↳ Check Self in Transitions
 * [ ] Refactor Footer Slider in Swiper (+ ratio cards) - Hover effect (on/off)
 *==========================================
 */

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
import { initEnterAnimation, initLeaveAnimation } from '$utils/barba/barbaTransitions';
import {
  destroyCardVideoPlayer,
  initCardVideoPlayer,
} from '$utils/component/cards/cardVideoPlayer';
import { initBeforeAfter } from '$utils/component/global/beforeAfter';
import { destroyAllButtons, initButtonHover } from '$utils/component/global/button';
import { initCtaFixed } from '$utils/component/global/ctaFixed';
import { destroyAllDraggables, initDraggable } from '$utils/component/global/draggable';
import { initFooter } from '$utils/component/global/footer';
import {
  initInnerHighlight,
  initNavbar,
  initNavbarHighlight,
} from '$utils/component/global/navbar';
import { initScrollbar } from '$utils/component/global/scrollbar';
import { initSticker } from '$utils/component/global/sticker';
import { initAllAnchorFills } from '$utils/component/section/anchor';
import { destroyClientLoop, initClientLoop } from '$utils/component/section/clientsLoop';
import {
  destroyAllCtaAnimations,
  initCtaAnimation,
  initCtaHeading /* destroyAllCtaHeadings, */,
} from '$utils/component/section/cta';
import { initCmsCardsSlider } from '$utils/component/sliders/cmsCardsSlider';
import { initCmsProjetsSlider } from '$utils/component/sliders/cmsProjetsSlider';
import { initReviewSlider } from '$utils/component/sliders/reviewSlider';
import {
  destroyAccordionScrollTrigger,
  initAccordionScrollTrigger,
} from '$utils/global/animations/accordionScrollTrigger';
import { destroyLottieFiles, initLottieFiles } from '$utils/global/animations/lottieFiles';
import { initScrollTop } from '$utils/global/animations/scrollTop';
import { initSunHeroParallax } from '$utils/global/animations/sunHero';
import { initTextPath /* destroyAllTextPaths, */ } from '$utils/global/animations/textPath';
import { initCustomFavicon } from '$utils/global/brand/customFav';
import { initCmsSummaryFade } from '$utils/global/optimisations/cmsRt';
import {
  destroyFsAttributesScripts,
  initFsAttributesScripts,
  restartFsAttributesModules,
} from '$utils/global/script/loadFsAttributes';
import { initFsLibrairiesScripts } from '$utils/global/script/loadFsLibrairies';
import { destroyHomeHero, initHomeHero } from '$utils/page/hero/homeHero';
import { destroyMonkeyFall, initMonkeyFall } from '$utils/page/home/monkeyFall';
// import { initCloudAnimations } from '$utils/page/hero/homeHero';
// import { initMarker } from '$utils/global/script/marker';

/*
 *==========================================
 * CALL - GLOBAL FUNCTIONS
 *==========================================
 */

const initGlobalFunctions = (): void => {
  // Global Animations
  initScrollTop();
  initFooter();
  initCmsSummaryFade();
  initTextPath();
  initSunHeroParallax();
  initSticker();
  initAllAnchorFills();

  // Lottie Files
  initLottieFiles();

  // Components
  initBeforeAfter();
  initClientLoop();

  // Home
  initHomeHero();
  initMonkeyFall();

  // Navbar
  initNavbarHighlight();
  initInnerHighlight();

  // Sliders
  initCmsCardsSlider();
  initCmsProjetsSlider();
  initReviewSlider();

  // Scripts
  initFsAttributesScripts();
  initFsLibrairiesScripts(
    'https://cdn.jsdelivr.net/npm/@finsweet/attributes-accordion@1/accordion.js'
  );

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      initButtonHover();
      initDraggable();
      initCtaFixed();
      initCtaHeading();
      initAccordionScrollTrigger();
      initCardVideoPlayer();
      initScrollbar();
    });
  });
};

barba.hooks.ready(() => {
  initGlobalFunctions();
  initGlobalHero();
  initNavbar();
});

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
      // once(data: { next: { container: HTMLElement } }) {
      //   return --> Animation de preloader
      // },
      leave(data: { current: { container: HTMLElement } }) {
        return initLeaveAnimation(data);
      },
      enter(data: { next: { container: HTMLElement } }) {
        return initEnterAnimation(data);
      },
    },
    // {
    //   name: 'self',
    //   leave(data: { current: { container: HTMLElement }; next: { url: { hash: string } } }) {
    //     if (data.next.url.hash) {
    //       return Promise.resolve();
    //     }
    //     return initLeaveAnimation(data);
    //   },
    //   enter(data: { next: { container: HTMLElement; url: { hash: string } } }) {
    //     if (data.next.url.hash) {
    //       return Promise.resolve();
    //     }
    //     return initEnterAnimation(data);
    //   },
    // },
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
      enter() {},
      afterEnter() {},
      afterLeave() {
        destroyHomeHero();
        destroyMonkeyFall();
        destroyClientLoop();
      },
    },
    // {
    //   namespace: 'expertises',
    //   beforeEnter() {},
    //   afterEnter() {},
    // },
    // {
    //   namespace: 'blog',
    //   beforeEnter() {},
    //   afterEnter() {},
    // },
    // {
    //   namespace: 'cms-blog',
    //   beforeEnter() {},
    //   afterEnter() {},
    // },
    // {
    //   namespace: 'cms-portfolio',
    //   beforeEnter() {},
    //   afterEnter() {},
    // },
  ],
});

/*
 *==========================================
 * BARBA
 * ↳ HOOKS
 *==========================================
 */

// afterLeave : le rideau couvre l'écran, on peut détruire sans glitch visuel
barba.hooks.afterLeave(() => {
  // Kill ALL ScrollTriggers to prevent memory leaks
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  destroyAllButtons();
  destroyAllCtaAnimations();
  destroyAllDraggables();
  destroyLottieFiles();
  destroyFsAttributesScripts();
  destroyAccordionScrollTrigger();
  destroyCardVideoPlayer();
});

barba.hooks.enter(() => {
  initGlobalFunctions();
  requestAnimationFrame(() => {
    restartWebflow();
    if (barba.history.previous) {
      restartFsAttributesModules();
    }
  });
});

barba.hooks.afterEnter(() => {
  requestAnimationFrame(() => {
    initCtaAnimation();
    initCustomFavicon();
  });
});
