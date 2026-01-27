import gsap from 'gsap';

/**
 * Configuration de l'animation Glare
 */
interface GlareConfig {
  /** Couleur du glare (format CSS) */
  glareColor?: string;
  /** Opacité du glare (0 à 1) */
  glareOpacity?: number;
  /** Taille du glare en pourcentage */
  glareSize?: number;
  /** Durée de l'animation en secondes */
  duration?: number;
  /** Angle du glare en degrés */
  angle?: number;
  /** Ease GSAP pour l'animation */
  ease?: string;
}

const defaultConfig: Required<GlareConfig> = {
  glareColor: '#ffffff',
  glareOpacity: 0.3,
  glareSize: 300,
  duration: 0.8,
  angle: 135,
  ease: 'power2.inOut',
};

/**
 * Crée l'élément de glare overlay pour un élément
 */
const createGlareOverlay = (element: HTMLElement, config: Required<GlareConfig>): HTMLElement => {
  // Assurer que l'élément parent a position relative
  const computedStyle = getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'hidden';

  // Créer l'overlay de glare
  const glareOverlay = document.createElement('div');
  glareOverlay.className = 'glare-overlay';

  // Convertir la couleur hex en rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const glareRgba = hexToRgba(config.glareColor, config.glareOpacity);

  // Styles du glare
  Object.assign(glareOverlay.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    overflow: 'hidden',
    borderRadius: 'inherit',
    zIndex: '10',
  });

  // Créer le gradient de glare
  const glareGradient = document.createElement('div');
  glareGradient.className = 'glare-gradient';

  Object.assign(glareGradient.style, {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `linear-gradient(
      ${config.angle}deg,
      transparent 0%,
      ${glareRgba} 50%,
      transparent 100%
    )`,
    top: '0',
    left: '0',
    pointerEvents: 'none',
  });

  // Position initiale via GSAP (évite conflit CSS/GSAP)
  gsap.set(glareGradient, { x: '-100%' });

  glareOverlay.appendChild(glareGradient);
  element.appendChild(glareOverlay);

  return glareGradient;
};

/**
 * Anime le glare sur un élément
 */
const animateGlare = (
  glareGradient: HTMLElement,
  config: Required<GlareConfig>
): gsap.core.Tween => {
  return gsap.fromTo(
    glareGradient,
    {
      x: '-100%',
    },
    {
      x: '100%',
      duration: config.duration,
      ease: config.ease,
    }
  );
};

/**
 * Nettoie l'overlay de glare après l'animation
 */
const cleanupGlare = (element: HTMLElement): void => {
  const overlay = element.querySelector('.glare-overlay');
  if (overlay) {
    overlay.remove();
  }
};

/**
 * Déclenche l'animation de glare sur un élément spécifique
 * @param element - L'élément sur lequel appliquer le glare
 * @param config - Configuration optionnelle du glare
 * @returns La tween GSAP de l'animation
 */
export const triggerGlare = (
  element: HTMLElement,
  config: Partial<GlareConfig> = {}
): gsap.core.Tween => {
  const mergedConfig = { ...defaultConfig, ...config };

  // Nettoyer un éventuel glare précédent
  cleanupGlare(element);

  // Créer et animer le glare
  const glareGradient = createGlareOverlay(element, mergedConfig);
  const tween = animateGlare(glareGradient, mergedConfig);

  // Nettoyer après l'animation
  tween.eventCallback('onComplete', () => {
    cleanupGlare(element);
  });

  return tween;
};

/**
 * Setup et animation du glare sur les éléments hero-tag
 * S'intègre avec la timeline parent (comme les autres animations hero)
 * @param parentTl - Timeline parent à laquelle ajouter les animations
 * @param startPosition - Position de départ dans la timeline parent
 * @param config - Configuration optionnelle du glare
 */
export const setupAndAnimateGlareHero = (
  parentTl: gsap.core.Timeline,
  startPosition: string | number = 0,
  config: Partial<GlareConfig> = {}
): void => {
  const elements = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-tag"]');

  if (elements.length === 0) return;

  const mergedConfig = { ...defaultConfig, ...config };

  elements.forEach((element) => {
    // Nettoyer un éventuel glare précédent
    cleanupGlare(element);

    // Créer l'overlay de glare
    const glareGradient = createGlareOverlay(element, mergedConfig);

    // Ajouter l'animation à la timeline parent
    // DEBUG: Ne pas nettoyer pour voir si l'overlay existe
    parentTl.fromTo(
      glareGradient,
      {
        x: '-100%',
      },
      {
        x: '100%', // Arrêter au milieu pour voir l'effet
        duration: mergedConfig.duration,
        ease: mergedConfig.ease,
        // onComplete désactivé pour debug
      },
      startPosition
    );
  });
};

/**
 * Fonction d'initialisation standalone (sans timeline parent)
 * Déclenche le glare sur tous les éléments [transition-trigger="hero-tag"]
 * @param config - Configuration optionnelle du glare
 */
export const initGlareHero = (config: Partial<GlareConfig> = {}): void => {
  const elements = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-tag"]');

  if (elements.length === 0) return;

  elements.forEach((element) => {
    triggerGlare(element, config);
  });
};
