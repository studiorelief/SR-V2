import gsap from 'gsap';

/**
 * Configuration de l'animation TextPath
 */
interface TextPathConfig {
  /** Durée d'un cycle complet de l'animation en secondes */
  duration?: number;
  /** Espacement entre les répétitions du texte (en caractères) */
  textGap?: string;
  /** Direction de l'animation ('clockwise' ou 'counterclockwise') */
  direction?: 'clockwise' | 'counterclockwise';
  /** Offset par rapport au bord du container (positif = extérieur) */
  pathOffset?: number;
}

const defaultConfig: Required<TextPathConfig> = {
  duration: 15,
  textGap: '    ',
  direction: 'clockwise',
  pathOffset: 20,
};

// Constantes
const MEASUREMENT_OFFSET = -9999;
const MIN_REPETITIONS = 1;
const ANIMATION_LOOPS = 2;
const RESIZE_DEBOUNCE_MS = 150;
const GAP_REM = 0.125;

/**
 * Instance d'une animation TextPath
 */
interface TextPathInstance {
  container: HTMLElement;
  svg: SVGSVGElement;
  animation: gsap.core.Tween;
  destroy: () => void;
}

const instances: TextPathInstance[] = [];
let resizeHandler: (() => void) | null = null;
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
let currentConfig: Partial<TextPathConfig> = {};

/**
 * Génère un path SVG pour un rectangle arrondi
 */
const createRoundedRectPath = (
  width: number,
  height: number,
  borderRadius: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  },
  offset: number = 0
): string => {
  const w = width + offset * 2;
  const h = height + offset * 2;
  const maxRadius = Math.min(w, h) / 2;

  const tl = Math.min(borderRadius.topLeft + offset, maxRadius);
  const tr = Math.min(borderRadius.topRight + offset, maxRadius);
  const br = Math.min(borderRadius.bottomRight + offset, maxRadius);
  const bl = Math.min(borderRadius.bottomLeft + offset, maxRadius);

  return [
    `M ${tl} 0`,
    `L ${w - tr} 0`,
    `Q ${w} 0 ${w} ${tr}`,
    `L ${w} ${h - br}`,
    `Q ${w} ${h} ${w - br} ${h}`,
    `L ${bl} ${h}`,
    `Q 0 ${h} 0 ${h - bl}`,
    `L 0 ${tl}`,
    `Q 0 0 ${tl} 0`,
  ].join(' ');
};

/**
 * Parse les valeurs de border-radius CSS
 */
const parseBorderRadius = (
  element: HTMLElement
): { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number } => {
  const computed = getComputedStyle(element);
  return {
    topLeft: parseFloat(computed.borderTopLeftRadius) || 0,
    topRight: parseFloat(computed.borderTopRightRadius) || 0,
    bottomRight: parseFloat(computed.borderBottomRightRadius) || 0,
    bottomLeft: parseFloat(computed.borderBottomLeftRadius) || 0,
  };
};

/**
 * Calcule l'espace de gap en espaces insécables
 */
const calculateGapSpace = (gapInPixels: number, fontSize: number): string => {
  return '\u00A0'.repeat(Math.ceil((gapInPixels / fontSize) * 3));
};

/**
 * Mesure un élément SVG hors écran
 */
const measureSVGElement = <T>(
  element: SVGSVGElement,
  callback: (element: SVGSVGElement) => T
): T => {
  element.style.position = 'fixed';
  element.style.left = `${MEASUREMENT_OFFSET}px`;
  element.style.top = `${MEASUREMENT_OFFSET}px`;
  document.body.appendChild(element);
  const result = callback(element);
  document.body.removeChild(element);
  return result;
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
  textSvg.setAttribute('dominant-baseline', 'auto');
  textSvg.setAttribute('dy', '-0.35em');
  if (textStyles.textTransform !== 'none') {
    textSvg.style.textTransform = textStyles.textTransform;
  }
  return textSvg;
};

/**
 * Calcule le letter-spacing et les dimensions pour que le texte remplisse exactement le périmètre
 */
