import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let produitsParallaxTrigger: ScrollTrigger | null = null;

/**
 * Parallax effect on produits page elements
 * Trigger: .section_hero
 * Elements move from y: 0 to y: 1rem as user scrolls
 */
export const initProduitsParallax = (): void => {
  const parallaxElements = document.querySelectorAll<HTMLElement>('[produits-trigger="parallax"]');
  if (parallaxElements.length === 0) return;

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (!heroSection) return;

  gsap.set(parallaxElements, {
    willChange: 'transform',
    force3D: true,
  });

  const tl = gsap.timeline();

  tl.to(parallaxElements, {
    y: '1.5rem',
    ease: 'none',
  });

  produitsParallaxTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 0.5,
    markers: false,
    animation: tl,
  });
};

/**
 * Destroy produits parallax ScrollTrigger
 */
export const destroyProduitsParallax = (): void => {
  if (produitsParallaxTrigger) {
    produitsParallaxTrigger.kill();
    produitsParallaxTrigger = null;
  }

  const parallaxElements = document.querySelectorAll<HTMLElement>('[produits-trigger="parallax"]');
  if (parallaxElements.length > 0) {
    gsap.set(parallaxElements, { clearProps: 'willChange' });
  }
};
