import gsap from 'gsap';

export const initCmsSummaryFade = (): void => {
  const summaryContent = document.querySelector<HTMLElement>('.cms_main_summary-content');
  if (!summaryContent) return;

  gsap.set(summaryContent, { opacity: 0 });
  gsap.to(summaryContent, { opacity: 1, duration: 0.5, delay: 0.5, ease: 'power2.out' });
};
