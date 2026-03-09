import { initCal } from '$utils/global/script/loadCal';
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

registerNamespace('contact', {
  animate: () => {
    initContactMultiStep();
    initContactFileUpload();
    initContactLogic();
    initContactSuccess();
    initCal();
  },
  init: () => {
    initContactMultiStep();
    initContactFileUpload();
    initContactLogic();
    initContactSuccess();
    initCal();
  },
});
