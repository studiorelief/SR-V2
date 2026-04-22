import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let heroScrollTrigger: ScrollTrigger | null = null;
let grotteScrollTrigger: ScrollTrigger | null = null;
let parallaxScrollTriggers: ScrollTrigger[] = [];
let stepScrollTriggers: ScrollTrigger[] = [];
let lampScrollTriggers: ScrollTrigger[] = [];
let lampMouseMoveHandler: ((e: MouseEvent) => void) | null = null;

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
    willChange: 'transform, opacity',
    force3D: true,
  });

  heroScrollTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 0.3,
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
    end: 'bottom+=75% top',
    scrub: 0.3,
    invalidateOnRefresh: true,
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

/**
 * Scroll parallax on elements with [approche-parallax] attribute
 * Trigger: closest .approche_process_step-wrapper (parent)
 * Elements translate upward based on attribute value: small | medium | big
 */
export const initApprocheProcessParallax = (): void => {
  const parallaxElements = document.querySelectorAll<HTMLElement>('[approche-parallax]');
  if (!parallaxElements.length) return;

  const distanceMap: Record<string, string> = {
    small: '-30vh',
    medium: '-40vh',
    big: '-50vh',
  };

  parallaxElements.forEach((element) => {
    const wrapper = element.closest<HTMLElement>('.approche_process_step-wrapper');
    if (!wrapper) return;

    const size = element.getAttribute('approche-parallax')?.trim() ?? '';
    const distance = distanceMap[size];
    if (!distance) return;

    gsap.set(element, {
      willChange: 'transform',
      force3D: true,
    });

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2,
      invalidateOnRefresh: true,
      animation: gsap.to(element, {
        y: distance,
        ease: 'none',
      }),
    });

    parallaxScrollTriggers.push(trigger);
  });
};

/**
 * Destroy approche process parallax ScrollTriggers
 */
export const destroyApprocheProcessParallax = (): void => {
  parallaxScrollTriggers.forEach((trigger) => trigger.kill());
  parallaxScrollTriggers = [];

  const parallaxElements = document.querySelectorAll<HTMLElement>('[approche-parallax]');
  parallaxElements.forEach((element) => {
    gsap.set(element, { clearProps: 'willChange,transform' });
  });
};

/**
 * Scale-in animation on elements with [approche-step] attribute
 * Trigger: closest .approche_process_step-wrapper (parent)
 * Elements scale from 0 to 1 with backOut ease when wrapper enters viewport
 */
export const initApprocheStepScale = (): void => {
  const stepElements = document.querySelectorAll<HTMLElement>('[approche-step]');
  if (!stepElements.length) return;

  stepElements.forEach((element) => {
    const wrapper = element.closest<HTMLElement>('.approche_process_step-wrapper');
    if (!wrapper) return;

    gsap.set(element, {
      opacity: 0,
      scale: 0,
      transformOrigin: 'center center',
      willChange: 'transform',
      force3D: true,
    });

    const trigger = ScrollTrigger.create({
      // markers: true,
      trigger: wrapper,
      start: 'top 50%',
      end: 'bottom top',
      toggleActions: 'play reverse play reverse',
      invalidateOnRefresh: true,
      animation: gsap.to(element, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
      }),
    });

    stepScrollTriggers.push(trigger);
  });
};

/**
 * Destroy approche step scale ScrollTriggers
 */
export const destroyApprocheStepScale = (): void => {
  stepScrollTriggers.forEach((trigger) => trigger.kill());
  stepScrollTriggers = [];

  const stepElements = document.querySelectorAll<HTMLElement>('[approche-step]');
  stepElements.forEach((element) => {
    gsap.set(element, { clearProps: 'willChange,transform,scale,transformOrigin' });
  });
};

/**
 * Lamp animations
 * - Slide-in from side + fade: is-left from left→right, is-right from right→left
 *   Trigger: closest .approche_process_step-wrapper
 * - Mouse parallax: lamps follow mouse on Y axis only
 */
export const initApprocheLampAnimations = (): void => {
  const lampElements = document.querySelectorAll<HTMLElement>('.approche_process_lamp');
  if (!lampElements.length) return;

  const MOUSE_Y_OFFSET = 20;
  const yQuickSetters: ((value: number) => void)[] = [];

  lampElements.forEach((element) => {
    const wrapper = element.closest<HTMLElement>('.approche_process_step-wrapper');
    if (!wrapper) return;

    const isLeft = element.classList.contains('is-left');
    const fromXPercent = isLeft ? -50 : 50;

    gsap.set(element, {
      xPercent: fromXPercent,
      opacity: 0,
      willChange: 'transform, opacity',
      force3D: true,
    });

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top 75%',
      end: 'bottom top',
      toggleActions: 'play reverse play reverse',
      invalidateOnRefresh: true,
      animation: gsap.fromTo(
        element,
        { xPercent: fromXPercent, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 0.9, ease: 'power2.out' }
      ),
    });

    lampScrollTriggers.push(trigger);

    yQuickSetters.push(gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power2.out' }));
  });

  lampMouseMoveHandler = (event: MouseEvent) => {
    const normalized = (event.clientY / window.innerHeight) * 2 - 1;
    const offset = normalized * MOUSE_Y_OFFSET;
    yQuickSetters.forEach((setY) => setY(offset));
  };

  window.addEventListener('mousemove', lampMouseMoveHandler);
};

/**
 * Destroy approche lamp animations
 */
export const destroyApprocheLampAnimations = (): void => {
  lampScrollTriggers.forEach((trigger) => trigger.kill());
  lampScrollTriggers = [];

  if (lampMouseMoveHandler) {
    window.removeEventListener('mousemove', lampMouseMoveHandler);
    lampMouseMoveHandler = null;
  }

  const lampElements = document.querySelectorAll<HTMLElement>('.approche_process_lamp');
  lampElements.forEach((element) => {
    gsap.set(element, { clearProps: 'willChange,transform,opacity' });
  });
};
