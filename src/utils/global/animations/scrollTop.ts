export const initScrollTop = (): void => {
  const triggers = document.querySelectorAll<HTMLElement>('[scroll-top]');

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
};
