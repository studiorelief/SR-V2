import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let heroParallaxTrigger: ScrollTrigger | null = null;

/**
 * Animation du logo du portfolio CMS au chargement de la page
 * Slide up de y: 5rem à 0 et opacité de 0 à 1
 * Fonctionne sur l'élément ayant [cms-portfolio-trigger="logo"]
 */

/**
 * Setup l'état initial du logo (à appeler AVANT que le rideau se lève)
 * Position en bas (5rem) et opacité 0
 */
export const initSetupCmsPortfolioHero = (): void => {
  const logo = document.querySelector<HTMLElement>('[cms-portfolio-trigger="logo"]');
  if (!logo) return;

  gsap.set(logo, {
    y: '5rem',
    opacity: 0,
    force3D: true,
    willChange: 'transform, opacity',
  });
};

/**
 * Lance l'animation du logo (à appeler APRÈS que le rideau soit levé)
 * Slide up et fade in
 */
export const initAnimateCmsPortfolioHero = (): void => {
  const logo = document.querySelector<HTMLElement>('[cms-portfolio-trigger="logo"]');
  if (!logo) return;

  gsap.to(logo, {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power3.out',
    force3D: true,
    clearProps: 'willChange', // Nettoie willChange après l'animation
  });
};

/**
 * Legacy - Setup + Animation en une fois (pour premier chargement sans transition)
 */
export const initCmsPortfolioHero = (): void => {
  initSetupCmsPortfolioHero();
  initAnimateCmsPortfolioHero();
};

/**
 * Parallax effect on the hero section
 * The section moves up and logo scales down as user scrolls
 */
export const initCmsPortfolioParallax = (): void => {
  const heroSection = document.querySelector<HTMLElement>('.section_projets_hero');
  const logo = document.querySelector<HTMLElement>('[cms-portfolio-trigger="logo"]');
  if (!heroSection) return;

  const tl = gsap.timeline();

  tl.to(heroSection, {
    y: '50vh',
    ease: 'none',
  });

  if (logo) {
    tl.to(
      logo,
      {
        scale: 0.8,
        ease: 'none',
      },
      0
    );
  }

  heroParallaxTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 0,
    markers: false,
    animation: tl,
  });
};

/**
 * Destroy parallax ScrollTrigger
 */
export const destroyCmsPortfolioParallax = (): void => {
  if (heroParallaxTrigger) {
    heroParallaxTrigger.kill();
    heroParallaxTrigger = null;
  }
};