const calculateTextSpacing = (
  pathLength: number,
  baseTextWidth: number,
  textContent: string,
  gapBetweenRepetitions: number,
  baseLetterSpacing: number,
  fontSize: number
): {
  repetitionsPerLoop: number;
  finalLetterSpacing: number;
  gapSpace: string;
  singleRepetitionWidth: number;
} => {
  // Calculer le nombre de répétitions
  const maxRepetitionsPerLoop = Math.floor(pathLength / (baseTextWidth + gapBetweenRepetitions));
  const repetitionsPerLoop = Math.max(maxRepetitionsPerLoop, MIN_REPETITIONS);

  // Calculer le letter-spacing initial
  const totalGapsWidth = gapBetweenRepetitions * (repetitionsPerLoop - 1);
  const targetWidthPerRepetition = (pathLength - totalGapsWidth) / repetitionsPerLoop;
  const letterSpacingAdjustment = (targetWidthPerRepetition - baseTextWidth) / textContent.length;
  const adjustedLetterSpacing = baseLetterSpacing + letterSpacingAdjustment;

  // Créer le gap space
  const gapSpace = calculateGapSpace(gapBetweenRepetitions, fontSize);

  return {
    repetitionsPerLoop,
    finalLetterSpacing: adjustedLetterSpacing,
    gapSpace,
    singleRepetitionWidth: targetWidthPerRepetition,
  };
};

/**
 * Initialise l'animation TextPath sur un container spécifique
 */
const initTextPathOnElement = (
  container: HTMLElement,
  config: Required<TextPathConfig>
): TextPathInstance | null => {
  if (container.hasAttribute('data-textpath-initialized')) {
    return null;
  }
  container.setAttribute('data-textpath-initialized', 'true');

  const textElement = container.querySelector<HTMLElement>('[trigger="text-path-content"]');
  if (!textElement) {
    container.removeAttribute('data-textpath-initialized');
    return null;
  }

  const textContent = textElement.textContent?.trim();
  if (!textContent) {
    return null;
  }

  // Récupérer les dimensions et styles
  const rect = container.getBoundingClientRect();
  const borderRadius = parseBorderRadius(container);
  const textStyles = getComputedStyle(textElement);
  const fontSize = parseFloat(textStyles.fontSize) || 16;
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const gapBetweenRepetitions = GAP_REM * rootFontSize;

  // Créer le SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const uniqueId = `textpath-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const padding = config.pathOffset + 50;

  svg.setAttribute('width', String(rect.width + padding * 2));
  svg.setAttribute('height', String(rect.height + padding * 2));
  svg.setAttribute('viewBox', `0 0 ${rect.width + padding * 2} ${rect.height + padding * 2}`);
  svg.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    overflow: visible;
    z-index: 10;
    visibility: hidden;
  `;

  // Créer le path
  const pathD = createRoundedRectPath(rect.width, rect.height, borderRadius, config.pathOffset);
  const defs = document.createElementNS(svgNS, 'defs');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('id', uniqueId);
  path.setAttribute(
    'transform',
    `translate(${padding - config.pathOffset}, ${padding - config.pathOffset})`
  );
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  defs.appendChild(path);
  svg.appendChild(defs);

  // Créer l'élément text
  const textSvg = createSVGText(svgNS, textStyles);

  // Mesurer les dimensions initiales
  const tempTextPath = document.createElementNS(svgNS, 'textPath');
  tempTextPath.setAttribute('href', `#${uniqueId}`);
  tempTextPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${uniqueId}`);
  tempTextPath.textContent = textContent;
  textSvg.appendChild(tempTextPath);
  svg.appendChild(textSvg);

  const { pathLength, baseTextWidth } = measureSVGElement(svg, () => {
    return {
      pathLength: path.getTotalLength(),
      baseTextWidth: textSvg.getComputedTextLength(),
    };
  });

  // Calculer le spacing optimal
  const baseLetterSpacing = parseFloat(textStyles.letterSpacing) || 0;
  const spacing = calculateTextSpacing(
    pathLength,
    baseTextWidth,
    textContent,
    gapBetweenRepetitions,
    baseLetterSpacing,
    fontSize
  );

  // Ajuster le letter-spacing
  textSvg.setAttribute('letter-spacing', String(spacing.finalLetterSpacing));
  textSvg.removeChild(tempTextPath);

  // Mesurer la largeur finale d'une répétition avec gap
  const testTextPath = document.createElementNS(svgNS, 'textPath');
  testTextPath.setAttribute('href', `#${uniqueId}`);
  testTextPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${uniqueId}`);
  testTextPath.textContent = textContent + spacing.gapSpace;
  textSvg.appendChild(testTextPath);

  const finalSingleTextWidth = measureSVGElement(svg, () => textSvg.getComputedTextLength());

  // Ajustement fin du letter-spacing
  const targetWidthForOneRepetition = pathLength / spacing.repetitionsPerLoop;
  const widthDifference = targetWidthForOneRepetition - finalSingleTextWidth;
  const fineTuning = widthDifference / (textContent.length + spacing.gapSpace.length);
  const finalLetterSpacing = spacing.finalLetterSpacing + fineTuning;
  textSvg.setAttribute('letter-spacing', String(finalLetterSpacing));

  // Remesurer avec le letter-spacing final
  const finalWidth = measureSVGElement(svg, () => {
    textSvg.setAttribute('letter-spacing', String(finalLetterSpacing));
    return textSvg.getComputedTextLength();
  });

  textSvg.removeChild(testTextPath);

  // Créer le texte final avec toutes les répétitions
  const totalRepetitions = spacing.repetitionsPerLoop * ANIMATION_LOOPS;
  const textPath = document.createElementNS(svgNS, 'textPath');
  textPath.setAttribute('href', `#${uniqueId}`);
  textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${uniqueId}`);
  textPath.textContent = Array(totalRepetitions).fill(textContent).join(spacing.gapSpace);
  textSvg.appendChild(textPath);

  // Finaliser le SVG
  svg.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    overflow: visible;
    z-index: 10;
  `;

  // Configurer le container
  const computedStyle = getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }
  container.style.overflow = 'visible';
  textElement.style.display = 'none';
  container.appendChild(svg);

  // Animation GSAP
  const animationDistance = finalWidth;
  const direction = config.direction === 'clockwise' ? -1 : 1;

  gsap.set(textPath, { attr: { startOffset: 0 } });
  const animation = gsap.to(textPath, {
    attr: { startOffset: animationDistance * direction },
    duration: config.duration,
    ease: 'none',
    repeat: -1,
  });

  return {
    container,
    svg,
    animation,
    destroy: () => {
      try {
        // Arrêter l'animation si elle existe et est active
        if (animation && 'isActive' in animation && animation.isActive()) {
          animation.kill();
        } else if (animation) {
          animation.kill();
        }

        // Supprimer le SVG si il existe
        if (svg && svg.parentNode) {
          svg.remove();
        }

        // Restaurer l'élément texte original si le container existe encore
        if (container && document.contains(container)) {
          if (textElement) {
            textElement.style.display = '';
          }
          container.style.overflow = '';
          container.removeAttribute('data-textpath-initialized');
        }
      } catch {
        // Ignorer les erreurs si les éléments n'existent plus
      }
    },
  };
};

