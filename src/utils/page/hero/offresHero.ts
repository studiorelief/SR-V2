import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let offresParallaxTrigger: ScrollTrigger | null = null;
let offresParallaxBigTrigger: ScrollTrigger | null = null;

/**
 * Parallax effect on offres page elements
 * Trigger: .section_hero
 * Elements move from y: 0 to y: 2.5rem as user scrolls
 */
export const initOffresParallax = (): void => {
  const parallaxElements = document.querySelectorAll<HTMLElement>('[offres-trigger="parallax"]');
  if (parallaxElements.length === 0) return;

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (!heroSection) return;

  gsap.set(parallaxElements, {
    willChange: 'transform',
    force3D: true,
  });

  const tl = gsap.timeline();

  tl.to(parallaxElements, {
    y: '1rem',
    ease: 'none',
  });

  offresParallaxTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 0.5,
    markers: false,
    animation: tl,
  });
};

export const initOffresParallaxBig = (): void => {
  const parallaxBigElements = document.querySelectorAll<HTMLElement>(
    '[offres-trigger="parallax-big"]'
  );
  if (parallaxBigElements.length === 0) return;

  const heroSection = document.querySelector<HTMLElement>('.section_hero');
  if (!heroSection) return;

  gsap.set(parallaxBigElements, {
    willChange: 'transform',
    force3D: true,
  });

  const tl = gsap.timeline();

  tl.to(parallaxBigElements, {
    y: '3rem',
    ease: 'none',
  });

  offresParallaxBigTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: 0.5,
    markers: false,
    animation: tl,
  });
};

/**
 * Marmotte pop-up animation on offres page.
 *
 * Cycle récursif via onComplete (donc EN DEHORS du gsap.context du namespace —
 * `ctx.revert()` ne le couvre pas). On gate avec un IntersectionObserver pour
 * ne pas tweener en continu quand le hero est hors viewport (gain CPU/idle).
 * destroyOffresMarmotte est appelé via le `setup` du namespace offres pour
 * stopper proprement le cycle au teardown Swup.
 */
let marmotteActive = false;
let marmotteObserver: IntersectionObserver | null = null;
const visibleMarmottes = new Set<HTMLElement>();

const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const runMarmotteCycle = (el: HTMLElement): void => {
  if (!marmotteActive || !visibleMarmottes.has(el)) return;

  const delay = randomBetween(2, 4);
  const visibleDuration = randomBetween(2, 4);
  const xOffsets = ['-2.5rem', '-1.5rem', '0rem'];
  const randomX = xOffsets[Math.floor(Math.random() * xOffsets.length)];

  gsap.set(el, { yPercent: 100, x: randomX });

  gsap.to(el, {
    yPercent: 0,
    duration: 0.4,
    ease: 'power2.out',
    delay,
    onComplete: () => {
      if (!marmotteActive || !visibleMarmottes.has(el)) return;

      gsap.to(el, {
        yPercent: 100,
        duration: 0.2,
        ease: 'power2.in',
        delay: visibleDuration,
        onComplete: () => runMarmotteCycle(el),
      });
    },
  });
};

export const initOffresMarmotte = (): void => {
  const marmotteElements = document.querySelectorAll<HTMLElement>('[offres-trigger="marmotte"]');
  if (marmotteElements.length === 0) return;

  // Cleanup défensif si initOffresMarmotte est rappelé sans destroy préalable.
  if (marmotteObserver) {
    marmotteObserver.disconnect();
    marmotteObserver = null;
  }
  visibleMarmottes.clear();

  marmotteActive = true;

  marmotteObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          if (!visibleMarmottes.has(el)) {
            visibleMarmottes.add(el);
            gsap.set(el, { yPercent: 100 });
            runMarmotteCycle(el);
          }
        } else {
          visibleMarmottes.delete(el);
          gsap.killTweensOf(el);
        }
      });
    },
    { threshold: 0 }
  );

  marmotteElements.forEach((el) => {
    gsap.set(el, { yPercent: 100 });
    marmotteObserver!.observe(el);
  });
};

export const destroyOffresMarmotte = (): void => {
  marmotteActive = false;
  visibleMarmottes.clear();

  if (marmotteObserver) {
    marmotteObserver.disconnect();
    marmotteObserver = null;
  }

  const marmotteElements = document.querySelectorAll<HTMLElement>('[offres-trigger="marmotte"]');
  marmotteElements.forEach((el) => {
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'yPercent,x' });
  });
};

/**
 * Destroy offres parallax ScrollTrigger.
 * Note : avec gsap.context() côté namespace registry, ctx.revert() couvre
 * déjà ces ScrollTriggers. Garde ici pour compatibilité externe / cas
 * d'usage hors namespace.
 */
export const destroyOffresParallax = (): void => {
  if (offresParallaxTrigger) {
    offresParallaxTrigger.kill();
    offresParallaxTrigger = null;
  }

  if (offresParallaxBigTrigger) {
    offresParallaxBigTrigger.kill();
    offresParallaxBigTrigger = null;
  }

  const parallaxElements = document.querySelectorAll<HTMLElement>('[offres-trigger="parallax"]');
  if (parallaxElements.length > 0) {
    gsap.set(parallaxElements, { clearProps: 'willChange' });
  }

  const parallaxBigElements = document.querySelectorAll<HTMLElement>(
    '[offres-trigger="parallax-big"]'
  );
  if (parallaxBigElements.length > 0) {
    gsap.set(parallaxBigElements, { clearProps: 'willChange' });
  }
};
