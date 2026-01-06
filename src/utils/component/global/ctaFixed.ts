import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Store ScrollTrigger instances for cleanup
let ctaScrollTriggers: ScrollTrigger[] = [];

const killCtaFixed = (): void => {
  ctaScrollTriggers.forEach((trigger) => trigger.kill());
  ctaScrollTriggers = [];
};

// Animate CTA visibility
const showCta = (ctaFixed: HTMLElement): void => {
  gsap.to(ctaFixed, {
    scale: 1,
    opacity: 1,
    duration: 0.3,
    ease: 'power2.inOut',
  });
};

const hideCta = (ctaFixed: HTMLElement): void => {
  gsap.to(ctaFixed, {
    scale: 0,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.inOut',
  });
};

export const initCtaFixed = (): void => {
  killCtaFixed();

  const ctaFixed = document.querySelector<HTMLElement>('.cta-fixed_component');
  const mascotteElements = document.querySelectorAll<HTMLElement>('[asset="mascotte"]');

  if (!ctaFixed) return;

  if (mascotteElements.length === 0) {
    showCta(ctaFixed);
    return;
  }

  // Track active triggers (mascotte in viewport)
  const activeSet = new Set<ScrollTrigger>();

  // Function to update CTA based on active triggers
  const updateCta = (): void => {
    if (activeSet.size > 0) {
      hideCta(ctaFixed);
    } else {
      showCta(ctaFixed);
    }
  };

  // Create ScrollTriggers
  mascotteElements.forEach((mascotte) => {
    const trigger = ScrollTrigger.create({
      trigger: mascotte,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) {
          activeSet.add(self);
        } else {
          activeSet.delete(self);
        }
        updateCta();
      },
    });

    ctaScrollTriggers.push(trigger);
  });

  // Check initial state after triggers are created
  // Use RAF to ensure ScrollTrigger has calculated positions
  requestAnimationFrame(() => {
    ctaScrollTriggers.forEach((trigger) => {
      if (trigger.isActive) {
        activeSet.add(trigger);
      }
    });

    // Set initial state (instant, no animation)
    if (activeSet.size > 0) {
      gsap.set(ctaFixed, { scale: 0, opacity: 0 });
    } else {
      gsap.set(ctaFixed, { scale: 1, opacity: 1 });
    }
  });
};
