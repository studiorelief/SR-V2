import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Stockage global pour cleanup
const HERO_STORAGE_KEY = '__heroAnimations';

interface HeroStorage {
  resizeHandler?: () => void;
  cloudAnimations?: gsap.core.Tween[];
}

export const initHomeHero = (): void => {
  const section = document.querySelector('.section_home_hero') as HTMLElement | null;
  if (!section) return;

  const heroBackground = section.querySelector('.home_hero_background') as HTMLElement | null;
  if (!heroBackground) return;

  /*
   *============================================================================
   * CLEANUP - Kill anciennes animations et event listeners
   *============================================================================
   */
  const oldStorage = (section as unknown as Record<string, HeroStorage>)[HERO_STORAGE_KEY];
  if (oldStorage) {
    // Remove ancien resize handler
    if (oldStorage.resizeHandler) {
      window.removeEventListener('resize', oldStorage.resizeHandler);
    }
    // Kill anciennes animations nuages
    oldStorage.cloudAnimations?.forEach((anim) => anim.kill());
  }

  // Kill les anciens ScrollTriggers de cette section
  ScrollTrigger.getAll().forEach((st) => {
    if (st.trigger === section) st.kill();
  });

  /*
   *============================================================================
   * SÉLECTION DES ÉLÉMENTS
   *============================================================================
   */
  const elements = {
    sun: section.querySelector('[trigger="hero-sun"]'),
    montagne: section.querySelector('[trigger="hero-montagne"]'),
    eagle: section.querySelector('[trigger="hero-eagle"]'),
    eagleShadow: section.querySelector('[trigger="hero-eagle-shadow"]'),
    parrot: section.querySelector('[trigger="hero-parrot"]'),
    falaise: section.querySelector('[trigger="hero-falaise"]'),
    mer: section.querySelector('[trigger="hero-mer"]'),
    parapente: section.querySelector('[trigger="hero-parapente"]'),
    desert: section.querySelector('[trigger="hero-desert"]'),
    ponton: section.querySelector('[trigger="hero-ponton"]'),
    pontonBg: section.querySelector('[trigger="hero-ponton-bg"]'),
    mascotte: section.querySelector('[trigger="hero-mascotte"]'),
    plantLeft: section.querySelector('[trigger="hero-plante-left"]'),
    cloud1: section.querySelector('[trigger="hero-cloud-1"]'),
    cloud2: section.querySelector('[trigger="hero-cloud-2"]'),
    cloud3: section.querySelector('[trigger="hero-cloud-3"]'),
    cloud4: section.querySelector('[trigger="hero-cloud-4"]'),
  };

  /*
   *============================================================================
   * TIMELINE SCROLLTRIGGER
   *============================================================================
   */
  const tl = gsap.timeline({
    scrollTrigger: {
      markers: false,
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  /*
   *============================================================================
   * HELPER - Ajoute une animation parallax avec GPU optimization
   *============================================================================
   */
  const addParallax = (el: Element | null, props: gsap.TweenVars): void => {
    if (!el) return;
    gsap.set(el, { willChange: 'transform', force3D: true });
    tl.to(el, { ...props, ease: 'none', force3D: true }, 0);
  };

  /*
   *============================================================================
   * ANIMATIONS PARALLAX
   *============================================================================
   */

  // TOP
  addParallax(elements.montagne, { y: '4rem' });
  addParallax(elements.sun, { y: '-6rem' });

  // MIDDLE
  addParallax(elements.parapente, { x: '2rem' });
  addParallax(elements.mer, { y: '1rem' });
  addParallax(elements.falaise, { y: '1rem' });
  addParallax(elements.desert, { y: '1rem' });

  // BOTTOM
  addParallax(elements.pontonBg, { y: '3rem' });
  addParallax(elements.ponton, { y: '-3rem' });
  addParallax(elements.mascotte, { y: '-3rem' });
  addParallax(elements.plantLeft, { rotateZ: '-10deg' });

  // DECORATIF
  addParallax(elements.eagle, { y: '-4rem', x: '-1.5rem' });
  addParallax(elements.eagleShadow, { y: '2.5rem', x: '-1rem' });
  addParallax(elements.parrot, { y: '-5rem', x: '2rem' });

  /*
   *============================================================================
   * ANIMATIONS CLOUD
   *============================================================================
   */
  const cloudAnimations: gsap.core.Tween[] = [];

  const addCloud = (
    el: Element | null,
    config: { startPercent: number; endPercent: number; duration: number; initialProgress: number }
  ): void => {
    if (!el) return;
    gsap.set(el, { xPercent: config.startPercent, willChange: 'transform', force3D: true });
    const anim = gsap.to(el, {
      xPercent: config.endPercent,
      duration: config.duration,
      ease: 'none',
      repeat: -1,
      force3D: true,
    });
    anim.progress(config.initialProgress);
    cloudAnimations.push(anim);
  };

  // Cloud 1 : ~13% dans l'image
  addCloud(elements.cloud1, {
    startPercent: -30,
    endPercent: 90,
    duration: 45,
    initialProgress: 0.13,
  });
  // Cloud 2 : ~38% dans l'image
  addCloud(elements.cloud2, {
    startPercent: -50,
    endPercent: 70,
    duration: 60,
    initialProgress: 0.38,
  });
  // Cloud 3 : ~76% dans l'image
  addCloud(elements.cloud3, {
    startPercent: -90,
    endPercent: 30,
    duration: 35,
    initialProgress: 0.76,
  });
  // Cloud 4 : ~94% dans l'image
  addCloud(elements.cloud4, {
    startPercent: -100,
    endPercent: 10,
    duration: 50,
    initialProgress: 0.94,
  });

  /*
   *============================================================================
   * GESTION DU RESIZE - Pause animations + masque le background
   *============================================================================
   */

  // let resizeTimeout: ReturnType<typeof setTimeout>;
  // let isResizing = false;

  // // Tween de fade pour éviter les conflits CSS
  // let fadeTween: gsap.core.Tween | null = null;

  // const handleResize = (): void => {
  //   if (!isResizing) {
  //     isResizing = true;

  //     // 1. Pause toutes les animations pour éviter les recalculs GPU
  //     cloudAnimations.forEach((anim) => anim.pause());
  //     tl.scrollTrigger?.disable(false);

  //     // 2. Kill le fade en cours et masque instantanément avec GSAP
  //     fadeTween?.kill();
  //     gsap.set(heroBackground, { autoAlpha: 0 }); // autoAlpha = opacity + visibility
  //   }

  //   clearTimeout(resizeTimeout);
  //   resizeTimeout = setTimeout(() => {
  //     isResizing = false;

  //     // 3. Rafraîchir ScrollTrigger (recalcule les positions) - toujours invisible
  //     ScrollTrigger.refresh();

  //     // 4. Réactive le ScrollTrigger et reprend les animations - toujours invisible
  //     tl.scrollTrigger?.enable();
  //     cloudAnimations.forEach((anim) => anim.resume());

  //     // 5. Fade-in avec GSAP - fromTo pour état explicite
  //     requestAnimationFrame(() => {
  //       fadeTween = gsap.fromTo(
  //         heroBackground,
  //         { opacity: 0, visibility: 'visible' }, // FROM: force état initial
  //         {
  //           opacity: 1,
  //           duration: 0,
  //           ease: 'power2.out',
  //           overwrite: true, // Kill toute animation conflictuelle
  //           immediateRender: true, // Applique le FROM immédiatement
  //         }
  //       );
  //     });
  //   }, 150);
  // };

  // window.addEventListener('resize', handleResize);

  /*
   *============================================================================
   * STOCKAGE POUR CLEANUP FUTUR
   *============================================================================
   */
  // (section as unknown as Record<string, HeroStorage>)[HERO_STORAGE_KEY] = {
  //   resizeHandler: handleResize,
  //   cloudAnimations,
  // };
};

/*
 *============================================================================
 * CLOUD ANIMATIONS ONLY - Fonction séparée pour lancer uniquement les nuages
 *============================================================================
 */

const CLOUD_STORAGE_KEY = '__cloudAnimations';

interface CloudStorage {
  animations?: gsap.core.Tween[];
}

export const initCloudAnimations = (): void => {
  const section = document.querySelector('.section_home_hero') as HTMLElement | null;
  if (!section) return;

  // Cleanup anciennes animations
  const oldStorage = (section as unknown as Record<string, CloudStorage>)[CLOUD_STORAGE_KEY];
  if (oldStorage?.animations) {
    oldStorage.animations.forEach((anim) => anim.kill());
  }

  // Sélection des nuages
  const clouds = {
    cloud1: section.querySelector('[trigger="hero-cloud-1"]'),
    cloud2: section.querySelector('[trigger="hero-cloud-2"]'),
    cloud3: section.querySelector('[trigger="hero-cloud-3"]'),
    cloud4: section.querySelector('[trigger="hero-cloud-4"]'),
  };

  const cloudAnimations: gsap.core.Tween[] = [];

  const addCloud = (
    el: Element | null,
    config: { startPercent: number; endPercent: number; duration: number; initialProgress: number }
  ): void => {
    if (!el) return;
    gsap.set(el, { xPercent: config.startPercent, willChange: 'transform', force3D: true });
    const anim = gsap.to(el, {
      xPercent: config.endPercent,
      duration: config.duration,
      ease: 'none',
      repeat: -1,
      force3D: true,
    });
    anim.progress(config.initialProgress);
    cloudAnimations.push(anim);
  };

  // Cloud 1 : ~13% dans l'image
  addCloud(clouds.cloud1, {
    startPercent: -30,
    endPercent: 90,
    duration: 45,
    initialProgress: 0.13,
  });
  // Cloud 2 : ~38% dans l'image
  addCloud(clouds.cloud2, {
    startPercent: -50,
    endPercent: 70,
    duration: 60,
    initialProgress: 0.38,
  });
  // Cloud 3 : ~76% dans l'image
  addCloud(clouds.cloud3, {
    startPercent: -90,
    endPercent: 30,
    duration: 35,
    initialProgress: 0.76,
  });
  // Cloud 4 : ~94% dans l'image
  addCloud(clouds.cloud4, {
    startPercent: -100,
    endPercent: 10,
    duration: 50,
    initialProgress: 0.94,
  });

  // Stockage pour cleanup futur
  (section as unknown as Record<string, CloudStorage>)[CLOUD_STORAGE_KEY] = {
    animations: cloudAnimations,
  };
};
