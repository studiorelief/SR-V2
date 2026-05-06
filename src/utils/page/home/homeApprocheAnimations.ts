import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let falaiseScrollTriggers: ScrollTrigger[] = [];
let lueurMouseMoveHandler: ((e: MouseEvent) => void) | null = null;

/**
 * Scroll parallax on [section-approche="falaise"]
 * Trigger: closest [section-approche="falaise-wrapper"]
 * The falaise translates upward as the user scrolls through the wrapper.
 */
export const initHomeApprocheFalaiseParallax = (): void => {
  const falaiseElements = document.querySelectorAll<HTMLElement>('[section-approche="falaise"]');
  if (!falaiseElements.length) return;

  falaiseElements.forEach((element) => {
    const wrapper = element.closest<HTMLElement>('[section-approche="falaise-wrapper"]');
    if (!wrapper) return;

    gsap.set(element, {
      willChange: 'transform',
      force3D: true,
    });

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: '50% bottom',
      end: 'bottom top',
      scrub: 2,
      invalidateOnRefresh: true,
      animation: gsap.to(element, {
        y: '-8rem',
        ease: 'none',
      }),
    });

    falaiseScrollTriggers.push(trigger);
  });
};

/**
 * Destroy home approche falaise parallax ScrollTriggers
 */
export const destroyHomeApprocheFalaiseParallax = (): void => {
  falaiseScrollTriggers.forEach((trigger) => trigger.kill());
  falaiseScrollTriggers = [];

  const falaiseElements = document.querySelectorAll<HTMLElement>('[section-approche="falaise"]');
  falaiseElements.forEach((element) => {
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: 'willChange,transform' });
  });
};

/**
 * Mouse parallax on [section-approche="lueur"]
 * The lueur follows mouse on Y axis only, smoothed via gsap.quickTo.
 */
export const initHomeApprocheLueurMouseParallax = (): void => {
  const lueurElements = document.querySelectorAll<HTMLElement>('[section-approche="lueur"]');
  if (!lueurElements.length) return;

  const MOUSE_Y_OFFSET = 40;
  const yQuickSetters: ((value: number) => void)[] = [];

  lueurElements.forEach((element) => {
    gsap.set(element, {
      willChange: 'transform',
      force3D: true,
    });

    yQuickSetters.push(gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power2.out' }));
  });

  lueurMouseMoveHandler = (event: MouseEvent) => {
    const normalized = (event.clientY / window.innerHeight) * 2 - 1;
    const offset = normalized * MOUSE_Y_OFFSET;
    yQuickSetters.forEach((setY) => setY(offset));
  };

  window.addEventListener('mousemove', lueurMouseMoveHandler);
};

/**
 * Destroy home approche lueur mouse parallax
 */
export const destroyHomeApprocheLueurMouseParallax = (): void => {
  if (lueurMouseMoveHandler) {
    window.removeEventListener('mousemove', lueurMouseMoveHandler);
    lueurMouseMoveHandler = null;
  }

  const lueurElements = document.querySelectorAll<HTMLElement>('[section-approche="lueur"]');
  lueurElements.forEach((element) => {
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: 'willChange,transform' });
  });
};
