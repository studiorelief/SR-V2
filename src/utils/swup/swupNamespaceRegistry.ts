import { initApprocheParallax, initApprocheParallaxInvert } from '$utils/page/hero/approcheHero';
import {
  initAnimateCmsPortfolioHero,
  initCmsPortfolioHero,
  initCmsPortfolioParallax,
  initSetupCmsPortfolioHero,
} from '$utils/page/hero/cmsPortfolioHero';
import { initOffresMarmotte, initOffresParallax } from '$utils/page/hero/offresHero';
import { initPortfolioSecondPlan } from '$utils/page/hero/portfolioHero';
import { registerNamespace } from '$utils/swup/swupNamespaces';

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

registerNamespace('portfolio', {
  animate: () => {
    initPortfolioSecondPlan();
  },
  init: () => {
    initPortfolioSecondPlan();
  },
});

registerNamespace('offres', {
  animate: () => {
    initOffresParallax();
    initOffresMarmotte();
  },
  init: () => {
    initOffresParallax();
    initOffresMarmotte();
  },
});

registerNamespace('approche', {
  animate: () => {
    initApprocheParallax();
    initApprocheParallaxInvert();
  },
  init: () => {
    initApprocheParallax();
    initApprocheParallaxInvert();
  },
});
