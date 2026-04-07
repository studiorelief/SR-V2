import gsap from 'gsap';

/*
 *==========================================
 * RESSOURCES LABS
 * ↳ Lamp hover animation + mouse tracking
 *==========================================
 */

let labsInstance: {
  container: HTMLElement;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseMove: (e: MouseEvent) => void;
  timeline: gsap.core.Timeline | null;
} | null = null;

/**
 * Initialise l'animation hover pour #ressources-labs
 */
export const initRessourcesLabs = (): void => {
  // Cleanup si déjà initialisé
  destroyRessourcesLabs();

  const container = document.querySelector<HTMLElement>('#ressources-labs');
  if (!container) return;

  const lamps = container.querySelectorAll<HTMLElement>('.is-lamp');
  const lampAlones = container.querySelectorAll<HTMLElement>('.is-lamp-alone');
  const lampLueurs = container.querySelectorAll<HTMLElement>('.is-lamp-lueur');

  if (lamps.length === 0 && lampAlones.length === 0) return;

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const offset = 1.5 * rootFontSize; // 1.5rem en pixels

  // État initial
  gsap.set(lamps, { opacity: 0 });
  gsap.set(lampAlones, { filter: 'grayscale(1)', y: offset, x: offset });
  gsap.set(lampLueurs, { opacity: 0 });

  let tl: gsap.core.Timeline | null = null;
  let isHovered = false;

  const handleMouseEnter = (): void => {
    isHovered = true;

    // Kill previous timeline if reversing
    if (tl) {
      tl.kill();
    }

    tl = gsap.timeline();

    // .is-lamp opacity 0 → 1
    tl.to(lamps, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    });

    // .is-lamp-alone : grayscale → color + position reset
    tl.to(
      lampAlones,
      {
        filter: 'grayscale(0)',
        y: 0,
        x: 0,
        duration: 0.5,
        ease: 'power2.out',
      },
      '<'
    );

    // .is-lamp-lueur apparaît 0.2s avant la fin de lamp-alone
    tl.to(
      lampLueurs,
      {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      },
      '-=0.25'
    );
  };

  const handleMouseLeave = (): void => {
    isHovered = false;

    if (tl) {
      tl.kill();
    }

    tl = gsap.timeline();

    tl.to(lampLueurs, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
    });

    tl.to(
      lamps,
      {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      },
      '<0.1'
    );

    tl.to(
      lampAlones,
      {
        filter: 'grayscale(1)',
        y: -offset,
        x: offset,
        duration: 0.4,
        ease: 'power2.in',
      },
      '<'
    );
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isHovered) return;

    const rect = container.getBoundingClientRect();
    // Normaliser la position de la souris entre -1 et 1
    const ratioX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ratioY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    const xScope = -0.5 * rootFontSize; // 0.5rem
    // Mapper X sur 0rem → -1rem, Y sur -1.5rem → 1.5rem
    const clampedX = Math.max(0, ratioX); // 0 → 1 uniquement
    gsap.to(lamps, {
      x: -clampedX * xScope,
      y: -ratioY * offset,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  container.addEventListener('mouseenter', handleMouseEnter);
  container.addEventListener('mouseleave', handleMouseLeave);
  container.addEventListener('mousemove', handleMouseMove);

  labsInstance = {
    container,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    timeline: tl,
  };
};

/**
 * Détruit l'animation ressources labs
 */
export const destroyRessourcesLabs = (): void => {
  if (!labsInstance) return;

  const { container, handleMouseEnter, handleMouseLeave, handleMouseMove, timeline } = labsInstance;

  if (timeline) timeline.kill();

  container.removeEventListener('mouseenter', handleMouseEnter);
  container.removeEventListener('mouseleave', handleMouseLeave);
  container.removeEventListener('mousemove', handleMouseMove);

  // Reset des styles
  const lamps = container.querySelectorAll<HTMLElement>('.is-lamp');
  const lampAlones = container.querySelectorAll<HTMLElement>('.is-lamp-alone');
  const lampLueurs = container.querySelectorAll<HTMLElement>('.is-lamp-lueur');

  gsap.killTweensOf([...lamps, ...lampAlones, ...lampLueurs]);
  gsap.set(lamps, { clearProps: 'all' });
  gsap.set(lampAlones, { clearProps: 'all' });
  gsap.set(lampLueurs, { clearProps: 'all' });

  labsInstance = null;
};
