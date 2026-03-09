import gsap from 'gsap';

let observer: MutationObserver | null = null;
let triggered = false;

function onFormSuccess(): void {
  if (triggered) return;
  triggered = true;

  const main = document.querySelector<HTMLElement>('[contact-form="main"]');
  const success = document.querySelector<HTMLElement>('[contact-form="success"]');
  const oies = document.querySelector<HTMLElement>('[contact-form="oies"]');

  if (main) {
    gsap.to(main, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        main.style.display = 'none';
      },
    });
  }

  if (success) {
    success.style.display = 'flex';
    gsap.fromTo(
      success,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 1, ease: 'power2.out' }
    );
  }

  if (oies) {
    gsap.fromTo(
      oies,
      { opacity: 1, xPercent: -10, yPercent: 10 },
      { opacity: 1, xPercent: 0, yPercent: 0, duration: 3, delay: 1.1, ease: 'power2.out' }
    );
  }
}

export function initContactSuccess(): void {
  triggered = false;

  const formBlock = document.querySelector<HTMLElement>('.w-form');
  if (!formBlock) return;

  observer = new MutationObserver(() => {
    const formDone = formBlock.querySelector<HTMLElement>('.w-form-done');
    if (formDone && formDone.style.display === 'block') {
      formDone.style.display = 'none';
      onFormSuccess();
    }
  });

  observer.observe(formBlock, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: true,
  });
}

export function destroyContactSuccess(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  triggered = false;
}
