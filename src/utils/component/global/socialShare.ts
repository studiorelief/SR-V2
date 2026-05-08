import gsap from 'gsap';

/**
 * Social share "copy link" button. Animates a confirmation label on click.
 * Paired with destroySocialShare in content:replace.
 */

type Cleanup = () => void;
const cleanups = new Set<Cleanup>();
const animatedTargets = new Set<HTMLElement>();

export function initSocialShare(): void {
  const linkButtons = document.querySelectorAll<HTMLElement>('[social-share-trigger="link"]');

  linkButtons.forEach((button) => {
    const copyText = button.querySelector<HTMLElement>('[social-share-trigger="copy-text"]');
    if (!copyText) return;

    gsap.set(copyText, { opacity: 0, yPercent: 200 });
    animatedTargets.add(copyText);

    const onClick = (): void => {
      navigator.clipboard.writeText(window.location.href);

      gsap.to(copyText, {
        opacity: 1,
        yPercent: 150,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(copyText, {
        opacity: 0,
        yPercent: 200,
        duration: 0.3,
        ease: 'power2.in',
        delay: 1.5,
      });
    };

    button.addEventListener('click', onClick);
    cleanups.add(() => button.removeEventListener('click', onClick));
  });
}

export function destroySocialShare(): void {
  cleanups.forEach((fn) => fn());
  cleanups.clear();
  animatedTargets.forEach((el) => gsap.killTweensOf(el));
  animatedTargets.clear();
}
