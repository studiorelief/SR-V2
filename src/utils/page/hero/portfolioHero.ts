import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let secondPlanTrigger: ScrollTrigger | null = null;

/**
 * Parallax effect on portfolio page second-plan elements
 * Trigger: .section_hero
 * Elements move from y: 0 to y: 5rem as user scrolls
 */
export const initPortfolioSecondPlan = (): void => {
  const secondPlanElements = document.querySelectorAll<HTMLElement>(
    '[portfolio-trigger="parallax"]'
  );
  if (secondPlanElements.length === 0) return;

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (!heroSection) return;

  // Prépare le GPU pour l'animation
  gsap.set(secondPlanElements, {
    willChange: 'transform',
    force3D: true,
  });

  const tl = gsap.timeline();

  tl.to(secondPlanElements, {
    y: '2.5rem',
    ease: 'none',
  });

  secondPlanTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    markers: false,
    animation: tl,
  });
};

/**
 * Destroy portfolio second-plan ScrollTrigger
 */
export const destroyPortfolioSecondPlan = (): void => {
  if (secondPlanTrigger) {
    secondPlanTrigger.kill();
    secondPlanTrigger = null;
  }

  // Nettoie le will-change pour libérer le GPU
  const secondPlanElements = document.querySelectorAll<HTMLElement>(
    '[portfolio-trigger="second-plan"]'
  );
  if (secondPlanElements.length > 0) {
    gsap.set(secondPlanElements, { clearProps: 'willChange' });
  }
};
