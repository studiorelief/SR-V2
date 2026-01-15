import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animation parallax du soleil sur le hero de la home
 * Le soleil monte vers le haut au scroll de la page
 */
export const initHomeHero = (): void => {
  const section = document.querySelector('.section_home_hero') as HTMLElement | null;
  if (!section) return;

  const heroBottom = section.querySelector('[trigger="hero-bottom-line"]') as HTMLElement | null;
  const heroPontonBg = section.querySelector('[trigger="hero-ponton-bg"]') as HTMLElement | null;
  const heroPlantLeft = section.querySelector('[trigger="hero-plante-left"]') as HTMLElement | null;

  // Kill les anciens ScrollTriggers liés à cette section
  ScrollTrigger.getAll().forEach((st) => {
    if (
      st.trigger === section &&
      (st.vars.id === 'hero-bottom-scale' ||
        st.vars.id === 'hero-ponton-bg-scale' ||
        st.vars.id === 'hero-plant-left-rotate')
    ) {
      st.kill();
    }
  });
  // Animation scale hero-bottom - scale de 1 à 1.1
  if (heroBottom) {
    gsap.set(heroBottom, {
      scale: 1,
      transformOrigin: '50% 100%',
      willChange: 'transform',
      force3D: true,
    });

    gsap.to(heroBottom, {
      scale: 1.05,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        id: 'hero-bottom-scale',
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        markers: false,
      },
    });
  }

  // Animation scale hero-ponton-bg - scale de 1 à 1.1
  if (heroPontonBg) {
    gsap.set(heroPontonBg, {
      scale: 1,
      transformOrigin: '50% 100%',
      willChange: 'transform',
      force3D: true,
    });

    gsap.to(heroPontonBg, {
      scale: 1.2,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        id: 'hero-ponton-bg-scale',
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        markers: false,
      },
    });
  }

  // Animation rotation hero-plante-left au scroll
  if (heroPlantLeft) {
    gsap.set(heroPlantLeft, {
      rotateZ: 0,
      transformOrigin: '50% 100%',
      //   willChange: 'transform',
      force3D: true,
    });

    gsap.to(heroPlantLeft, {
      rotateZ: -25,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        id: 'hero-plant-left-rotate',
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        markers: false,
      },
    });
  }
};
