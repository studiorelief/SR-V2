let isInitialized = false;
let updateHandler: (() => void) | null = null;

/**
 * Scrollbar Progress
 * La largeur d'un élément passe de 0% (en haut de page) à 100% (en bas de page)
 *
 * HTML attendu :
 *   <div class="scrollbar_progress"></div>
 */
export const initScrollbar = (): void => {
  if (isInitialized) {
    // Forcer une mise à jour immédiate si déjà initialisé
    if (updateHandler) updateHandler();
    return;
  }

  const bar = document.querySelector<HTMLElement>('.scrollbar_fill');
  if (!bar) return;

  updateHandler = () => {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;

    if (scrollHeight <= 0) {
      bar.style.width = '0%';
      return;
    }

    const progress = (scrollTop / scrollHeight) * 100;
    bar.style.width = `${progress}%`;
  };

  // Mise à jour initiale
  updateHandler();

  window.addEventListener('scroll', updateHandler, { passive: true });
  window.addEventListener('resize', updateHandler);

  isInitialized = true;
};
