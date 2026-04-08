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

/*
 *==========================================
 * RESSOURCES BLOG
 * ↳ Eagle, cloud & lunettes hover animation
 *==========================================
 */

let blogInstance: {
  container: HTMLElement;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  timeline: gsap.core.Timeline | null;
} | null = null;

/**
 * Initialise l'animation hover pour #ressources-blog
 */
export const initRessourcesBlog = (): void => {
  destroyRessourcesBlog();

  const container = document.querySelector<HTMLElement>('#ressources-blog');
  if (!container) return;

  const eagle = container.querySelector<HTMLElement>('.is-eagle');
  const cloud = container.querySelector<HTMLElement>('.is-cloud');
  const lunettes = container.querySelector<HTMLElement>('.is-glass');

  if (!eagle && !cloud && !lunettes) return;

  // État initial
  if (lunettes) gsap.set(lunettes, { yPercent: 100, opacity: 0 });

  let tl: gsap.core.Timeline | null = null;

  const handleMouseEnter = (): void => {
    if (tl) tl.kill();

    tl = gsap.timeline();

    // Lunettes d'abord
    if (lunettes) {
      tl.to(lunettes, { opacity: 1, yPercent: 0, duration: 0.4, ease: 'power2.out' });
    }

    // Eagle & cloud à 50% de l'animation lunettes (0.2s)
    if (eagle) {
      tl.to(eagle, { scale: 1.75, x: 16 * 2, y: 16, duration: 0.5, ease: 'power2.out' }, 0.15);
    }

    if (cloud) {
      tl.to(cloud, { scale: 1.5, yPercent: 25, duration: 0.5, ease: 'power2.out' }, 0.15);
    }
  };

  const handleMouseLeave = (): void => {
    if (tl) tl.kill();

    tl = gsap.timeline();

    // Tout en même temps
    if (lunettes) {
      tl.to(lunettes, { opacity: 0, yPercent: 100, duration: 0.3, ease: 'power2.in' }, 0);
    }

    if (eagle) {
      tl.to(eagle, { scale: 1, x: 0, y: 0, duration: 0.3, ease: 'power2.in' }, 0);
    }

    if (cloud) {
      tl.to(cloud, { scale: 1, yPercent: 0, duration: 0.3, ease: 'power2.in' }, 0);
    }
  };

  container.addEventListener('mouseenter', handleMouseEnter);
  container.addEventListener('mouseleave', handleMouseLeave);

  blogInstance = {
    container,
    handleMouseEnter,
    handleMouseLeave,
    timeline: tl,
  };
};

/**
 * Détruit l'animation ressources blog
 */
export const destroyRessourcesBlog = (): void => {
  if (!blogInstance) return;

  const { container, handleMouseEnter, handleMouseLeave, timeline } = blogInstance;

  if (timeline) timeline.kill();

  container.removeEventListener('mouseenter', handleMouseEnter);
  container.removeEventListener('mouseleave', handleMouseLeave);

  const eagle = container.querySelector<HTMLElement>('.is-eagle');
  const cloud = container.querySelector<HTMLElement>('.is-cloud');
  const lunettes = container.querySelector<HTMLElement>('.is-glass');

  const els = [eagle, cloud, lunettes].filter(Boolean) as HTMLElement[];
  gsap.killTweensOf(els);
  els.forEach((el) => gsap.set(el, { clearProps: 'all' }));

  blogInstance = null;
};

/*
 *==========================================
 * RESSOURCES STACK
 * ↳ Corde hover animation
 *==========================================
 */

let stackInstance: {
  container: HTMLElement;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  timeline: gsap.core.Timeline | null;
} | null = null;

/**
 * Initialise l'animation hover pour #ressources-stack
 */
export const initRessourcesStack = (): void => {
  destroyRessourcesStack();

  const container = document.querySelector<HTMLElement>('#ressources-stack');
  if (!container) return;

  const corde = container.querySelector<HTMLElement>('.is-corde');
  if (!corde) return;

  // État initial — clipPath masque par le haut, transformOrigin en haut
  gsap.set(corde, { clipPath: 'inset(0 0 100% 0)', opacity: 1 });

  let tl: gsap.core.Timeline | null = null;
  let swingTween: gsap.core.Tween | null = null;

  const handleMouseEnter = (): void => {
    if (tl) tl.kill();
    if (swingTween) swingTween.kill();

    tl = gsap.timeline();

    // Déroulement + balancement pendant l'animation
    tl.to(corde, { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 0.5, ease: 'power2.out' });
    tl.to(corde, { x: -2, duration: 0.15, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0);
  };

  const handleMouseLeave = (): void => {
    if (tl) tl.kill();
    if (swingTween) {
      swingTween.kill();
      swingTween = null;
    }

    tl = gsap.timeline();
    tl.to(corde, {
      clipPath: 'inset(0 0 100% 0)',
      opacity: 1,
      x: 0,
      duration: 0.4,
      ease: 'power2.in',
    });
  };

  container.addEventListener('mouseenter', handleMouseEnter);
  container.addEventListener('mouseleave', handleMouseLeave);

  stackInstance = {
    container,
    handleMouseEnter,
    handleMouseLeave,
    timeline: tl,
  };
};

/**
 * Détruit l'animation ressources stack
 */
export const destroyRessourcesStack = (): void => {
  if (!stackInstance) return;

  const { container, handleMouseEnter, handleMouseLeave, timeline } = stackInstance;

  if (timeline) timeline.kill();

  container.removeEventListener('mouseenter', handleMouseEnter);
  container.removeEventListener('mouseleave', handleMouseLeave);

  const corde = container.querySelector<HTMLElement>('.is-corde');
  if (corde) {
    gsap.killTweensOf(corde);
    gsap.set(corde, { clearProps: 'all' });
  }

  stackInstance = null;
};
