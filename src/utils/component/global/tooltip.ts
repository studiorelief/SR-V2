import './tooltip.css';

import gsap from 'gsap';

import { EASINGS } from '$utils/global/easings/easings';

// Store instances for cleanup
const tooltipInstances: Array<{
  component: HTMLElement;
  enter: () => void;
  leave: () => void;
}> = [];

export function initTooltip(): void {
  // Cleanup previous instances
  destroyTooltip();

  const components = document.querySelectorAll<HTMLElement>('.tooltip_component');

  components.forEach((component) => {
    const card = component.querySelector<HTMLElement>('.tooltip_card');
    if (!card) return;

    // Set initial state
    gsap.set(card, { display: 'none', opacity: 0, y: '2rem' });

    const enter = () => {
      gsap.killTweensOf(card);
      gsap.set(card, { display: 'flex' });
      gsap.to(card, {
        opacity: 1,
        y: '-2rem',
        duration: 0.4,
        delay: 0.15,
        ease: EASINGS.backOut,
      });
    };

    const leave = () => {
      gsap.killTweensOf(card);
      gsap.to(card, {
        opacity: 0,
        y: '2rem',
        duration: 0.3,
        delay: 0.15,
        ease: EASINGS.power2In,
        onComplete: () => {
          gsap.set(card, { display: 'none' });
        },
      });
    };

    component.addEventListener('mouseenter', enter);
    component.addEventListener('mouseleave', leave);

    tooltipInstances.push({ component, enter, leave });
  });
}

export function destroyTooltip(): void {
  tooltipInstances.forEach(({ component, enter, leave }) => {
    component.removeEventListener('mouseenter', enter);
    component.removeEventListener('mouseleave', leave);

    const card = component.querySelector<HTMLElement>('.tooltip_card');
    if (card) gsap.killTweensOf(card);
  });
  tooltipInstances.length = 0;
}
