import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 *==========================================
 * BARBA
 * ↳ COURBE HEADING
 *==========================================
 */

interface CtaHeadingConfig {
  /** Hauteur de la courbe (en pixels ou pourcentage) */
  curveHeight?: number | string;
  /** Offset vertical de la courbe */
  verticalOffset?: number;
  /** Animation au scroll (true) ou statique (false) */
  animateOnScroll?: boolean;
}

const defaultConfig: Required<CtaHeadingConfig> = {
  curveHeight: 150, // Valeur par défaut plus marquée (augmentée de 30 à 50)
  verticalOffset: 0,
  animateOnScroll: false,
};

/**
 * Instance d'une animation CTA Heading
 */
interface CtaHeadingInstance {
  element: HTMLElement;
  svg: SVGSVGElement;
  animation: gsap.core.Tween | gsap.core.Timeline;
  destroy: () => void;
}

const instances: CtaHeadingInstance[] = [];

/**
 * Convertit curveHeight en pixels
 */
const getCurveHeightInPixels = (curveHeight: number | string, height: number): number => {
  if (typeof curveHeight === 'string' && curveHeight.endsWith('%')) {
    const percentage = parseFloat(curveHeight) / 100;
    return height * percentage;
  }
  return typeof curveHeight === 'number' ? curveHeight : parseFloat(String(curveHeight)) || 30;
};

/**
 * Crée un path SVG pour une courbe arquée avec une hauteur de courbe variable
 */
const createArcPath = (
  width: number,
  height: number,
  curveHeightPx: number,
  verticalOffset: number
): string => {
  const startY = height / 2 + verticalOffset;
  const endY = height / 2 + verticalOffset;
  const controlY = startY - curveHeightPx;

  // Créer une courbe quadratique arquée
  return `M 0 ${startY} Q ${width / 2} ${controlY} ${width} ${endY}`;
};

/**
 * Crée un élément SVG text avec les styles du texte original
 */
const createSVGText = (svgNS: string, textStyles: CSSStyleDeclaration): SVGTextElement => {
  const textSvg = document.createElementNS(svgNS, 'text') as SVGTextElement;
  textSvg.setAttribute('font-family', textStyles.fontFamily);
  textSvg.setAttribute('font-size', textStyles.fontSize);
  textSvg.setAttribute('font-weight', textStyles.fontWeight);
  textSvg.setAttribute('letter-spacing', textStyles.letterSpacing || 'normal');
  textSvg.setAttribute('fill', textStyles.color);
  textSvg.setAttribute('dominant-baseline', 'middle');
  textSvg.setAttribute('text-anchor', 'middle');
  if (textStyles.textTransform !== 'none') {
    textSvg.style.textTransform = textStyles.textTransform;
  }
  return textSvg;
};

/**
 * Initialise l'animation CTA Heading sur un élément spécifique
 */
