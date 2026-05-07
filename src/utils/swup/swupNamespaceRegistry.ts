import gsap from 'gsap';

import { initCal } from '$utils/global/script/loadCal';
import {
  initApprocheCardFloat,
  initApprocheGrotteScroll,
  initApprocheHeroScroll,
  initApprocheLampAnimations,
  initApprocheProcessParallax,
  initApprocheStepScale,
} from '$utils/page/approche/approcheScrollAnimations';
import { initContactFileUpload } from '$utils/page/contact/contactFileUpload';
import { initContactLogic } from '$utils/page/contact/contactLogic';
import { initContactMultiStep } from '$utils/page/contact/contactMultiStep';
import { initContactSuccess } from '$utils/page/contact/contactSuccess';
import { initApprocheParallax, initApprocheParallaxInvert } from '$utils/page/hero/approcheHero';
import {
  initAnimateCmsPortfolioHero,
  initCmsPortfolioHero,
  initCmsPortfolioParallax,
  initSetupCmsPortfolioHero,
} from '$utils/page/hero/cmsPortfolioHero';
import {
  destroyOffresMarmotte,
  initOffresMarmotte,
  initOffresParallax,
  initOffresParallaxBig,
} from '$utils/page/hero/offresHero';
import { initPortfolioSecondPlan } from '$utils/page/hero/portfolioHero';
import { initProduitsParallax } from '$utils/page/hero/produitsHero';
import {
  initHomeApprocheFalaiseParallax,
  initHomeApprocheLueurMouseParallax,
} from '$utils/page/home/homeApprocheAnimations';
import {
  destroyPortfolioBaseline,
  initPortfolioBaseline,
} from '$utils/page/portfolio/portfolioBaseline';
import { registerNamespace } from '$utils/swup/swupNamespaces';

/*
 *==========================================
 * SWUP NAMESPACES REGISTRY
 *
 * Pattern :
 * - Namespaces GSAP-only (approche, home, offres, produits, cms-portfolio)
 *   wrap leurs inits dans `gsap.context()` → cleanup auto au teardown.
 * - Namespaces avec listeners DOM custom (contact) ou destroy explicite
 *   existant (portfolio) : pas de gsap.context, juste run().
 *
 * Les `destroy*` explicites côté `index.ts:content:replace` restent en place
 * comme garde-fou ; le ctx.revert() les rend redondants pour la partie GSAP
 * mais ne casse pas le flow (idempotent).
 *==========================================
 */

registerNamespace('cms-portfolio', {
  setup: initSetupCmsPortfolioHero,
  run: () =>
    gsap.context(() => {
      initCmsPortfolioHero();
      initAnimateCmsPortfolioHero();
      initCmsPortfolioParallax();
    }),
});

registerNamespace('portfolio', {
  setup: () => {
    destroyPortfolioBaseline();
  },
  run: () =>
    gsap.context(() => {
      initPortfolioSecondPlan();
      initPortfolioBaseline();
    }),
});

// Note : tentative de lazy-load (Phase 3 initiale) reverté.
// Le gain bundle (~1.8KB) ne compensait pas le round-trip réseau supplémentaire
// sur cold load /offres. setup() kill explicitement la marmotte (cycle récursif
// via onComplete = en dehors du gsap.context, donc non couvert par ctx.revert).
registerNamespace('offres', {
  setup: () => {
    destroyOffresMarmotte();
  },
  run: () =>
    gsap.context(() => {
      initOffresParallax();
      initOffresParallaxBig();
      initOffresMarmotte();
    }),
});

registerNamespace('approche', {
  run: () =>
    gsap.context(() => {
      initApprocheParallax();
      initApprocheParallaxInvert();
      initApprocheHeroScroll();
      initApprocheGrotteScroll();
      initApprocheProcessParallax();
      initApprocheStepScale();
      initApprocheLampAnimations();
      initApprocheCardFloat();
    }),
});

registerNamespace('home', {
  run: () =>
    gsap.context(() => {
      initHomeApprocheFalaiseParallax();
      initHomeApprocheLueurMouseParallax();
    }),
});

registerNamespace('produits', {
  run: () =>
    gsap.context(() => {
      initProduitsParallax();
    }),
});

registerNamespace('contact', {
  run: () => {
    // Pas de gsap.context : ce namespace gère majoritairement des listeners
    // DOM (formulaire multi-step, file upload) et des intégrations externes
    // (Cal.com). Les inits gèrent leur propre cleanup en interne.
    initContactMultiStep();
    initContactFileUpload();
    initContactLogic();
    initContactSuccess();
    initCal();
  },
});
