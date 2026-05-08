import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

import { setupAndAnimateGlareHero } from '$utils/global/animations/glareHero';

// Type étendu pour stocker SplitText sur l'élément
type H2WithSplit = HTMLElement & { _splitText?: SplitText };

/**
 * Pose UNIQUEMENT l'état initial des éléments hero (positions pré-animation).
 * À appeler tôt — typiquement au tout début de `init()`, AVANT que le
 * préloader ne devienne visible — pour éviter un FOUC où les sun / lueurs / h2
 * apparaissent dans leur position naturelle Webflow pendant le fade out du
 * préloader, puis snap à l'état pré-animation au moment où l'animation démarre.
 *
 * Idempotent : safe si rappelé plusieurs fois (revert l'ancien SplitText
 * avant d'en recréer un). C'est attendu : le boot pose l'état initial une
 * fois tôt, puis `setupAndAnimateGlobalHero` (à preloaderComplete ou sur
 * Swup transition) le rappelle pour assurer la fraîcheur sur le DOM courant.
 */
export const setupGlobalHeroInitialState = (): void => {
  const sections = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-section"]');
  const suns = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-sun"]');
  const lueurs = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-lueurs"]');

  if (sections.length === 0 && suns.length === 0 && lueurs.length === 0) return;

  // 1. Suns : position basse, prêts à remonter
  if (suns.length > 0) {
    gsap.set(suns, { yPercent: 25 });
  }

  // 2. Lueurs : position haute, invisibles, scale réduit (sauf mobile)
  if (lueurs.length > 0) {
    const isMobile = window.matchMedia('(max-width: 479px)').matches;
    gsap.set(lueurs, {
      yPercent: -25,
      opacity: 0,
      scale: isMobile ? 1 : 0.75,
      transformOrigin: 'top',
    });
  }

  // 3. h2 → SplitText + chars invisibles, prêts à remonter
  sections.forEach((section) => {
    const h2 = section.querySelector('h2') as H2WithSplit | null;
    if (!h2) return;

    if (h2._splitText) {
      h2._splitText.revert();
    }

    const split = new SplitText(h2, {
      type: 'chars',
      charsClass: 'char',
    });
    h2._splitText = split;

    gsap.set(split.chars, { opacity: 0, yPercent: 50 });
  });
};

/**
 * Setup ET animation du hero global en une seule fonction.
 * Cette fonction ré-applique l'état initial (idempotent — safe si déjà fait
 * au boot via `setupGlobalHeroInitialState`) puis ajoute les animations à
 * la timeline parent.
 *
 * @param parentTl - Timeline parent à laquelle ajouter les animations
 * @param startPosition - Position de départ dans la timeline parent
 */
export const setupAndAnimateGlobalHero = (
  parentTl: gsap.core.Timeline,
  startPosition: string | number = 0
): void => {
  const sections = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-section"]');
  const suns = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-sun"]');
  const lueurs = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-lueurs"]');
  const heroTags = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-tag"]');

  // Si aucun élément hero, on sort
  if (sections.length === 0 && suns.length === 0 && lueurs.length === 0 && heroTags.length === 0)
    return;

  // Garantit l'état initial — couvre le cas Swup transition (DOM fraîchement
  // injecté), et reste idempotent si déjà posé au boot.
  setupGlobalHeroInitialState();

  // ============================================
  // 1. SUNS - Animation
  // ============================================
  if (suns.length > 0) {
    suns.forEach((sun) => {
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
  // 2. LUEURS - Animation (descend du haut avec scale)
  // ============================================
  if (lueurs.length > 0) {
    lueurs.forEach((lueur) => {
      parentTl.to(
        lueur,
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: 2,
          ease: 'power3.out',
          force3D: true,
        },
        startPosition
      );
    });
  }

  // ============================================
  // 3. h2 SplitText - Animation
  // ============================================
  sections.forEach((section) => {
    const h2 = section.querySelector('h2') as H2WithSplit | null;
    if (!h2 || !h2._splitText) return;

    parentTl.to(
      h2._splitText.chars,
      {
        opacity: 1,
        yPercent: 0,
        duration: 0.5,
        stagger: 0.03,
        ease: 'back.out(1.7)',
      },
      startPosition
    );
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
  const lueurs = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-lueurs"]');

  if (suns.length === 0 && lueurs.length === 0) return;

  // Utilise tl.call() pour déclencher l'animation au bon moment
  // sans l'ajouter à la timeline (ne bloque pas la transition)
  parentTl.call(
    () => {
      // Suns - descendent
      suns.forEach((sun) => {
        gsap.to(sun, {
          yPercent: 100,
          duration: 0.6,
          ease: 'power2.in',
          force3D: true,
        });
      });

      // Lueurs - remontent avec scale (inverse de l'entrée)
      lueurs.forEach((lueur) => {
        gsap.to(lueur, {
          yPercent: -100,
          scale: 0.8,
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
