import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

import { setupAndAnimateGlareHero } from '$utils/global/animations/glareHero';

gsap.registerPlugin(SplitText);

// Type étendu pour stocker SplitText sur l'élément
type H2WithSplit = HTMLElement & { _splitText?: SplitText };

/**
 * Setup ET animation du hero global en une seule fonction
 * Cette fonction fait le setup puis crée la timeline d'animation
 * @param parentTl - Timeline parent à laquelle ajouter les animations
 * @param startPosition - Position de départ dans la timeline parent
 */
export const setupAndAnimateGlobalHero = (
  parentTl: gsap.core.Timeline,
  startPosition: string | number = 0
): void => {
  const sections = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-section"]');
  const suns = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-sun"]');
  const heroTags = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-tag"]');

  // Si aucun élément hero, on sort
  if (sections.length === 0 && suns.length === 0 && heroTags.length === 0) return;

  // ============================================
  // 1. SUNS - Setup + Animation
  // ============================================
  if (suns.length > 0) {
    suns.forEach((sun) => {
      // Setup
      gsap.set(sun, { yPercent: 25 });

      // Animation
      parentTl.to(
        sun,
        {
          yPercent: 0,
          duration: 2,
          ease: 'power3.out',
          force3D: true,
        },
        startPosition
      );
    });
  }

  // ============================================
  // 2 & 3. Pour chaque section : h2 SplitText + hero_content
  // ============================================
  sections.forEach((section) => {
    const h2 = section.querySelector('h2') as H2WithSplit | null;

    // H2 - Setup + Animation avec SplitText
    if (h2) {
      // Revert l'ancien SplitText s'il existe
      if (h2._splitText) {
        h2._splitText.revert();
      }

      // Créer un nouveau SplitText
      const split = new SplitText(h2, {
        type: 'chars',
        charsClass: 'char',
      });

      h2._splitText = split;

      // Setup (hidden)
      gsap.set(split.chars, { opacity: 0, yPercent: 50 });

      // Animation - même temps que sun
      parentTl.to(
        split.chars,
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.5,
          stagger: 0.03,
          ease: 'back.out(1.7)',
        },
        startPosition
      );
    }
  });

  // ============================================
  // 4. GLARE sur hero-tag (après SplitText ~1s ou immédiatement)
  // ============================================
  if (heroTags.length > 0) {
    // Si SplitText existe, attendre ~1s, sinon démarrer tout de suite
    const hasSplitText = sections.length > 0;
    const glareStartTime =
      typeof startPosition === 'number'
        ? startPosition + (hasSplitText ? 1 : 0)
        : hasSplitText
          ? 1
          : 0;

    setupAndAnimateGlareHero(parentTl, glareStartTime, {
      glareColor: '#ffffff',
      glareOpacity: 0.8,
      duration: 1.5,
      angle: 90,
    });
  }
};

/**
 * Animation inverse du hero-sun pour la transition leave
 * Le soleil descend de 0 à 100 yPercent
 * L'animation est lancée de façon indépendante pour ne pas bloquer la transition
 * @param parentTl - Timeline parent (utilisée uniquement pour le timing de départ)
 * @param startPosition - Position de départ dans la timeline parent
 */
export const animateGlobalHeroLeave = (
  parentTl: gsap.core.Timeline,
  startPosition: string | number = 0
): void => {
  const suns = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-sun"]');

  if (suns.length === 0) return;

  // Utilise tl.call() pour déclencher l'animation au bon moment
  // sans l'ajouter à la timeline (ne bloque pas la transition)
  parentTl.call(
    () => {
      suns.forEach((sun) => {
        gsap.to(sun, {
          yPercent: 100,
          duration: 0.6,
          ease: 'power2.in',
          force3D: true,
        });
      });
    },
    [],
    startPosition
  );
};

/**
 * Fonction legacy pour le premier chargement (sans Swup)
 * Crée sa propre timeline et la joue
 */
export const initGlobalHero = (): void => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  setupAndAnimateGlobalHero(tl, 0);
};
