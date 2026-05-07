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

import { restartWebflow } from '@finsweet/ts-utils';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// console.log('[SR-V2] Script loaded');

/*
 *==========================================
 * FUNCTION - IMPORT
 *==========================================
 */

import '$utils/swup/swupNamespaceRegistry';

import { destroyCardHoverIcon, initCardHoverIcon } from '$utils/component/cards/cardHoverIcon';
import {
  destroyCardVideoPlayer,
  initCardVideoPlayer,
} from '$utils/component/cards/cardVideoPlayer';
import { initSearchBar } from '$utils/component/form/searchBar';
import { initAiShare } from '$utils/component/global/aiShare';
import { initBeforeAfter } from '$utils/component/global/beforeAfter';
import { destroyAllButtons, initButtonHover } from '$utils/component/global/button';
import { initCtaFixed, initCtaMascotte, initCtaText } from '$utils/component/global/ctaFixed';
import { destroyAllDraggables, initDraggable } from '$utils/component/global/draggable';
import { initFooter } from '$utils/component/global/footer';
import {
  initInnerHighlight,
  initNavbar,
  initNavbarCurrentState,
  initNavbarHighlight,
  initNavbarMobile,
  initNavbarTriggers,
} from '$utils/component/global/navbar';
import { initScrollbar } from '$utils/component/global/scrollbar';
import { initSocialShare } from '$utils/component/global/socialShare';
import { initSticker } from '$utils/component/global/sticker';
import { initTooltip } from '$utils/component/global/tooltip';
import { initAllAnchorFills } from '$utils/component/section/anchor';
import { destroyClientLoop, initClientLoop } from '$utils/component/section/clientsLoop';
import {
  destroyAllCtaAnimations,
  initCtaAnimation,
  initCtaHeading,
} from '$utils/component/section/cta';
import {
  destroyRessourcesBlog,
  destroyRessourcesLabs,
  destroyRessourcesStack,
  initRessourcesBlog,
  initRessourcesLabs,
  initRessourcesStack,
} from '$utils/component/section/ressources';
import { destroyAllSliders } from '$utils/component/sliders/_swiperSetup';
import { initAuthorsSlider } from '$utils/component/sliders/authorsSlider';
import { initCalSlider } from '$utils/component/sliders/calSlider';
import { initCategoriesSlider } from '$utils/component/sliders/categoriesSlider';
import { initCmsCardsSlider } from '$utils/component/sliders/cmsCardsSlider';
import { initCmsProjetsSlider } from '$utils/component/sliders/cmsProjetsSlider';
import { initReviewSlider } from '$utils/component/sliders/reviewSlider';
import {
  destroyAccordionScrollTrigger,
  initAccordionScrollTrigger,
} from '$utils/global/animations/accordionScrollTrigger';
import { destroyCountAnimation, initCountAnimation } from '$utils/global/animations/countAnimation';
import { destroyLottieFiles, initLottieFiles } from '$utils/global/animations/lottieFiles';
import { initScrollTop } from '$utils/global/animations/scrollTop';
import { initSunHeroParallax } from '$utils/global/animations/sunHero';
import { initTextPath } from '$utils/global/animations/textPath';
import { initCustomFavicon, updateFavicon } from '$utils/global/brand/customFav';
import { initCmsCodeBlock } from '$utils/global/optimisations/cmsCodeBlock';
import { initCmsSummaryFade } from '$utils/global/optimisations/cmsRt';
import {
  dedupeRelatedItems,
  initRelatedItemsDedupe,
} from '$utils/global/optimisations/dedupe-related-items';
import { initDropdownFiltersClickOutside } from '$utils/global/optimisations/dropdownFilters';
import { destroyLazyVideos, initLazyVideos } from '$utils/global/optimisations/lazyVideo';
import { mirrorClick } from '$utils/global/optimisations/mirrorClick';
import { initPreloader, isPreloaderVisible } from '$utils/global/preloader/preloader';
import {
  destroyFsAttributesScripts,
  initFsAttributesScripts,
  restartFsAttributesModules,
} from '$utils/global/script/loadFsAttributes';
import { initFsLibrairiesScripts } from '$utils/global/script/loadFsLibrairies';
import {
  destroyApprocheCardFloat,
  destroyApprocheGrotteScroll,
  destroyApprocheHeroScroll,
  destroyApprocheLampAnimations,
  destroyApprocheProcessParallax,
  destroyApprocheStepScale,
} from '$utils/page/approche/approcheScrollAnimations';
import {
  destroyApprocheParallax,
  destroyApprocheParallaxInvert,
} from '$utils/page/hero/approcheHero';
import {
  destroyCmsPortfolioParallax,
  initSetupCmsPortfolioHero,
} from '$utils/page/hero/cmsPortfolioHero';
import { destroyHomeHero, initHomeHero } from '$utils/page/hero/homeHero';
import { destroyPortfolioSecondPlan } from '$utils/page/hero/portfolioHero';
import {
  destroyHomeApprocheFalaiseParallax,
  destroyHomeApprocheLueurMouseParallax,
} from '$utils/page/home/homeApprocheAnimations';
import { destroyHomeServices, initHomeServices } from '$utils/page/home/homeServices';
import { destroyMonkeyFall, initMonkeyFall } from '$utils/page/home/monkeyFall';
import { destroyPortfolioBaseline } from '$utils/page/portfolio/portfolioBaseline';
import { initGlobalHero } from '$utils/swup/swupGlobalHero';
import { initSwup } from '$utils/swup/swupInit';
import {
  runNamespaceAnimate,
  runNamespaceInit,
  runNamespaceSetup,
} from '$utils/swup/swupNamespaces';

