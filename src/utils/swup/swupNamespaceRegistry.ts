import { initApprocheParallax, initApprocheParallaxInvert } from '$utils/page/hero/approcheHero';
import {
  initAnimateCmsPortfolioHero,
  initCmsPortfolioHero,
  initCmsPortfolioParallax,
  initSetupCmsPortfolioHero,
} from '$utils/page/hero/cmsPortfolioHero';
import {
  initOffresMarmotte,
  initOffresParallax,
  initOffresParallaxBig,
} from '$utils/page/hero/offresHero';
import { initPortfolioSecondPlan } from '$utils/page/hero/portfolioHero';
import { initProduitsParallax } from '$utils/page/hero/produitsHero';
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
    initOffresParallaxBig();
    initOffresMarmotte();
  },
  init: () => {
    initOffresParallax();
    initOffresParallaxBig();
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

registerNamespace('produits', {
  animate: () => {
    initProduitsParallax();
  },
  init: () => {
    initProduitsParallax();
  },
});
