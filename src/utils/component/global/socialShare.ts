import gsap from 'gsap';

export function initSocialShare(): void {
  const linkButtons = document.querySelectorAll('[social-share-trigger="link"]');

  linkButtons.forEach((button) => {
    const copyText = button.querySelector('[social-share-trigger="copy-text"]') as HTMLElement;

    if (!copyText) return;

    // Set initial state
    gsap.set(copyText, {
      opacity: 0,
      yPercent: 200,
    });

    button.addEventListener('click', () => {
      // Copy current URL to clipboard
      navigator.clipboard.writeText(window.location.href);

      // Animate in
      gsap.to(copyText, {
        opacity: 1,
        yPercent: 150,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Reverse after 1.5s
      gsap.to(copyText, {
        opacity: 0,
        yPercent: 200,
        duration: 0.3,
        ease: 'power2.in',
        delay: 1.5,
      });
    });
  });
}