const initCtaHeadingOnElement = (
  element: HTMLElement,
  config: Required<CtaHeadingConfig>
): CtaHeadingInstance | null => {
  if (element.hasAttribute('data-cta-heading-initialized')) {
    return null;
  }
  element.setAttribute('data-cta-heading-initialized', 'true');

  const textContent = element.textContent?.trim();
  if (!textContent) {
    element.removeAttribute('data-cta-heading-initialized');
    return null;
  }

  // Récupérer les dimensions et styles
  const rect = element.getBoundingClientRect();
  const textStyles = getComputedStyle(element);

  // Récupérer la configuration spécifique à l'élément via data attributes
  const elementCurveHeight = element.getAttribute('data-curve-height');
  const elementVerticalOffset = element.getAttribute('data-vertical-offset');
  const elementAnimateOnScroll = element.getAttribute('data-animate-scroll');

  // Utiliser les valeurs de l'élément si présentes, sinon utiliser la config globale
  const finalConfig: Required<CtaHeadingConfig> = {
    curveHeight: elementCurveHeight
      ? elementCurveHeight.includes('%')
        ? elementCurveHeight
        : parseFloat(elementCurveHeight) || config.curveHeight
      : config.curveHeight,
    verticalOffset: elementVerticalOffset
      ? parseFloat(elementVerticalOffset) || config.verticalOffset
      : config.verticalOffset,
    animateOnScroll:
      elementAnimateOnScroll !== null ? elementAnimateOnScroll === 'true' : config.animateOnScroll,
  };

  // Trouver le wrapper pour le ScrollTrigger
  const wrapper = element.closest<HTMLElement>('[trigger="cta-heading-wrapper"]');
  const triggerElement = wrapper || element;

  // Créer le SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const uniqueId = `cta-heading-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Utiliser les dimensions de l'élément
  const svgWidth = rect.width || 600;
  const svgHeight = rect.height || 100;

  svg.setAttribute('width', String(svgWidth));
  svg.setAttribute('height', String(svgHeight));
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  `;

  // Calculer la hauteur de courbe finale en pixels
  const finalCurveHeightPx = getCurveHeightInPixels(finalConfig.curveHeight, svgHeight);

  // Créer le path courbe (commence à 0)
  const defs = document.createElementNS(svgNS, 'defs');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('id', uniqueId);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'none');

  // Initialiser le path avec une courbe à 0 (ligne droite)
  const initialPathD = createArcPath(svgWidth, svgHeight, 0, finalConfig.verticalOffset);
  path.setAttribute('d', initialPathD);
  defs.appendChild(path);
  svg.appendChild(defs);

  // Créer l'élément text
  const textSvg = createSVGText(svgNS, textStyles);
  const textPath = document.createElementNS(svgNS, 'textPath');
  textPath.setAttribute('href', `#${uniqueId}`);
  textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${uniqueId}`);
  textPath.setAttribute('startOffset', '50%');
  textPath.textContent = textContent;
  textSvg.appendChild(textPath);
  svg.appendChild(textSvg);

  // Configurer le container
  const computedStyle = getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'visible';
  element.style.color = 'transparent'; // Masquer le texte original mais garder l'espace
  element.appendChild(svg);

  // Animation de la courbe de 0 à curveHeight avec ScrollTrigger
  const curveHeightObj = { value: 0 };

  // Créer une timeline pour synchroniser les animations
  const tl = gsap.timeline({
    scrollTrigger: {
      markers: true,
      trigger: triggerElement,
      start: 'top bottom',
      end: 'center center',
      scrub: true,
    },
  });

  // Animation de la courbe
  tl.to(curveHeightObj, {
    value: finalCurveHeightPx,
    duration: 1,
    ease: 'none',
    onUpdate: () => {
      // Mettre à jour le path avec la nouvelle hauteur de courbe
      const newPathD = createArcPath(
        svgWidth,
        svgHeight,
        curveHeightObj.value,
        finalConfig.verticalOffset
      );
      path.setAttribute('d', newPathD);
    },
  });

  // Animation de translation vers le bas (1.5rem)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const translateY = 4 * rootFontSize; // 1.5rem en pixels

  tl.to(
    element,
    {
      y: translateY,
      duration: 1,
      ease: 'none',
    },
    0
  ); // Commence en même temps que l'animation de la courbe

  const animation = tl;

  return {
    element,
    svg,
    animation,
    destroy: () => {
      try {
        // Arrêter l'animation
        animation.kill();

        // Supprimer le ScrollTrigger si présent
        ScrollTrigger.getAll().forEach((trigger) => {
          if (
            trigger.vars.trigger === element ||
            trigger.vars.trigger === element.closest('[trigger="cta-heading-wrapper"]')
          ) {
            trigger.kill();
          }
        });

        // Supprimer le SVG si il existe
        if (svg && svg.parentNode) {
          svg.remove();
        }

        // Restaurer l'élément texte original si l'élément existe encore
        if (element && document.contains(element)) {
          element.style.color = '';
          element.style.overflow = '';
          element.removeAttribute('data-cta-heading-initialized');
        }
      } catch {
        // Ignorer les erreurs si les éléments n'existent plus
      }
    },
  };
};

/**
 * Initialise l'animation CTA Heading sur tous les éléments avec trigger="cta-heading"
 */
export const initCtaHeading = (config: Partial<CtaHeadingConfig> = {}): void => {
  const mergedConfig = { ...defaultConfig, ...config };
  const elements = document.querySelectorAll<HTMLElement>('[trigger="cta-heading"]');

  if (elements.length === 0) {
    return;
  }

  elements.forEach((element) => {
    const instance = initCtaHeadingOnElement(element, mergedConfig);
    if (instance) {
      instances.push(instance);
    }
  });
};

/**
 * Détruit toutes les instances CTA Heading
 */
export const destroyAllCtaHeadings = (): void => {
  instances.forEach((instance) => {
    try {
      instance.destroy();
    } catch {
      // Ignorer les erreurs si l'élément n'existe plus
    }
  });
  instances.length = 0;
};

/**
 * Crée une animation CTA Heading sur un élément spécifique
 */
export const createCtaHeadingAnimation = (
  element: HTMLElement,
  config: Partial<CtaHeadingConfig> = {}
): CtaHeadingInstance | null => {
  const mergedConfig = { ...defaultConfig, ...config };
  const instance = initCtaHeadingOnElement(element, mergedConfig);

  if (instance) {
    instances.push(instance);
  }

  return instance;
};

/*
 *==========================================
 * CTA ANIMATION HOVER
 *==========================================
 */

/*
 *============================================================================
 * CTA ANIMATION HOVER
 * ↳ ANIMATION FUNCTIONS - Chaque élément a sa propre fonction
 *============================================================================
 */

/**
 * Animation pour cta-eagle
 */
const animateCtaEagle = (
  tl: gsap.core.Timeline,
  element: HTMLElement,
  position: string | number
): void => {
  gsap.set(element, { objectPosition: '0% 50%', yPercent: -100, xPercent: 0 });

  tl.to(
    element,
    {
      yPercent: 0,
      xPercent: 0,
      objectPosition: '120% 50%',
      duration: 5,
      ease: 'power2.out',
      onComplete: () => {
        // Petit flottement vertical permanent entre -0.5rem et 0.5rem
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const amplitude = -0.5 * rootFontSize;
        gsap.to(element, {
          y: amplitude,
          duration: 1.2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          yoyoEase: 'sine.inOut',
        });
      },
    },
    position
  );
};

/**
 * Animation pour cta-mascotte-2
 */
const animateCtaMascotte2 = (
  tl: gsap.core.Timeline,
  element: HTMLElement,
  position: string | number
): void => {
  gsap.set(element, { objectPosition: '0% 50%', yPercent: -100, xPercent: -110 });

  tl.to(
    element,
    {
      yPercent: 0,
      xPercent: 0,
      objectPosition: '100% 50%',
      duration: 1,
      delay: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        // Petit flottement vertical permanent entre -0.5rem et 0.5rem
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const amplitude = 1 * rootFontSize;
        gsap.to(element, {
          y: amplitude,
          duration: 1.2,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          yoyoEase: 'sine.inOut',
        });
      },
    },
    position
  );
};

/**
 * Animation pour cta-mascotte-1
 */
const animateCtaMascotte1 = (
  tl: gsap.core.Timeline,
  element: HTMLElement,
  position: string | number
): void => {
  gsap.set(element, { objectPosition: '0% 50%' });

  tl.to(
    element,
    {
      objectPosition: '100% 50%',
      duration: 2,
      ease: 'power2.out',
    },
    position
  );
};

/**
 * Animation pour cta-sun
 */
const animateCtaSun = (
  tl: gsap.core.Timeline,
  element: HTMLElement,
  position: string | number
): void => {
  gsap.set(element, { objectPosition: '75% 50%' });

  tl.to(
    element,
    {
      objectPosition: '100% 50%',
      duration: 8,
      ease: 'easeIn',
    },
    position
  );
};

/**
 * Animation pour cta-cloud
 */
const animateCtaCloud = (
  tl: gsap.core.Timeline,
  element: HTMLElement,
  position: string | number
): void => {
  gsap.set(element, { objectPosition: '0% 50%' });

  tl.to(
    element,
    {
      objectPosition: '100% 50%',
      duration: 20,
      ease: 'power2.out',
    },
    position
  );
};

/**
 * Animation pour cta-plain
 */
const animateCtaPlain = (
  tl: gsap.core.Timeline,
  element: HTMLElement,
  position: string | number
): void => {
  gsap.set(element, { objectPosition: '0% 50%' });

  tl.to(
    element,
    {
      objectPosition: '100% 50%',
      duration: 4,
      ease: 'easeOut',
    },
    position
  );
};

/**
 * Animation pour cta-montain
 */
const animateCtaMontain = (
  tl: gsap.core.Timeline,
  element: HTMLElement,
  position: string | number
): void => {
  gsap.set(element, { objectPosition: '35% 50%' });

  tl.to(
    element,
    {
      objectPosition: '100% 50%',
      duration: 30,
      ease: 'easeOut',
    },
    position
  );
};

/*
 *============================================================================
 * CTA ANIMATION HOVER
 * ↳ INITIALIZATION
 *============================================================================
 */

/**
 * Initialise l'animation hover pour tous les éléments CTA
 */
export const initCtaAnimation = (): void => {
  const trigger = document.querySelector<HTMLElement>('.cta_a--trigger');
  const wrapper = document.querySelector<HTMLElement>('[trigger="cta-bg-wrapper"]');

  if (!trigger || !wrapper) {
    return;
  }

  // Trouver tous les éléments
  const eagle = wrapper.querySelector<HTMLElement>('[trigger="cta-eagle"]');
  const mascotte2 = wrapper.querySelector<HTMLElement>('[trigger="cta-mascotte-2"]');
  const mascotte1 = wrapper.querySelector<HTMLElement>('[trigger="cta-mascotte-1"]');
  const sun = wrapper.querySelector<HTMLElement>('[trigger="cta-sun"]');
  const cloud = wrapper.querySelector<HTMLElement>('[trigger="cta-cloud"]');
  const plain = wrapper.querySelector<HTMLElement>('[trigger="cta-plain"]');
  const montain = wrapper.querySelector<HTMLElement>('[trigger="cta-montain"]');

  // Créer la timeline principale
  const tl = gsap.timeline({ paused: true });

  // Ajouter chaque animation à la timeline principale
  if (eagle) {
    animateCtaEagle(tl, eagle, '0');
  }

  if (mascotte2) {
    animateCtaMascotte2(tl, mascotte2, '0');
  }

  if (mascotte1) {
    animateCtaMascotte1(tl, mascotte1, '0');
  }

  if (sun) {
    animateCtaSun(tl, sun, '0');
  }

  if (cloud) {
    animateCtaCloud(tl, cloud, '0');
  }

  if (plain) {
    animateCtaPlain(tl, plain, '0');
  }

  if (montain) {
    animateCtaMontain(tl, montain, '0');
  }

  // Gérer les événements hover
  let hoverInDelay: gsap.core.Tween | null = null;
  let hoverOutDelay: gsap.core.Tween | null = null;
  let isHovered = false;

  const handleMouseEnter = (): void => {
    isHovered = true;

    // Si un reverse différé était en attente, on l'annule
    if (hoverOutDelay) {
      hoverOutDelay.kill();
      hoverOutDelay = null;
    }

    // Si la timeline est déjà en train de se jouer à l'envers, on la remet en avant sans délai
    if (tl.isActive() && tl.reversed()) {
      tl.timeScale(1);
      tl.play();
      return;
    }

    // Annuler un éventuel ancien délai d'entrée
    if (hoverInDelay) {
      hoverInDelay.kill();
      hoverInDelay = null;
    }

    // Lancer l'animation seulement si le hover est toujours actif après 0.5s
    hoverInDelay = gsap.delayedCall(0.3, () => {
      if (!isHovered) return;
      tl.timeScale(1);
      tl.play();
    });
  };

  const handleMouseLeave = (): void => {
    isHovered = false;

    // Annuler un éventuel délai d'entrée encore en attente
    if (hoverInDelay) {
      hoverInDelay.kill();
      hoverInDelay = null;
    }

    // Annuler un précédent reverse différé
    if (hoverOutDelay) {
      hoverOutDelay.kill();
      hoverOutDelay = null;
    }

    // Planifier le reverse seulement si le pointeur est toujours en dehors au bout de 0.5s
    hoverOutDelay = gsap.delayedCall(0.5, () => {
      if (isHovered) return;
      tl.timeScale(3);
      tl.reverse();
    });
  };

  trigger.addEventListener('mouseenter', handleMouseEnter);
  trigger.addEventListener('mouseleave', handleMouseLeave);
};

/**
 * Détruit toutes les animations CTA
 */
export const destroyAllCtaAnimations = (): void => {
  // Pour l'instant, cette fonction est vide car nous n'avons pas de système de tracking des instances
  // Si nécessaire, on pourra ajouter un système de tracking plus tard
};
