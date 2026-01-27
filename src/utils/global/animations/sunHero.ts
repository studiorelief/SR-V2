import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animation parallax globale du soleil hero
 * Fonctionne sur toutes les pages ayant un élément [transition-trigger="hero-sun"]
 * Le soleil monte vers le haut au scroll de la page
 */
export const initSunHeroParallax = (): void => {
  const suns = document.querySelectorAll<HTMLElement>('[transition-trigger="hero-sun"]');

  if (suns.length === 0) return;

  suns.forEach((sun) => {
    // Trouve la section parent (hero-section ou la section parente la plus proche)
    const section =
      sun.closest('[transition-trigger="hero-section"]') ||
      sun.closest('section') ||
      sun.parentElement;

    if (!section) return;

    // Kill l'ancien ScrollTrigger s'il existe pour cet élément
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.id === `hero-sun-parallax-${sun.id || suns.length}` && st.trigger === section) {
        st.kill();
      }
    });

    // Reset la position du sun pour éviter les glitches au refresh
    gsap.set(sun, { y: 0, force3D: true, willChange: 'transform' });

    // Animation parallax - le soleil monte au scroll
    gsap.to(sun, {
      y: '-5rem',
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        id: `hero-sun-parallax-${sun.id || Array.from(suns).indexOf(sun)}`,
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        markers: false,
      },
    });

    // Force un refresh immédiat pour synchroniser avec la position de scroll actuelle
    // Cela évite le glitch quand on refresh au milieu de la page
    // On utilise un double requestAnimationFrame pour s'assurer que le DOM et le ScrollTrigger sont prêts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const st = ScrollTrigger.getById(
          `hero-sun-parallax-${sun.id || Array.from(suns).indexOf(sun)}`
        );
        if (st) {
          st.refresh();
        }
      });
    });
  });
};

/**
 * Nettoie tous les ScrollTriggers liés aux soleils hero
 */
export const killSunHeroParallax = (): void => {
  ScrollTrigger.getAll().forEach((st) => {
    if (typeof st.vars.id === 'string' && st.vars.id.startsWith('hero-sun-parallax')) {
      st.kill();
    }
  });
};
