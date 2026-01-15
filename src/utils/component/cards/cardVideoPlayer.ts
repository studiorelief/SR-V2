/**
 *==========================================
 * CARD VIDEO PLAYER
 * ↳ Contrôle des vidéos au hover
 *==========================================
 */

interface VideoPlayerInstance {
  element: HTMLElement;
  video: HTMLVideoElement;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

// Stockage des instances pour pouvoir les détruire si nécessaire
const videoPlayerInstances: VideoPlayerInstance[] = [];

/**
 * Initialise le contrôle vidéo au hover pour un élément
 * @param element - L'élément avec l'ID `animation-video`
 */
const initVideoPlayer = (element: HTMLElement): void => {
  // Chercher l'élément video dans l'élément parent
  const video = element.querySelector<HTMLVideoElement>('video');

  if (!video) {
    return;
  }

  // Handlers pour les événements hover
  const handleMouseEnter = (): void => {
    video.play().catch(() => {
      // Erreur silencieuse si la vidéo ne peut pas être lue
    });
  };

  const handleMouseLeave = (): void => {
    video.pause();
  };

  // Créer l'instance
  const instance: VideoPlayerInstance = {
    element,
    video,
    handleMouseEnter,
    handleMouseLeave,
  };

  // Ajouter les event listeners
  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Stocker l'instance
  videoPlayerInstances.push(instance);
};

/**
 * Initialise le contrôle vidéo au hover pour tous les éléments avec `#animation-video`
 */
export const initCardVideoPlayer = (): void => {
  // Trouver tous les éléments avec l'ID `animation-video`
  const elements = document.querySelectorAll<HTMLElement>('#animation-video');

  if (elements.length === 0) {
    return;
  }

  // Initialiser chaque élément
  elements.forEach((element) => {
    initVideoPlayer(element);
  });
};

/**
 * Détruit toutes les instances et nettoie les event listeners
 * Utile pour le cleanup lors d'un changement de page avec Barba.js
 */
export const destroyCardVideoPlayer = (): void => {
  videoPlayerInstances.forEach((instance) => {
    instance.element.removeEventListener('mouseenter', instance.handleMouseEnter);
    instance.element.removeEventListener('mouseleave', instance.handleMouseLeave);
    instance.video.pause();
  });

  videoPlayerInstances.length = 0;
};
