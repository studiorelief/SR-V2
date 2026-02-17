/*
 *============================================================================
 * COMPONENT : SECTION / AUTHORS
 *============================================================================
 */

import 'swiper/css/bundle';

import gsap from 'gsap';
import Swiper from 'swiper/bundle';

/*
 * Clothesline curve — maps Swiper slide.progress to visual properties.
 * p = progress (-2 prev … 0 active … +2 next), mt = translateY (rem),
 * o = opacity, r = rotate (deg). Values are interpolated continuously.
 */
const CURVE = [
  { p: -3, mt: -8.35, o: 0, r: -15 },
  { p: -2, mt: -3.65, o: 1, r: -9 },
  { p: -1, mt: -1.1, o: 1, r: -3 },
  { p: 0, mt: -0.2, o: 1, r: 2 },
  { p: 1, mt: -1.0, o: 0, r: 3 },
  { p: 2, mt: -3.65, o: 0, r: 9 },
  { p: 3, mt: -8.5, o: 0, r: 15 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolate(progress: number) {
  if (progress <= CURVE[0].p) return CURVE[0];
  if (progress >= CURVE[CURVE.length - 1].p) return CURVE[CURVE.length - 1];

  for (let i = 0; i < CURVE.length - 1; i++) {
    const a = CURVE[i];
    const b = CURVE[i + 1];
    if (progress >= a.p && progress <= b.p) {
      const t = (progress - a.p) / (b.p - a.p);
      return {
        mt: lerp(a.mt, b.mt, t),
        o: lerp(a.o, b.o, t),
        r: lerp(a.r, b.r, t),
      };
    }
  }

  return CURVE[CURVE.length - 1];
}

/**
 * Apply clothesline curve + flip angle to every slide's inner element.
 */
function updateSlides(swiper: Swiper) {
  swiper.slides.forEach((slide) => {
    const { progress } = slide as HTMLElement & { progress: number };
    if (progress === undefined) return;

    const v = interpolate(progress);
    const inner = slide.firstElementChild as HTMLElement | null;
    if (!inner) return;

    const flipY = parseFloat(inner.dataset.flipAngle || '0');
    inner.style.opacity = `${v.o}`;
    inner.style.transform = `perspective(800px) translateY(${v.mt}rem) rotate(${v.r}deg) rotateY(${flipY}deg)`;
  });
}

/**
 * Clone slides for manual loop & set up flip interactions.
 */
export function initAuthorsSlider() {
  const swipers = document.querySelectorAll('.swiper.is-authors');
  if (swipers.length === 0) return;

  swipers.forEach((swiperEl) => {
    const wrapper = swiperEl.querySelector('.swiper-wrapper');
    const originalCount = wrapper ? wrapper.children.length : 0;

    // Clone 2× for seamless manual loop (A B C → A B C | A B C | A B C)
    if (wrapper) {
      const originals = Array.from(wrapper.children);
      for (let copy = 0; copy < 2; copy++) {
        originals.forEach((s) => wrapper.appendChild(s.cloneNode(true)));
      }
    }

    const component = swiperEl.closest('.authors_component');
    const prevBtn = component?.querySelector<HTMLElement>('[author-slider="left"]') || null;
    const nextBtn = component?.querySelector<HTMLElement>('[author-slider="right"]') || null;

    const swiper = new Swiper(swiperEl as HTMLElement, {
      direction: 'horizontal',
      initialSlide: originalCount,
      slidesPerView: 'auto',
      spaceBetween: 2 * 16,
      speed: 500,
      grabCursor: true,
      allowTouchMove: true,
      keyboard: true,
      watchSlidesProgress: true,
      mousewheel: {
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
        eventsTarget: 'container',
      },
      navigation: { prevEl: nextBtn, nextEl: prevBtn },
      touchEventsTarget: 'wrapper',
    });

    /* ── Manual loop ── */
    swiper.on('slideChangeTransitionEnd', () => {
      const { activeIndex } = swiper;
      const total = swiper.slides.length;
      if (activeIndex < originalCount) {
        swiper.slideTo(activeIndex + originalCount, 0);
      } else if (activeIndex >= total - originalCount) {
        swiper.slideTo(activeIndex - originalCount, 0);
      }
    });

    /* ── Progress-driven positioning ── */
    swiper.on('setTranslate', () => updateSlides(swiper));
    swiper.on('resize', () => updateSlides(swiper));

    swiper.on('setTransition', (_s, duration) => {
      swiper.slides.forEach((slide) => {
        const inner = slide.firstElementChild as HTMLElement | null;
        if (!inner) return;
        const ms = `${duration}ms`;
        inner.style.transition = duration ? `opacity ${ms} ease-out, transform ${ms} ease-out` : '';
      });
    });

    requestAnimationFrame(() => updateSlides(swiper));

    /* ── Lueurs hover animation ── */
    swiperEl.querySelectorAll<HTMLElement>('[author-slider="card"]').forEach((card) => {
      const allLueurs = card.querySelectorAll<HTMLElement>('[author-slider="lueurs"]');
      if (allLueurs.length === 0) return;

      card.addEventListener('mouseenter', () => {
        gsap.to(allLueurs, {
          x: '1rem',
          y: '1rem',
          scale: 1.05,
          opacity: 0.75,
          duration: 0.4,
          ease: 'power2.out',
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(allLueurs, {
          x: '0rem',
          y: '0rem',
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        });
      });
    });

    /* ── Card flip (GSAP) — synced across clones ── */
    type SlideRefs = { inner: HTMLElement; front: HTMLElement; back: HTMLElement };
    const cloneGroups = new Map<number, SlideRefs[]>();

    // Group all slides (originals + clones) by their original index
    Array.from(swiper.slides).forEach((slide, i) => {
      const inner = slide.firstElementChild as HTMLElement | null;
      if (!inner) return;
      const front = inner.querySelector<HTMLElement>('[author-slider="front"]');
      const back = inner.querySelector<HTMLElement>('[author-slider="back"]');
      if (!front || !back) return;

      inner.style.transformStyle = 'preserve-3d';
      gsap.set(back, { rotateY: 180, opacity: 0, pointerEvents: 'none' });

      const groupIdx = i % originalCount;
      if (!cloneGroups.has(groupIdx)) cloneGroups.set(groupIdx, []);
      cloneGroups.get(groupIdx)!.push({ inner, front, back });
    });

    // Shared flip state per original card
    cloneGroups.forEach((group) => {
      let flipped = false;
      const tw = { angle: 0 };

      // Apply current flip state to all clones in the group
      const syncClones = (angle: number) => {
        const past90 = angle > 90;
        group.forEach(({ inner, front, back }) => {
          inner.dataset.flipAngle = `${angle}`;
          gsap.set(front, { opacity: past90 ? 0 : 1 });
          gsap.set(back, { opacity: past90 ? 1 : 0 });
        });
        updateSlides(swiper);
      };

      const setPointerEvents = () => {
        group.forEach(({ front, back }) => {
          front.style.pointerEvents = flipped ? 'none' : 'auto';
          back.style.pointerEvents = flipped ? 'auto' : 'none';
        });
      };

      // Bind CTAs on every clone in the group
      group.forEach(({ inner }) => {
        const slide = inner.parentElement;
        if (!slide) return;
        slide.querySelectorAll<HTMLElement>('[author-slider="flip-cta"]').forEach((cta) => {
          cta.addEventListener('click', () => {
            flipped = !flipped;
            gsap.to(tw, {
              angle: flipped ? 180 : 0,
              duration: 0.6,
              ease: 'power2.inOut',
              onUpdate: () => syncClones(tw.angle),
              onComplete: setPointerEvents,
            });
          });
        });
      });
    });
  });
}
