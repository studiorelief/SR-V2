import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let parallaxTrigger: ScrollTrigger | null = null;
let parallaxInvertTrigger: ScrollTrigger | null = null;

/**
 * Parallax effect on approche page elements
 * Trigger: .section_hero
 * Elements move from y: 0 to y: 2.5rem as user scrolls
 */
export const initApprocheParallax = (): void => {
  const parallaxElements = document.querySelectorAll<HTMLElement>('[approche-trigger="parallax"]');
  if (parallaxElements.length === 0) return;

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (!heroSection) return;

  // Prépare le GPU pour l'animation
  gsap.set(parallaxElements, {
    willChange: 'transform',
    force3D: true,
  });

  const tl = gsap.timeline();

  tl.to(parallaxElements, {
    y: '2.5rem',
    ease: 'none',
  });

  parallaxTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    markers: false,
    animation: tl,
  });
};

/**
 * Destroy approche parallax ScrollTrigger
 */
export const destroyApprocheParallax = (): void => {
  if (parallaxTrigger) {
    parallaxTrigger.kill();
    parallaxTrigger = null;
  }

  // Nettoie le will-change pour libérer le GPU
  const parallaxElements = document.querySelectorAll<HTMLElement>('[approche-trigger="parallax"]');
  if (parallaxElements.length > 0) {
    gsap.set(parallaxElements, { clearProps: 'willChange' });
  }
};

/**
 * Inverted parallax effect on approche page elements
 * Trigger: .section_hero
 * Elements move from y: 0 to y: -2.5rem as user scrolls
 */
export const initApprocheParallaxInvert = (): void => {
  const parallaxInvertElements = document.querySelectorAll<HTMLElement>(
    '[approche-trigger="parallax-invert"]'
  );
  if (parallaxInvertElements.length === 0) return;

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (!heroSection) return;

  // Prépare le GPU pour l'animation
  gsap.set(parallaxInvertElements, {
    willChange: 'transform',
    force3D: true,
  });

  const tl = gsap.timeline();

  tl.to(parallaxInvertElements, {
    y: '-2.5rem',
    ease: 'none',
  });

  parallaxInvertTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    markers: false,
    animation: tl,
  });
};

/**
 * Destroy approche parallax invert ScrollTrigger
 */
export const destroyApprocheParallaxInvert = (): void => {
  if (parallaxInvertTrigger) {
    parallaxInvertTrigger.kill();
    parallaxInvertTrigger = null;
  }

  // Nettoie le will-change pour libérer le GPU
  const parallaxInvertElements = document.querySelectorAll<HTMLElement>(
    '[approche-trigger="parallax-invert"]'
  );
  if (parallaxInvertElements.length > 0) {
    gsap.set(parallaxInvertElements, { clearProps: 'willChange' });
  }
};
