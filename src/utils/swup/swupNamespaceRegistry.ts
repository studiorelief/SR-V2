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
import { initPortfolioSecondPlan } from '$utils/page/hero/portfolioHero';
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

// Lazy-load : `offres` est un namespace 100% GSAP sans cleanup non-GSAP,
// son module n'est téléchargé que sur navigation vers /offres. Le chunk est
// pré-fetché par SwupPreloadPlugin au hover du lien → latence quasi-nulle.
registerNamespace('offres', {
  run: async () => {
    const m = await import('$utils/page/hero/offresHero');
    return gsap.context(() => {
      m.initOffresParallax();
      m.initOffresParallaxBig();
      m.initOffresMarmotte();
    });
  },
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

// Lazy-load : idem `offres`, namespace 100% GSAP, chunk séparé.
registerNamespace('produits', {
  run: async () => {
    const m = await import('$utils/page/hero/produitsHero');
    return gsap.context(() => {
      m.initProduitsParallax();
    });
  },
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
