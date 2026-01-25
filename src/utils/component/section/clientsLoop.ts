import gsap from 'gsap';

import { EASINGS } from '$utils/global/easings/easings';

// Stockage des références pour le cleanup
let activeContainers: HTMLElement[] = [];

/**
 * Détruit les animations du client loop
 */
export function destroyClientLoop(): void {
  activeContainers.forEach((container) => {
    gsap.killTweensOf(container);
  });
  activeContainers = [];
}

/**
 * Creates an infinite horizontal marquee loop using GSAP
 */
export function initClientLoop() {
  const containers = document.querySelectorAll<HTMLElement>('.clients-loop_collection-list');

  // Reset containers list
  activeContainers = [];

  containers.forEach((container) => {
    const items = container.querySelectorAll<HTMLElement>('.clients-loop_collection-item');

    if (items.length === 0) return;

    // Track container for cleanup
    activeContainers.push(container);

    // Clone items to create seamless loop
    items.forEach((item) => {
      const clone = item.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
    });

    // Get all items including clones for hover effects
    const allItems = container.querySelectorAll<HTMLElement>('.clients-loop_collection-item');

    // Calculate total width of original items
    let totalWidth = 0;
    items.forEach((item) => {
      totalWidth += item.offsetWidth;
    });

    // Set container display to flex for proper layout
    gsap.set(container, {
      display: 'flex',
      flexWrap: 'nowrap',
    });

    // Initialize hover wrapper states
    allItems.forEach((item) => {
      const hoverWrapper = item.querySelector<HTMLElement>('.clients-loop_card_hover-wrapper');
      if (hoverWrapper) {
        gsap.set(hoverWrapper, {
          opacity: 0,
          scale: 0,
          yPercent: 0,
        });
      }
    });

    // Create the infinite loop animation
    const duration = totalWidth / 50; // Adjust speed by changing divisor (higher = slower)

    gsap.to(container, {
      x: -totalWidth,
      duration: duration,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth),
      },
    });

    // Add hover effects to each item
    allItems.forEach((item) => {
      const hoverWrapper = item.querySelector<HTMLElement>('.clients-loop_card_hover-wrapper');

      if (hoverWrapper) {
        // Random rotation: 2° or -2°
        const randomRotation = Math.random() > 0.5 ? 2 : -2;

        item.addEventListener('mouseenter', () => {
          gsap.to(hoverWrapper, {
            opacity: 1,
            scale: 1,
            yPercent: -100,
            rotation: randomRotation,
            duration: 0.3,
            ease: EASINGS.backOut,
          });
        });

        item.addEventListener('mouseleave', () => {
          gsap.to(hoverWrapper, {
            opacity: 0,
            scale: 0,
            yPercent: 0,
            rotation: 0,
            duration: 0.3,
            ease: EASINGS.customBounce,
          });
        });
      }
    });
  });
}
