import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let heroScrollTrigger: ScrollTrigger | null = null;
let grotteScrollTrigger: ScrollTrigger | null = null;

/**
 * Scroll animation on approche hero
 * Trigger: .section_hero
 * .section_hero translates from y: 0 to y: -100svh as user scrolls through it
 */
export const initApprocheHeroScroll = (): void => {
  const heroSection = document.querySelector<HTMLElement>(
    '.section_hero.is-approche .hero_background'
  );
  if (!heroSection) return;

  gsap.set(heroSection, {
    willChange: 'transform',
    force3D: true,
  });

  heroScrollTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 0,
    invalidateOnRefresh: true,
    animation: gsap.to(heroSection, {
      opacity: 0,
      y: '75svh',
      ease: 'none',
    }),
  });
};

/**
 * Destroy approche hero scroll ScrollTrigger
 */
export const destroyApprocheHeroScroll = (): void => {
  if (heroScrollTrigger) {
    heroScrollTrigger.kill();
    heroScrollTrigger = null;
  }

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (heroSection) {
    gsap.set(heroSection, { clearProps: 'willChange,transform' });
  }
};

/**
 * Scroll animation on approche grotte section
 * Trigger: .section_approche_grotte
 * .section_approche_grotte translates from y: 0 to y: -50vh as user scrolls
 */
export const initApprocheGrotteScroll = (): void => {
  const grotteSection = document.querySelector<HTMLElement>('.section_approche_grotte');
  if (!grotteSection) return;

  gsap.set(grotteSection, {
    willChange: 'transform',
    force3D: true,
  });

  grotteScrollTrigger = ScrollTrigger.create({
    trigger: grotteSection,
    start: 'bottom bottom',
    end: 'bottom top',
    scrub: 0,
    invalidateOnRefresh: true,
    markers: false,
    animation: gsap.to(grotteSection, {
      y: '-50vh',
      ease: 'none',
    }),
  });
};

/**
 * Destroy approche grotte scroll ScrollTrigger
 */
export const destroyApprocheGrotteScroll = (): void => {
  if (grotteScrollTrigger) {
    grotteScrollTrigger.kill();
    grotteScrollTrigger = null;
  }

  const grotteSection = document.querySelector<HTMLElement>('.section_approche_grotte');
  if (grotteSection) {
    gsap.set(grotteSection, { clearProps: 'willChange,transform' });
  }
};
