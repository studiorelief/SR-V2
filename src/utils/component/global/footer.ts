/**
 * Footer Component
 * - Infinite horizontal marquee loop (pure CSS @keyframes)
 * - City badges drop animation on scroll
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer marquee — pure CSS @keyframes, zéro ticker JS, zéro clone.
 *
 * Le seul travail JS au runtime :
 *   1. Ajouter `.is-marquee` pour activer la keyframe CSS.
 *   2. IntersectionObserver pour `animation-play-state: paused` quand le footer
 *      est hors viewport — sans ça l'animation compose un layer transform à
 *      chaque frame même hors écran, ce qui satura le compositor (cause directe
 *      du lag observé).
 *
 * Le footer est hors `#swup` → DOM persiste à travers les transitions, donc
 * un seul init suffit pour toute la session.
 */
let footerMarqueeInitialized = false;

const initFooterLoop = (): void => {
  if (footerMarqueeInitialized) return;

  const lists = document.querySelectorAll<HTMLElement>('.footer_collection-list');
  if (lists.length === 0) return;

  lists.forEach((list) => {
    if (list.classList.contains('is-marquee')) return;
    if (list.querySelectorAll('.footer_collection-item').length === 0) return;

    list.classList.add('is-marquee');
    // Démarre en pause — l'IO active dès le 1er callback si visible.
    list.style.animationPlayState = 'paused';
  });

  const marqueeLists = document.querySelectorAll<HTMLElement>('.footer_collection-list.is-marquee');
  if (marqueeLists.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        (entry.target as HTMLElement).style.animationPlayState = entry.isIntersecting
          ? 'running'
          : 'paused';
      }
    },
    { rootMargin: '200px' }
  );

  marqueeLists.forEach((list) => observer.observe(list));

  footerMarqueeInitialized = true;
};

/**
 * Footer Drop Animation
 * Animates city badges dropping and stacking on scroll
 */
export function initFooterDrop(): void {
  const footerComponent = document.querySelector('.footer_component');
  if (!footerComponent) return;

  // Clean up any existing ScrollTriggers for the footer before creating new ones
  // This prevents conflicts when reinitializing during Barba.js page transitions
  ScrollTrigger.getAll().forEach((st) => {
    if (st.trigger === footerComponent) {
      st.kill();
    }
  });

  // Define city elements
  const cityConfig = [
    { selector: '[trigger="footer-tours"]' },
    { selector: '[trigger="footer-paris"]' },
    { selector: '[trigger="footer-bordeaux"]' },
    { selector: '[trigger="footer-everywhere"]' },
  ];

  // Collect all elements
  const elements = cityConfig
    .map((city) => document.querySelector(city.selector) as HTMLElement)
    .filter((el): el is HTMLElement => el !== null);

  if (elements.length === 0) return;

  // Clear any existing GSAP animations on these elements to prevent conflicts
  elements.forEach((element) => {
    gsap.killTweensOf(element);
  });

  // Set initial state for all elements (reset to starting position)
  // Using requestAnimationFrame to ensure DOM is ready and previous animations are cleared
  requestAnimationFrame(() => {
    gsap.set(elements, {
      yPercent: -200,
      opacity: 0,
      scale: 0.8,
    });

    // Create timeline with ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        markers: false,
        trigger: footerComponent,
        start: '50% 80%',
        end: '50% 50%',
        toggleActions: 'play none play reverse',
      },
    });

    // Animate each element with stagger
    elements.forEach((element, index) => {
      const config = cityConfig[index];
      if (!config) return;

      tl.to(
        element,
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'bounce.out',
        },
        index * 0.15 // Stagger timing
      );
    });

    // Refresh ScrollTrigger after creating the timeline to ensure it calculates correctly
    // ScrollTrigger.refresh();
  });
}

/**
 * Initialize Footer Component
 * Sets up infinite loop and city drop animations
 */
export const initFooter = (): void => {
  // Initialize footer collection loop
  initFooterLoop();

  // Initialize city drop animation
  initFooterDrop();
};