/*
 *==========================================
 * CALL - GLOBAL FUNCTIONS
 *==========================================
 */

/**
 * Schedule du travail non-critique : preferes requestIdleCallback (s'exécute
 * pendant les périodes idle du browser, donc HORS fenêtre TBT/SI Lighthouse).
 * Fallback setTimeout pour Safari < 17 qui ne supporte pas encore rIC.
 */
const whenIdle = (fn: () => void, timeout = 2000): void => {
  if (typeof window === 'undefined') return;
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(fn, { timeout });
  } else {
    setTimeout(fn, 1);
  }
};

const initGlobalFunctions = (): void => {
  /*
   * ──────────────────────────────────────────────────────────────────────
   * CRITIQUE — exécuté de suite (impact direct sur FCP / LCP / interaction immédiate)
   * ──────────────────────────────────────────────────────────────────────
   */
  initFsAttributesScripts();
  initFsLibrairiesScripts();

  // Layout / hero / above-the-fold
  initFooter();
  initLottieFiles();
  initHomeHero();
  initSunHeroParallax();
  initSticker();

  // Navbar update qui dépend de l'URL courante (doit tourner sur chaque page).
  // initNavbarTriggers / initNavbarHighlight sont volontairement EXCLUS d'ici :
  // ils attachent des listeners (mouseenter/leave/click) sur des éléments de la
  // navbar persistante (hors #swup). Les rappeler à chaque page:view stack des
  // listeners en double (3 + 2 par élément × N navigations) → CPU pollué pour
  // toute la session. On les appelle une seule fois au boot dans init().
  initInnerHighlight();

  // Optimisations DOM légères (préviennent CLS)
  initCmsSummaryFade();
  initLazyVideos();

  // Portfolio CMS - géré par namespace dans visit:end
  initSetupCmsPortfolioHero();

  /*
   * ──────────────────────────────────────────────────────────────────────
   * DIFFÉRÉ — déplacé hors de la fenêtre Lighthouse (TBT/SI)
   * Exécuté pendant l'idle browser, après FCP/LCP/TTI.
   * ──────────────────────────────────────────────────────────────────────
   */
  whenIdle(() => {
    // Animations & comportements globaux non visibles immédiatement
    initScrollTop();
    initTextPath();
    initAllAnchorFills();
    initCmsCodeBlock();
    mirrorClick();
    initCountAnimation();

    // Composants UI non-critiques
    initAiShare();
    initBeforeAfter();
    initClientLoop();
    initSearchBar();
    initSocialShare();
    initTooltip();

    // Home (below the fold)
    initMonkeyFall();
    initHomeServices();

    // Sliders (probablement below the fold)
    initAuthorsSlider();
    initCalSlider();
    initCategoriesSlider();
    initCmsCardsSlider();
    initCmsProjetsSlider();
    initReviewSlider();

    // ScrollTriggers + interactions deferrables
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

  // Dédoublonnage des Collection Lists "Related Items" (relations CMS bidirectionnelles).
  // Hook dans la file Finsweet List + passe sync sur les items déjà rendus.
  // Le hook se redéclenche automatiquement après chaque restart Finsweet.
  initRelatedItemsDedupe();

  // Init global functions on first load
  initGlobalFunctions();
  initNavbar();
  initNavbarMobile();
  // Navbar listeners (mouseenter/leave/click sur éléments persistants hors #swup).
  // Appelés UNE SEULE FOIS au boot — sinon les listeners s'accumulent à chaque
  // page:view via initGlobalFunctions et plombent toute la session.
  initNavbarTriggers();
  initNavbarHighlight();
  initCtaText();
  initCtaMascotte();
  initDropdownFiltersClickOutside();

  // Animations visuelles légères (premier chargement) — pas de will-change lourd
  // ni de scroll triggers. Les inits lourds sont déférés (cf. runHeavyHeroInit).
  requestAnimationFrame(() => {
    initCtaAnimation();
    initRessourcesLabs();
    initRessourcesBlog();
    initRessourcesStack();
    initCustomFavicon();
  });

  /*
   * ──────────────────────────────────────────────────────────────────────
   * HEAVY HERO INIT — déféré jusqu'à window.load (cold load) ou
   * preloaderComplete (1ère visite avec préloader)
   *
   * Sur cold load (refresh direct sur /approche, /offres, …), le browser doit
   * décoder en parallèle ~20 MB de WebP hero (animals 2880×900, lueurs 1000×1916,
   * falaises, mascotte, …). Si on initialise en MÊME temps :
   *   - GSAP timelines sur le hero (setupAndAnimateGlobalHero, SplitText, etc.)
   *   - Scroll triggers (initApprocheHeroScroll, parallax, process, lamps)
   *   - will-change: transform sur 28+ éléments → autant de compositor layers
   * → main thread sature : sur Chrome le scheduler étale, sur WebKit/DIA non
   *   → 86.5 % du frame budget en Commit en idle, 7 FPS visible.
   *
   * Pourquoi le passage par /home masquait le bug : Swup pré-fetch et pré-décode
   * les images en background AVANT de swap le DOM. GSAP démarre sur du contenu
   * déjà décodé. C'est pour ça que cold-load /home + nav swup vers /approche =
   * fluide, mais cold-load direct /approche = laggy.
   *
   * En attendant window.load, on garantit que les images sont décodées et que
   * le main thread est libre pour init GSAP + créer les compositor layers.
   * ──────────────────────────────────────────────────────────────────────
   */
  const runHeavyHeroInit = (): void => {
    // ScrollTriggers par namespace AVANT setupAndAnimateGlobalHero, pour matcher
    // l'ordre du flow Swup (page:view -> runNamespaceAnimate, puis enter -> setupAndAnimateGlobalHero).
    runNamespaceInit();
    initGlobalHero();
  };

  /**
   * Force le décodage GPU complet des images hero AVANT de poser will-change.
   *
   * `window.load` fire quand les images sont DOWNLOADED (img.complete === true),
   * mais sur WebKit/DIA, le décodage + upload GPU peut être encore en cours
   * (les hero pèsent ~26 MB en RGBA : lueurs 1440×2760 + animals 2880×900).
   * Si on init GSAP juste après load, on alloue 28+ compositor layers PENDANT
   * que WebKit décode encore → main thread sature, 45 FPS au lieu de 120.
   *
   * `img.decode()` retourne une Promise qui resolve UNIQUEMENT quand l'image
   * est full décodée et prête à compositer. C'est l'équivalent du temps
   * "rideau swup" pour le cold load.
   */
  const waitForHeroImages = async (): Promise<void> => {
    const heroImgs = document.querySelectorAll<HTMLImageElement>(
      '.section_hero img, .hero_background img, [class*="hero_background-asset"]'
    );
    if (heroImgs.length === 0) return;
    // IMPORTANT : on filtre les images NON complètes (`img.complete === false`).
    // Sur Webflow, les images mobile-only (display:none sur desktop) ne sont
    // jamais downloadées → `img.decode()` hang indéfiniment → `runHeavyHeroInit`
    // n'est jamais exécuté → animations cassées. Seules les images COMPLETE
    // peuvent être décodées en safe.
    const completeImgs = Array.from(heroImgs).filter((img) => img.complete && img.naturalWidth > 0);
    if (completeImgs.length === 0) return;
    // Safety timeout de 1500 ms : même si une image hang, on n'attend pas
    // indéfiniment et on init quand même les animations.
    await Promise.race([
      Promise.all(
        completeImgs.map((img) =>
          img.decode === undefined ? Promise.resolve() : img.decode().catch(() => undefined)
        )
      ),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  };

  const runHeavyHeroInitAfterDecode = async (): Promise<void> => {
    await waitForHeroImages();
    requestAnimationFrame(runHeavyHeroInit);
  };

  if (isPreloaderVisible()) {
    // 1ère visite : préloader couvre l'écran ~2.5 s pendant que les images
    // décodent en background. Heavy init après preloaderComplete = images
    // déjà prêtes ET user va voir l'animation hero (pas cachée par le rideau).
    window.addEventListener('preloaderComplete', () => void runHeavyHeroInitAfterDecode(), {
      once: true,
    });
  } else if (document.readyState === 'complete') {
    // Page déjà loadée (rare au boot, mais safe-guard)
    void runHeavyHeroInitAfterDecode();
  } else {
    // Refresh / sessionStorage set : on attend window.load PUIS img.decode() pour
    // garantir que toutes les hero images sont fully decoded + uploaded en GPU
    // avant de créer les layers compositor.
    window.addEventListener('load', () => void runHeavyHeroInitAfterDecode(), { once: true });
  }

  // Initialize Swup after DOM is ready
  const swup = initSwup();

  // Mirror le flow swup `page:view` sur direct load / refresh.
  // Sur swup transition, après content:replace, on appelle dans une rAF :
  //   restartWebflow() + restartFsAttributesModules() + dedupeRelatedItems()
  // Ces calls remettent Webflow et Finsweet dans un état "fraîchement init"
  // qui diffère de leur auto-init de base. Sur refresh on ne le fait jamais
  // → l'auto-init de Webflow peut laisser des handlers / observers / lazy-load
  // listeners en double avec les nôtres, ce qui ralentit Safari / DIA.
  // On ancre sur window.load pour ne pas perturber l'auto-init en cours.
  const runPostLoadRestart = (): void => {
    requestAnimationFrame(() => {
      restartWebflow();
      restartFsAttributesModules();
      // ScrollTrigger.refresh après restart pour que les triggers re-mesurent
      // sur la layout post-restart (au cas où Webflow modifie des dimensions).
      ScrollTrigger.refresh();
    });
  };
  if (document.readyState === 'complete') {
    runPostLoadRestart();
  } else {
    window.addEventListener('load', runPostLoadRestart, { once: true });
  }

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

    // Setup animations par namespace AVANT que le rideau se lève
    runNamespaceSetup();

    destroyAllButtons();
    destroyAllCtaAnimations();
    destroyCountAnimation();
    destroyAllDraggables();
    destroyLottieFiles();
    destroyLazyVideos();
    destroyFsAttributesScripts();
    destroyAccordionScrollTrigger();
    destroyCardVideoPlayer();
    destroyCardHoverIcon();
    destroyHomeHero();
    destroyHomeServices();
    destroyMonkeyFall();
    destroyHomeApprocheFalaiseParallax();
    destroyHomeApprocheLueurMouseParallax();
    destroyClientLoop();
    destroyRessourcesLabs();
    destroyRessourcesBlog();
    destroyRessourcesStack();
    destroyCmsPortfolioParallax();
    destroyPortfolioSecondPlan();
    destroyPortfolioBaseline();
    destroyApprocheParallax();
    destroyApprocheParallaxInvert();
    destroyApprocheHeroScroll();
    destroyApprocheGrotteScroll();
    destroyApprocheProcessParallax();
    destroyApprocheStepScale();
    destroyApprocheLampAnimations();
    destroyApprocheCardFloat();

    // Détruit toutes les instances Swiper trackées (cmsCards, cmsProjets, review,
    // categories, authors). Sans ça, chaque navigation crée de nouvelles instances
    // sans libérer les anciennes : observers, mousewheel listeners, ticker interne
    // de chaque Swiper continuent de tourner sur des nodes DOM détachés.
    // Sur N navigations, N instances ghosts polluent CPU + mémoire — particulièrement
    // visible sur Safari / DIA en navigation privée (compositor + GC moins agressifs).
    destroyAllSliders();

    // Mettre à jour la favicon immédiatement après injection du contenu
    updateFavicon();
  });

  /**
   * Équivalent de barba.hooks.enter()
   * Nouveau contenu injecté, on peut initialiser
   */
  swup.hooks.on('page:view', () => {
    initGlobalFunctions();
    initNavbarCurrentState(); // Met à jour w--current sur les liens

    // Animations spécifiques par namespace (dès que le contenu est injecté)
    runNamespaceAnimate();

    requestAnimationFrame(() => {
      restartWebflow();
      restartFsAttributesModules();
      // Re-dédoublonner après chaque transition Swup : le nouveau DOM
      // injecté contient les items CMS de la page cible.
      dedupeRelatedItems();
    });
  });

  /**
   * Équivalent de barba.hooks.afterEnter()
   * Animation terminée, on peut initialiser les animations visuelles
   */
  swup.hooks.on('visit:end', () => {
    requestAnimationFrame(() => {
      initCtaAnimation();
      initRessourcesLabs();
      initRessourcesBlog();
      initRessourcesStack();
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
