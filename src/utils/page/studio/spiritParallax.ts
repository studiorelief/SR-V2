import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let spiritScrollTriggers: ScrollTrigger[] = [];

/**
 * Animations scroll de la section spirit (page studio)
 * Trigger : [parallax-spirit="trigger"]
 * - [parallax-spirit="bottom"] et [parallax-spirit="steps"] : parallax y 7rem → 0
 * - [parallax-spirit="steps"] : fade-in opacity 0 → 1
 */
export const initSpiritParallax = (): void => {
  const wrappers = document.querySelectorAll<HTMLElement>('[parallax-spirit="trigger"]');
  if (!wrappers.length) return;

  wrappers.forEach((wrapper) => {
    // Parallax vertical (bottom + steps)
    const parallaxElements = wrapper.querySelectorAll<HTMLElement>(
      '[parallax-spirit="bottom"], [parallax-spirit="steps"]'
    );
    parallaxElements.forEach((element) => {
      gsap.set(element, {
        willChange: 'transform',
        force3D: true,
      });

      const trigger = ScrollTrigger.create({
        trigger: wrapper,
        start: '50% bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        animation: gsap.fromTo(element, { y: '7rem' }, { y: '0rem', ease: 'none' }),
      });

      spiritScrollTriggers.push(trigger);
    });

    // Fade-in (steps)
    const stepsElements = wrapper.querySelectorAll<HTMLElement>('[parallax-spirit="steps"]');
    stepsElements.forEach((element) => {
      const trigger = ScrollTrigger.create({
        trigger: wrapper,
        start: '125% bottom',
        end: '100% 25%',
        scrub: true,
        invalidateOnRefresh: true,
        animation: gsap.fromTo(element, { opacity: 0 }, { opacity: 1, ease: 'none' }),
      });

      spiritScrollTriggers.push(trigger);
    });
  });
};

/**
 * Détruit les ScrollTriggers de la section spirit
 */
export const destroySpiritParallax = (): void => {
  spiritScrollTriggers.forEach((trigger) => trigger.kill());
  spiritScrollTriggers = [];

  const elements = document.querySelectorAll<HTMLElement>(
    '[parallax-spirit="bottom"], [parallax-spirit="steps"]'
  );
  elements.forEach((element) => {
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: 'willChange,transform,opacity' });
  });
};
