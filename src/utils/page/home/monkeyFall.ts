import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animation de chute du monkey
 * L'élément tombe depuis yPercent -100% et rotate -10° vers 0% et 0°
 * Fonctionne sur tous les éléments ayant [trigger="home-monkey"]
 */
export const initMonkeyFall = (): void => {
  const monkeys = document.querySelectorAll<HTMLElement>('[trigger="home-monkey"]');
  const monkeysWrapper = document.querySelector<HTMLElement>('[trigger="home-monkey-wrapper"]');

  if (monkeys.length === 0) return;

  monkeys.forEach((monkey) => {
    // Kill l'ancien ScrollTrigger s'il existe pour cet élément
    ScrollTrigger.getAll().forEach((st) => {
      if (
        st.vars.id === `home-monkey-fall-${monkey.id || Array.from(monkeys).indexOf(monkey)}` &&
        st.trigger === monkey
      ) {
        st.kill();
      }
    });

    // Set l'état initial : position en haut (-100%) et rotation -10°
    gsap.set(monkey, {
      yPercent: -100,
      rotate: -10,
      force3D: true,
      willChange: 'transform',
    });

    // Animation de chute : de -100% à 0% et de -10° à 0°
    gsap.to(monkey, {
      yPercent: 0,
      rotate: 0,
      force3D: true,
      duration: 1,
      ease: 'bounce.out',
      scrollTrigger: {
        trigger: monkeysWrapper,
        start: 'top 50%',
        // scrub: true,
        invalidateOnRefresh: true,
        markers: false,
      },
    });
  });
};

/**
 * Nettoie tous les ScrollTriggers liés aux monkeys
 */
export const killMonkeyFall = (): void => {
  ScrollTrigger.getAll().forEach((st) => {
    if (typeof st.vars.id === 'string' && st.vars.id.startsWith('home-monkey-fall')) {
      st.kill();
    }
  });
};
