/**
 * Bouton "scroll-to-top". Le trigger vit dans le footer PERSISTANT (hors #swup),
 * donc l'init est appelée à chaque page:view : on flag chaque trigger pour ne
 * pas accumuler de listeners click sur le même bouton à chaque navigation.
 */
export const initScrollTop = (): void => {
  const triggers = document.querySelectorAll<HTMLElement>('[scroll-top]');

  triggers.forEach((trigger) => {
    if (trigger.hasAttribute('data-scroll-top-init')) return;
    trigger.setAttribute('data-scroll-top-init', 'true');

    trigger.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
};
