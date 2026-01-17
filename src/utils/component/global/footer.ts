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
    const items = container.querySelectorAll<HTMLElement>('.footer_collection-item');

    if (items.length === 0) return;

    // Set container display to flex for proper layout with gap FIRST
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
    const allItems = container.querySelectorAll<HTMLElement>('.footer_collection-item');

    // Calculate total width AFTER setting gap and cloning
    // Use a small delay to ensure DOM is updated
    requestAnimationFrame(() => {
      // Get actual width of the first half (original items with gaps)
      let totalWidth = 0;
      items.forEach((item, index) => {
        totalWidth += item.offsetWidth;
        // Add gap width except for the last item
        if (index < items.length - 1) {
          const gap = parseFloat(getComputedStyle(container).gap) || 0;
          totalWidth += gap;
        }
      });

      // Create the infinite loop animation
      const duration = totalWidth / 50; // Adjust speed by changing divisor (higher = slower)

      const animation = gsap.to(container, {
        x: -totalWidth,
        duration: duration,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth),
        },
      });

      // Optimized hover management with counter to prevent glitches when switching between cards
      // Counter ensures smooth transitions when moving from one card to another
      let hoverCount = 0;
      let timeScaleTween: gsap.core.Tween | null = null;

      const updateTimeScale = (targetScale: number): void => {
        // Kill any existing timeScale animation to prevent conflicts
        if (timeScaleTween) {
          timeScaleTween.kill();
          timeScaleTween = null;
        }

        // Only create new animation if scale actually needs to change
        if (animation.timeScale() !== targetScale) {
          timeScaleTween = gsap.to(animation, {
            timeScale: targetScale,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
          });
        }
      };

      const pauseAnimation = (): void => {
        hoverCount += 1;
        if (hoverCount === 1) {
          updateTimeScale(0);
        }
      };

      const resumeAnimation = (): void => {
        hoverCount = Math.max(0, hoverCount - 1);
        if (hoverCount === 0) {
          updateTimeScale(1);
        }
      };

      // Add hover listeners to all items (including clones)
      // Counter system ensures smooth transitions between cards
      allItems.forEach((item) => {
        item.addEventListener('mouseenter', pauseAnimation);
        item.addEventListener('mouseleave', resumeAnimation);
      });
    });
  });
};

/**
 * Footer Drop Animation
 * Animates city badges dropping and stacking on scroll
 * Each element has its own rotation for the stacked look
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

  // Define city elements with their final rotations
  const cityConfig = [
    { selector: '[trigger="footer-tours"]', rotation: -7 },
    { selector: '[trigger="footer-paris"]', rotation: 15 },
    { selector: '[trigger="footer-bordeaux"]', rotation: -2 },
    { selector: '[trigger="footer-everywhere"]', rotation: 2 },
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
      yPercent: -750,
      opacity: 0,
      rotation: -15,
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

    // Animate each element with stagger and specific rotation
    elements.forEach((element, index) => {
      const config = cityConfig[index];
      if (!config) return;

      tl.to(
        element,
        {
          yPercent: 0,
          opacity: 1,
          rotation: config.rotation,
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
