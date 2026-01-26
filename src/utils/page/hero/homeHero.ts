import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animation parallax du hero de la home
 * Unified timeline pour toutes les animations = plus smooth
 */

let homeHeroTrigger: ScrollTrigger | null = null;

/**
 * Détruit le ScrollTrigger du hero de la home
 */
export const destroyHomeHero = (): void => {
  if (homeHeroTrigger) {
    homeHeroTrigger.kill();
    homeHeroTrigger = null;
  }
};

export const initHomeHero = (): void => {
  const section = document.querySelector('.section_home_hero') as HTMLElement | null;
  if (!section) return;

  const heroBottom = section.querySelector('[trigger="hero-bottom-line"]') as HTMLElement | null;
  const heroPontonBg = section.querySelector('[trigger="hero-ponton-bg"]') as HTMLElement | null;
  const heroPlantLeft = section.querySelector('[trigger="hero-plante-left"]') as HTMLElement | null;

  // Kill l'ancien ScrollTrigger s'il existe
  destroyHomeHero();

  // Setup initial states avec GPU layer
  if (heroBottom) {
    gsap.set(heroBottom, {
      scale: 1,
      transformOrigin: '50% 100%',
      force3D: true,
      willChange: 'transform',
    });
  }

  if (heroPontonBg) {
    gsap.set(heroPontonBg, {
      scale: 1,
      transformOrigin: '50% 100%',
      force3D: true,
      willChange: 'transform',
    });
  }

  if (heroPlantLeft) {
    gsap.set(heroPlantLeft, {
      rotation: 0,
      transformOrigin: '50% 100%',
      force3D: true,
      willChange: 'transform',
    });
  }

  // Unified timeline
  const tl = gsap.timeline();

  if (heroBottom) {
    tl.to(heroBottom, { scale: 1.05, ease: 'none' }, 0);
  }

  if (heroPontonBg) {
    tl.to(heroPontonBg, { scale: 1.2, ease: 'none' }, 0);
  }

  if (heroPlantLeft) {
    tl.to(heroPlantLeft, { rotation: -25, ease: 'none' }, 0);
  }

  // Single ScrollTrigger pour tout
  homeHeroTrigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom top',
    scrub: 0,
    animation: tl,
  });
};
