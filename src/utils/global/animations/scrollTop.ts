export const initScrollTop = (): void => {
  const triggers = document.querySelectorAll<HTMLElement>('[trigger="scroll_top"]');

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
};
