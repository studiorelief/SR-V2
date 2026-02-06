import { initApprocheParallax, initApprocheParallaxInvert } from '$utils/page/hero/approcheHero';
import {
  initAnimateCmsPortfolioHero,
  initCmsPortfolioHero,
  initCmsPortfolioParallax,
  initSetupCmsPortfolioHero,
} from '$utils/page/hero/cmsPortfolioHero';
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
