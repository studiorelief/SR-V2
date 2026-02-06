import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const initHomeServices = (): void => {
  const wrapper = document.querySelector<HTMLElement>('[home-services="cards-wrapper"]');
  const cards = document.querySelectorAll<HTMLElement>('[home-services="cards"]');

  if (!wrapper || cards.length === 0) return;

  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const topOffsets = [4 * rem, 10 * rem, 14 * rem];
  const scaleValues = [0.8, 0.9];

  cards.forEach((card, index) => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.id === `home-services-card-${index}` && st.trigger === card) {
        st.kill();
      }
    });

    const isLast = index === cards.length - 1;

    gsap.to(card, {
      scale: isLast ? 1 : (scaleValues[index] ?? 0.9),
      transformOrigin: 'center top',
      ease: 'none',
      scrollTrigger: {
        id: `home-services-card-${index}`,
        trigger: card,
        start: `top ${topOffsets[index] ?? 0}`,
        endTrigger: wrapper,
        end: `bottom-=${Math.round(1.5 * rem)} bottom`,
        pin: true,
        pinSpacing: false,
        scrub: true,
        invalidateOnRefresh: true,
        markers: false,
      },
    });
  });
};

export const destroyHomeServices = (): void => {
  ScrollTrigger.getAll().forEach((st) => {
    if (typeof st.vars.id === 'string' && st.vars.id.startsWith('home-services-card')) {
      st.kill();
    }
  });
};
