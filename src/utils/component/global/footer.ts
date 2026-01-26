/**
 * Footer Component with GSAP Animations
 * - Infinite horizontal marquee loop for footer items
 * - City badges drop animation on scroll
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Initialize Footer Collection Loop
 * Creates infinite horizontal marquee loop using GSAP
 */
const initFooterLoop = (): void => {
  const containers = document.querySelectorAll<HTMLElement>('.footer_collection-list');

  containers.forEach((container) => {
    // Skip if already initialized
    if (container.hasAttribute('data-footer-loop-initialized')) return;
    container.setAttribute('data-footer-loop-initialized', 'true');

    const items = Array.from(container.querySelectorAll<HTMLElement>('.footer_collection-item'));
    if (items.length === 0) return;

    // Set container display to flex for proper layout with gap
    gsap.set(container, {
      display: 'flex',
      flexWrap: 'nowrap',
      gap: 'var(--_layout---spacing--xxhuge)',
    });

    // Clone items to create seamless loop
    items.forEach((item) => {
      const clone = item.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
    });

    // Get all items including clones
    const allItems = Array.from(container.querySelectorAll<HTMLElement>('.footer_collection-item'));

    // Use double RAF to ensure layout is calculated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Get gap value
        const gap = parseFloat(getComputedStyle(container).gap) || 0;

        // Calculate width of original items + gaps (including gap after last original item)
        let totalWidth = 0;
        items.forEach((item) => {
          totalWidth += item.offsetWidth + gap;
        });

        // Create seamless loop using onRepeat to reset position
        const duration = totalWidth / 50; // Speed: higher = slower

        const tl = gsap.timeline({ repeat: -1 });

        tl.fromTo(
          container,
          { x: 0 },
          {
            x: -totalWidth,
            duration: duration,
            ease: 'none',
          }
        );

        // Hover pause/resume avec debounce
        let isHovering = false;

        const handleMouseEnter = (): void => {
          if (isHovering) return;
          isHovering = true;
          gsap.to(tl, { timeScale: 0, duration: 0.3, ease: 'power2.out', overwrite: true });
        };

        const handleMouseLeave = (): void => {
          if (!isHovering) return;
          isHovering = false;
          gsap.to(tl, { timeScale: 1, duration: 0.3, ease: 'power2.out', overwrite: true });
        };

        // Listen on container instead of individual items for better performance
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        // Also pause on individual item hover for when mouse moves between items
        allItems.forEach((item) => {
          item.addEventListener('mouseenter', handleMouseEnter);
        });
      });
    });
  });
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
