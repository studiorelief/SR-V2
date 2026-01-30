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

// import { restartWebflow } from '@finsweet/ts-utils';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// console.log('[SR-V2] Script loaded');

/*
 *==========================================
 * FUNCTION - IMPORT
 *==========================================
 */

import { destroyCardHoverIcon, initCardHoverIcon } from '$utils/component/cards/cardHoverIcon';
import {
  destroyCardVideoPlayer,
  initCardVideoPlayer,
} from '$utils/component/cards/cardVideoPlayer';
import { initAiShare } from '$utils/component/global/aiShare';
import { initBeforeAfter } from '$utils/component/global/beforeAfter';
import { destroyAllButtons, initButtonHover } from '$utils/component/global/button';
import { initCtaFixed, initCtaText } from '$utils/component/global/ctaFixed';
import { destroyAllDraggables, initDraggable } from '$utils/component/global/draggable';
import { initFooter } from '$utils/component/global/footer';
import {
  initInnerHighlight,
  initNavbar,
  initNavbarCurrentState,
  initNavbarHighlight,
} from '$utils/component/global/navbar';
import { initScrollbar } from '$utils/component/global/scrollbar';
import { initSocialShare } from '$utils/component/global/socialShare';
import { initSticker } from '$utils/component/global/sticker';
import { initAllAnchorFills } from '$utils/component/section/anchor';
import { destroyClientLoop, initClientLoop } from '$utils/component/section/clientsLoop';
import {
  destroyAllCtaAnimations,
  initCtaAnimation,
  initCtaHeading,
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
import { initTextPath } from '$utils/global/animations/textPath';
import { initCustomFavicon } from '$utils/global/brand/customFav';
import { initCmsSummaryFade } from '$utils/global/optimisations/cmsRt';
import { hideDynListIfEmpty } from '$utils/global/optimisations/hideEmptyCMS';
import { destroyLazyVideos, initLazyVideos } from '$utils/global/optimisations/lazyVideo';
import { initPreloader } from '$utils/global/preloader/preloader';
import {
  destroyFsAttributesScripts,
  initFsAttributesScripts,
  restartFsAttributesModules,
} from '$utils/global/script/loadFsAttributes';
import { initFsLibrairiesScripts } from '$utils/global/script/loadFsLibrairies';
import {
  destroyCmsPortfolioParallax,
  initAnimateCmsPortfolioHero,
  initCmsPortfolioHero,
  initCmsPortfolioParallax,
  initSetupCmsPortfolioHero,
} from '$utils/page/hero/cmsPortfolioHero';
import { destroyHomeHero, initHomeHero } from '$utils/page/hero/homeHero';
import { destroyMonkeyFall, initMonkeyFall } from '$utils/page/home/monkeyFall';
import { initGlobalHero } from '$utils/swup/swupGlobalHero';
import { initSwup } from '$utils/swup/swupInit';
import {
  registerNamespace,
  runNamespaceAnimate,
  runNamespaceInit,
  runNamespaceSetup,
} from '$utils/swup/swupNamespaces';

/*
 *==========================================
 * CALL - GLOBAL FUNCTIONS
 *==========================================
 */

const initGlobalFunctions = (): void => {
  // Global Animations
  initScrollTop();
  initFooter();
  initTextPath();
  initSunHeroParallax();
  initSticker();
  initAllAnchorFills();

  // Optimisations
  hideDynListIfEmpty();
  initCmsSummaryFade();
  initLazyVideos();

  // Lottie Files
  initLottieFiles();

  // Components
  initAiShare();
  initBeforeAfter();
  initClientLoop();
  initSocialShare();

  // Home
  initMonkeyFall();
  initHomeHero();

  // Portfolio CMS - géré par namespace dans visit:end
  initSetupCmsPortfolioHero();

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
      initCardHoverIcon();
      initScrollbar();
    });
  });
};

/*
 *==========================================
 * SWUP
 * ↳ NAMESPACES REGISTRY
 *==========================================
 */

registerNamespace('cms-portfolio', {
  setup: initSetupCmsPortfolioHero,
  animate: () => {
    initAnimateCmsPortfolioHero();
    initCmsPortfolioParallax();
  },
  init: () => {
    initCmsPortfolioHero();
    initCmsPortfolioParallax();
  },
});

/*
 *==========================================
 * SWUP
 * ↳ INITIALIZATION
 *==========================================
 */

/**
 * Équivalent de barba.hooks.ready()
 * Premier chargement de la page + initialisation Swup
 */
const init = () => {
  // Preloader - doit être initialisé en premier (uniquement première visite)
  initPreloader();

  // Init global functions on first load
  initGlobalFunctions();
  initGlobalHero();
  initNavbar();
  initCtaText();

  // Animations spécifiques par namespace (premier chargement)
  runNamespaceInit();

  // Animations visuelles (premier chargement)
  requestAnimationFrame(() => {
    initCtaAnimation();
    initCustomFavicon();
  });

  // Initialize Swup after DOM is ready
  const swup = initSwup();

  /*
   *==========================================
   * SWUP
   * ↳ HOOKS
   *==========================================
   */

  /**
   * Équivalent de barba.hooks.afterLeave()
   * Le rideau couvre l'écran, on peut détruire sans glitch visuel
   */
  swup.hooks.on('content:replace', () => {
    // Kill ALL ScrollTriggers to prevent memory leaks
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    destroyAllButtons();
    destroyAllCtaAnimations();
    destroyAllDraggables();
    destroyLottieFiles();
    destroyLazyVideos();
    destroyFsAttributesScripts();
    destroyAccordionScrollTrigger();
    destroyCardVideoPlayer();
    destroyCardHoverIcon();
    destroyHomeHero();
    destroyMonkeyFall();
    destroyClientLoop();
    destroyCmsPortfolioParallax();

    // Setup animations par namespace AVANT que le rideau se lève
    runNamespaceSetup();
  });

  /**
   * Équivalent de barba.hooks.enter()
   * Nouveau contenu injecté, on peut initialiser
   */
  swup.hooks.on('page:view', () => {
    initGlobalFunctions();
    initNavbarCurrentState(); // Met à jour w--current sur les liens
    requestAnimationFrame(() => {
      // restartWebflow();
      restartFsAttributesModules();
    });
  });

  /**
   * Équivalent de barba.hooks.afterEnter()
   * Animation terminée, on peut initialiser les animations visuelles
   */
  swup.hooks.on('visit:end', () => {
    requestAnimationFrame(() => {
      initCtaAnimation();
      initCustomFavicon();

      // Animations spécifiques par namespace (APRÈS le rideau)
      runNamespaceAnimate();
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
