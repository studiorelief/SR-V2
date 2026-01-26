import SwupHeadPlugin from '@swup/head-plugin';
import SwupJsPlugin from '@swup/js-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import SwupScrollPlugin from '@swup/scroll-plugin';
import Swup from 'swup';

import { swupEnterAnimation, swupLeaveAnimation } from '$utils/swup/swupTransitions';

/*
 *============================================================================
 * SWUP CONFIGURATION
 *============================================================================
 */

/**
 * Initialise Swup avec les plugins et les transitions
 */
export const initSwup = (): Swup => {
  // Vérifier que le container existe
  const container = document.querySelector('#swup');
  if (!container) {
    // console.warn('[Swup] Container #swup not found! Add id="swup" to your main content wrapper.');
  }

  const swup = new Swup({
    animationSelector: false, // On utilise SwupJsPlugin pour les animations
    containers: ['#swup'],
    cache: true,
    // Ignorer les ancres internes (même page)
    ignoreVisit: (_url, { el } = {}) => {
      // Si c'est un lien avec hash sur la même page, laisser le navigateur gérer
      if (el?.getAttribute('href')?.startsWith('#')) {
        return true;
      }
      return false;
    },
    plugins: [
      // Head Plugin - Met à jour les balises <head> (title, meta, scripts, styles)
      new SwupHeadPlugin({
        persistAssets: true,
        awaitAssets: true,
      }),

      // Preload Plugin - Précharge les liens au hover
      new SwupPreloadPlugin({
        preloadHoveredLinks: true,
      }),

      // Scroll Plugin - Gère le scroll entre les pages
      new SwupScrollPlugin({
        animateScroll: {
          betweenPages: false,
          samePageWithHash: true,
          samePage: true,
        },
        shouldResetScrollPosition: () => true,
      }),

      // JS Plugin - Transitions JavaScript custom avec GSAP
      new SwupJsPlugin({
        animations: [
          {
            from: '(.*)',
            to: '(.*)',
            out: async () => {
              await swupLeaveAnimation();
            },
            in: async () => {
              await swupEnterAnimation();
            },
          },
        ],
      }),
    ],
  });

  // Debug logs
  // swup.hooks.on('visit:start', () => console.log('[Swup] Visit started'));
  // swup.hooks.on('content:replace', () => console.log('[Swup] Content replaced'));
  // swup.hooks.on('visit:end', () => console.log('[Swup] Visit ended'));

  // console.log('[Swup] Initialized successfully');

  return swup;
};

export type { Swup };
