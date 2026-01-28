/**
 *==========================================
 * CARD HOVER ICON
 * ↳ Custom cursor au hover des cards
 *==========================================
 */

import gsap from 'gsap';

import { EASINGS } from '$utils/global/easings/easings';

interface CardHoverIconInstance {
  card: HTMLElement;
  icon: HTMLElement;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseMove: (e: MouseEvent) => void;
}

const cardHoverIconInstances: CardHoverIconInstance[] = [];

/**
 * Initialise le custom cursor pour une card
 */
const initCardHover = (card: HTMLElement): void => {
  const icon = card.querySelector<HTMLElement>('[cms-card-trigger="icon-hover"]');

  if (!icon) {
    return;
  }

  // État initial: caché et positionné en fixed pour suivre le cursor
  gsap.set(icon, {
    display: 'none',
    scale: 0,
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 9999,
    xPercent: -50,
    yPercent: -50,
  });

  const handleMouseMove = (e: MouseEvent): void => {
    gsap.to(icon, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.15,
      ease: 'power2.out',
    });
  };

  const handleMouseEnter = (e: MouseEvent): void => {
    // Position initiale au curseur
    gsap.set(icon, {
      x: e.clientX,
      y: e.clientY,
    });

    // Cacher le curseur par défaut (card + tous les enfants)
    card.style.cursor = 'none';
    card.querySelectorAll<HTMLElement>('a, button, [role="button"]').forEach((el) => {
      el.style.cursor = 'none';
    });

    gsap.to(icon, {
      display: 'flex',
      scale: 1,
      duration: 0.4,
      ease: EASINGS.backOut,
    });

    card.addEventListener('mousemove', handleMouseMove);
  };

  const handleMouseLeave = (): void => {
    card.removeEventListener('mousemove', handleMouseMove);

    // Restaurer le curseur par défaut (card + tous les enfants)
    card.style.cursor = '';
    card.querySelectorAll<HTMLElement>('a, button, [role="button"]').forEach((el) => {
      el.style.cursor = '';
    });

    gsap.to(icon, {
      scale: 0,
      duration: 0.3,
      ease: EASINGS.power2Out,
      onComplete: () => {
        gsap.set(icon, { display: 'none' });
      },
    });
  };

  const instance: CardHoverIconInstance = {
    card,
    icon,
    handleMouseEnter: handleMouseEnter as () => void,
    handleMouseLeave,
    handleMouseMove,
  };

  card.addEventListener('mouseenter', handleMouseEnter as EventListener);
  card.addEventListener('mouseleave', handleMouseLeave);

  cardHoverIconInstances.push(instance);
};

/**
 * Initialise le custom cursor pour les cards portfolio
 */
export const initCardHoverIcon = (): void => {
  const cards = document.querySelectorAll<HTMLElement>('.cms_cards[card-type="portfolio"]');

  if (cards.length === 0) {
    return;
  }

  cards.forEach((card) => {
    initCardHover(card);
  });
};

/**
 * Détruit toutes les instances et nettoie les event listeners
 */
export const destroyCardHoverIcon = (): void => {
  cardHoverIconInstances.forEach((instance) => {
    instance.card.removeEventListener('mouseenter', instance.handleMouseEnter as EventListener);
    instance.card.removeEventListener('mouseleave', instance.handleMouseLeave);
    instance.card.removeEventListener('mousemove', instance.handleMouseMove);
    gsap.killTweensOf(instance.icon);
  });

  cardHoverIconInstances.length = 0;
};
