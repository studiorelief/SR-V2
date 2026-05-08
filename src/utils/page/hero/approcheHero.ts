import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let parallaxTrigger: ScrollTrigger | null = null;

/**
 * Parallax combiné (normal + inverté) sur les éléments du hero approche.
 * Trigger : .section_hero (range top top → bottom top)
 *
 * On fusionne les 2 anciens triggers (parallax + parallax-invert) dans une
 * seule timeline + un seul scrub : 1 ticker GSAP au lieu de 2 actifs en
 * parallèle pendant le scroll → moins de charge compositor sur les browsers
 * sensibles (Safari, DIA en navigation privée). Visuellement identique :
 *   - [approche-trigger="parallax"]        → y: 2.5rem
 *   - [approche-trigger="parallax-invert"] → y: -2.5rem
 */
export const initApprocheParallax = (): void => {
  const parallaxElements = document.querySelectorAll<HTMLElement>('[approche-trigger="parallax"]');
  const parallaxInvertElements = document.querySelectorAll<HTMLElement>(
    '[approche-trigger="parallax-invert"]'
  );
  if (parallaxElements.length === 0 && parallaxInvertElements.length === 0) return;

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (!heroSection) return;

  // Prépare le GPU pour les éléments effectivement animés
  if (parallaxElements.length > 0) {
    gsap.set(parallaxElements, { willChange: 'transform', force3D: true });
  }
  if (parallaxInvertElements.length > 0) {
    gsap.set(parallaxInvertElements, { willChange: 'transform', force3D: true });
  }

  const tl = gsap.timeline();
  if (parallaxElements.length > 0) {
    tl.to(parallaxElements, { y: '2.5rem', ease: 'none' }, 0);
  }
  if (parallaxInvertElements.length > 0) {
    tl.to(parallaxInvertElements, { y: '-2.5rem', ease: 'none' }, 0);
  }

  parallaxTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    markers: false,
    animation: tl,
  });
};

/**
 * Destroy le ScrollTrigger combiné + nettoie le will-change.
 */
export const destroyApprocheParallax = (): void => {
  if (parallaxTrigger) {
    parallaxTrigger.kill();
    parallaxTrigger = null;
  }

  const parallaxElements = document.querySelectorAll<HTMLElement>('[approche-trigger="parallax"]');
  if (parallaxElements.length > 0) {
    gsap.set(parallaxElements, { clearProps: 'willChange' });
  }
  const parallaxInvertElements = document.querySelectorAll<HTMLElement>(
    '[approche-trigger="parallax-invert"]'
  );
  if (parallaxInvertElements.length > 0) {
    gsap.set(parallaxInvertElements, { clearProps: 'willChange' });
  }
};

/**
 * @deprecated Fusionné dans `initApprocheParallax`. Conservé comme no-op pour
 * préserver l'API existante côté `swupNamespaceRegistry`.
 */
export const initApprocheParallaxInvert = (): void => {
  // no-op — la timeline combinée dans `initApprocheParallax` gère les 2 directions.
};

/**
 * @deprecated Fusionné dans `destroyApprocheParallax`. Conservé comme no-op.
 */
export const destroyApprocheParallaxInvert = (): void => {
  // no-op
};
