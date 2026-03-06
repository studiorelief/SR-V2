import gsap from 'gsap';

let cachedCode: string | null = null;
let cleanupFn: (() => void) | null = null;

const MULTI_STEP_SRC = 'https://cdn.jsdelivr.net/gh/videsigns/webflow-tools@latest/multi-step.js';

function animateStep(step: HTMLElement): void {
  gsap.fromTo(
    step,
    { xPercent: -50, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 1, ease: 'power2.out' }
  );
}

function bindStepAnimations(): void {
  const nextBtn = document.querySelectorAll<HTMLElement>('[data-form="next-btn"]');
  const backBtn = document.querySelectorAll<HTMLElement>('[data-form="back-btn"]');
  const progressIndicators = document.querySelectorAll<HTMLElement>(
    '[data-form="custom-progress-indicator"]'
  );

  const handleNav = () => {
    requestAnimationFrame(() => {
      const visibleStep = document.querySelector<HTMLElement>(
        '[data-form="step"]:not([style*="display: none"])'
      );
      if (!visibleStep) return;

      const targets = visibleStep.querySelectorAll<HTMLElement>('[step-form]');
      targets.forEach((el) => animateStep(el));
    });
  };

  nextBtn.forEach((btn) => btn.addEventListener('click', handleNav));
  backBtn.forEach((btn) => btn.addEventListener('click', handleNav));
  progressIndicators.forEach((btn) => btn.addEventListener('click', handleNav));

  cleanupFn = () => {
    nextBtn.forEach((btn) => btn.removeEventListener('click', handleNav));
    backBtn.forEach((btn) => btn.removeEventListener('click', handleNav));
    progressIndicators.forEach((btn) => btn.removeEventListener('click', handleNav));
  };
}

export async function initContactMultiStep(): Promise<void> {
  if (!cachedCode) {
    const response = await fetch(MULTI_STEP_SRC);
    cachedCode = await response.text();
  }

  // new Function() crée un scope frais à chaque exécution,
  // ce qui force le script à se ré-initialiser même après une navigation Swup
  new Function(cachedCode)();

  bindStepAnimations();
}

export function destroyContactMultiStep(): void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
}