/**
 * Initialise l'animation TextPath sur tous les containers
 */
export const initTextPath = (config: Partial<TextPathConfig> = {}): void => {
  const mergedConfig = { ...defaultConfig, ...config };
  currentConfig = config;
  const containers = document.querySelectorAll<HTMLElement>('[trigger="text-path-container"]');

  if (containers.length === 0) {
    return;
  }

  containers.forEach((container) => {
    const instance = initTextPathOnElement(container, mergedConfig);
    if (instance) {
      instances.push(instance);
    }
  });

  // Ajouter le listener de resize si pas déjà fait
  if (!resizeHandler) {
    resizeHandler = (): void => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        // Vérifier que des containers existent encore dans le DOM avant de refresh
        const containers = document.querySelectorAll<HTMLElement>(
          '[trigger="text-path-container"]'
        );
        if (containers.length > 0 && instances.length > 0) {
          refreshTextPaths(currentConfig);
        } else if (instances.length > 0) {
          // Nettoyer les instances orphelines si les containers n'existent plus
          cleanupOrphanInstances();
        }
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener('resize', resizeHandler);
  }
};

/**
 * Nettoie les instances orphelines (éléments qui n'existent plus dans le DOM)
 */
const cleanupOrphanInstances = (): void => {
  const validInstances: TextPathInstance[] = [];
  instances.forEach((instance) => {
    if (instance.container && document.contains(instance.container)) {
      validInstances.push(instance);
    } else {
      try {
        instance.destroy();
      } catch {
        // Ignorer les erreurs si l'élément n'existe plus
      }
    }
  });
  instances.length = 0;
  instances.push(...validInstances);
};

/**
 * Détruit toutes les instances TextPath
 */
export const destroyAllTextPaths = (): void => {
  instances.forEach((instance) => {
    try {
      instance.destroy();
    } catch {
      // Ignorer les erreurs si l'élément n'existe plus
    }
  });
  instances.length = 0;

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
};

/**
 * Rafraîchit les animations TextPath
 */
export const refreshTextPaths = (config: Partial<TextPathConfig> = {}): void => {
  destroyAllTextPaths();
  initTextPath(config);
};

/**
 * Crée une animation TextPath sur un élément spécifique
 */
export const createTextPathAnimation = (
  container: HTMLElement,
  config: Partial<TextPathConfig> = {}
): TextPathInstance | null => {
  const mergedConfig = { ...defaultConfig, ...config };
  const instance = initTextPathOnElement(container, mergedConfig);

  if (instance) {
    instances.push(instance);
  }

  return instance;
};
