import gsap from 'gsap';

import { EASINGS } from '$utils/global/easings/easings';

// State module-scope pour le cleanup. activeContainers garde une ref vers le
// dernier container animé (le tween live), listenerCleanups stocke chaque
// removeEventListener pour ne pas laisser de hover handlers orphans après
// content:replace Swup.
let activeContainers: HTMLElement[] = [];
const listenerCleanups: Array<() => void> = [];

/**
 * Détruit les animations du client loop : kill tweens, retire les listeners
 * hover, et nettoie les items clonés (marqués `data-cloned`) pour éviter
 * d'accumuler des doublons si initClientLoop est rappelé sans Swup destroy.
 */
export function destroyClientLoop(): void {
  activeContainers.forEach((container) => {
    gsap.killTweensOf(container);

    container.querySelectorAll<HTMLElement>('[data-cloned="true"]').forEach((clone) => {
      clone.remove();
    });
  });
  activeContainers = [];

  listenerCleanups.forEach((fn) => fn());
  listenerCleanups.length = 0;
}

/**
 * Creates an infinite horizontal marquee loop using GSAP
 */
export function initClientLoop() {
  const containers = document.querySelectorAll<HTMLElement>('.clients-loop_collection-list');

  // Reset list for new init.
  activeContainers = [];

  containers.forEach((container) => {
    const items = container.querySelectorAll<HTMLElement>('.clients-loop_collection-item');

    if (items.length === 0) return;

    activeContainers.push(container);

    // Clone items to create seamless loop. Marqués `data-cloned` pour cleanup.
    items.forEach((item) => {
      const clone = item.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-cloned', 'true');
      container.appendChild(clone);
    });

    const allItems = container.querySelectorAll<HTMLElement>('.clients-loop_collection-item');

    let totalWidth = 0;
    items.forEach((item) => {
      totalWidth += item.offsetWidth;
    });

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

    const duration = totalWidth / 50; // higher = slower

    gsap.to(container, {
      x: -totalWidth,
      duration,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => parseFloat(x) % totalWidth),
      },
    });

    // Hover effects, listeners trackés pour destroy.
    allItems.forEach((item) => {
      const hoverWrapper = item.querySelector<HTMLElement>('.clients-loop_card_hover-wrapper');
      if (!hoverWrapper) return;

      const randomRotation = Math.random() > 0.5 ? 2 : -2;

      const onEnter = (): void => {
        gsap.to(hoverWrapper, {
          opacity: 1,
          scale: 1,
          yPercent: -100,
          rotation: randomRotation,
          duration: 0.3,
          ease: EASINGS.backOut,
        });
      };
      const onLeave = (): void => {
        gsap.to(hoverWrapper, {
          opacity: 0,
          scale: 0,
          yPercent: 0,
          rotation: 0,
          duration: 0.3,
          ease: EASINGS.customBounce,
        });
      };

      item.addEventListener('mouseenter', onEnter);
      item.addEventListener('mouseleave', onLeave);
      listenerCleanups.push(() => item.removeEventListener('mouseenter', onEnter));
      listenerCleanups.push(() => item.removeEventListener('mouseleave', onLeave));
    });
  });
}
