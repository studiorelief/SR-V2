/*
 *============================================================================
 * COMPONENT : SLIDER / CAL — ROLODEX (GSAP only)
 *============================================================================
 *
 * Vertical rolodex: cards stack on top of each other; behind-cards peek
 * their coloured tabs above. "Next" flips the front card downward (rotateX
 * around bottom edge). "Prev" un-flips a card back into view.
 *
 * HTML contract (Webflow attributes):
 *   [cal-slider="card"]  — .contact-team_cards  (card root)
 *   [cal-slider="tab"]   — .contact-team_cards-top (clickable tab)
 *   [cal-slider="prev"]  — prev navigation button
 *   [cal-slider="next"]  — next navigation button
 */

import gsap from 'gsap';

/* ── Tuning ── */
const TAB_OFFSET = 1.5; // rem – vertical peek per stacked level
const MAX_BEHIND = 2; // max visible cards behind active
const PERSPECTIVE = 1200; // px – 3D depth
const DURATION = 0.9; // s – flip / shift duration
const SWIPE_THRESHOLD = 50; // px – minimum vertical drag to trigger

/* ── Helpers ── */

/** Circular distance from `active` (0 = front, 1 = first behind …) */
function relPos(index: number, active: number, total: number): number {
  return (((index - active) % total) + total) % total;
}

/** GSAP visual props for a card at a given stack depth (no zIndex — that goes on slides). */
function cardProps(rel: number) {
  if (rel === 0) {
    return { y: 0, rotateX: 0, opacity: 1, visibility: 'visible' };
  }
  if (rel <= MAX_BEHIND) {
    return {
      y: `${-rel * TAB_OFFSET}rem`,
      rotateX: 0,
      opacity: 1,
      visibility: 'visible' as const,
    };
  }
  return { y: 0, rotateX: 0, opacity: 0, visibility: 'hidden' as const };
}

/** z-index for a slide at a given stack depth. */
function slideZ(rel: number, total: number): number {
  if (rel === 0) return total;
  if (rel <= MAX_BEHIND) return total - rel;
  return 0;
}

/** Create a back-face overlay that covers the card with its pantone color. */
function createBackFace(card: HTMLElement): HTMLElement {
  const overlay = document.createElement('div');
  const styles = getComputedStyle(card);
  overlay.style.cssText = `
    position: absolute;
    inset: 0;
    background-color: ${styles.backgroundColor};
    border-radius: ${styles.borderRadius};
    opacity: 0;
    pointer-events: none;
    z-index: 9999;
  `;
  card.style.position = 'relative';
  card.appendChild(overlay);
  return overlay;
}

/** Show/hide the back-face overlay + inner content based on flip angle. */
function setBackFace(card: HTMLElement, overlay: HTMLElement, angle: number) {
  const abs = Math.abs(angle);
  const isBack = abs > 90 && abs < 270;
  overlay.style.opacity = isBack ? '1' : '0';
  const inner = card.querySelector<HTMLElement>('.contact-team_cards-inner');
  if (inner) inner.style.opacity = isBack ? '0' : '1';
  const tab = card.querySelector<HTMLElement>('[cal-slider="tab"]');
  if (tab) tab.style.color = isBack ? 'var(--_theme---background--transparent)' : '';
}

/** Apply z-index to the slide (parent) of a card. */
function setSlideZ(card: HTMLElement, z: number) {
  const slide = card.closest('.contact-team_cards-item') as HTMLElement | null;
  if (slide) slide.style.zIndex = `${z}`;
}

/* ── Public init ── */

export function initCalSlider() {
  const containers = document.querySelectorAll<HTMLElement>('.contact-team_cards-main-wrapper');
  if (!containers.length) return;

  containers.forEach((container) => {
    const component = container.closest('.contact-team_content');
    if (!component) return;

    const slides = Array.from(container.querySelectorAll<HTMLElement>('.contact-team_cards-item'));
    const cards = slides
      .map((s) => s.querySelector<HTMLElement>('[cal-slider="card"]'))
      .filter(Boolean) as HTMLElement[];
    const total = cards.length;
    if (total === 0) return;

    const prevBtn = component.querySelector<HTMLElement>('[cal-slider="prev"]');
    const nextBtn = component.querySelector<HTMLElement>('[cal-slider="next"]');

    let active = 0;
    let animating = false;

    /* ── Stack slides absolutely ── */
    const wrapper = container.querySelector<HTMLElement>('.contact-team_cards-wrapper');
    slides.forEach((slide) => {
      slide.style.position = 'absolute';
      slide.style.top = '0';
      slide.style.left = '0';
      slide.style.width = '100%';
    });
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.style.height = `${slides[0].offsetHeight}px`;
    }

    /* ── Card base styles + back-face overlays ── */
    const overlays: HTMLElement[] = [];
    cards.forEach((card) => {
      card.style.transformOrigin = 'center bottom';
      card.style.willChange = 'transform, opacity';
      overlays.push(createBackFace(card));
    });

    /* ── Instant layout (no animation) ── */
    function layoutInstant() {
      cards.forEach((card, i) => {
        const rel = relPos(i, active, total);
        gsap.set(card, { ...cardProps(rel), transformPerspective: PERSPECTIVE });
        setSlideZ(card, slideZ(rel, total));
      });
    }

    /* ── Navigate forward (flip current card down) ── */
    function goToNext() {
      if (animating) return;
      animating = true;

      const oldIdx = active;
      active = (active + 1) % total;

      // Immediately update z-indexes so the new front card is on top
      cards.forEach((card, i) => {
        const rel = relPos(i, active, total);
        setSlideZ(card, i === oldIdx ? total + 1 : slideZ(rel, total));
      });

      const tl = gsap.timeline({
        onComplete: () => {
          animating = false;
        },
      });

      // Flip old card away (360° — proxy tracks angle for backface toggle)
      const flipOut = { angle: 0 };
      tl.to(
        flipOut,
        {
          angle: -360,
          duration: DURATION,
          ease: 'power2.inOut',
          onUpdate: () => {
            const abs = Math.abs(flipOut.angle);
            gsap.set(cards[oldIdx], {
              rotateX: flipOut.angle,
              transformPerspective: PERSPECTIVE,
              opacity: abs >= 300 ? 0 : 1,
            });
            setBackFace(cards[oldIdx], overlays[oldIdx], flipOut.angle);
            // Drop behind active + next card once past 180°
            setSlideZ(cards[oldIdx], abs >= 180 ? total - 2 : total + 1);
          },
          onComplete: () => {
            overlays[oldIdx].style.opacity = '0';
            const inner = cards[oldIdx].querySelector<HTMLElement>('.contact-team_cards-inner');
            if (inner) inner.style.opacity = '1';
            const tab = cards[oldIdx].querySelector<HTMLElement>('[cal-slider="tab"]');
            if (tab) tab.style.color = '';
          },
        },
        0
      );

      // Shift remaining cards to new positions
      cards.forEach((card, i) => {
        if (i === oldIdx) return;
        const rel = relPos(i, active, total);
        tl.to(
          card,
          {
            ...cardProps(rel),
            transformPerspective: PERSPECTIVE,
            duration: DURATION,
            ease: 'power2.out',
          },
          0
        );
      });

      // After flip, smoothly slide old card into its stack position
      tl.call(() => {
        const rel = relPos(oldIdx, active, total);
        gsap.set(cards[oldIdx], {
          rotateX: 0,
          y: 0,
          opacity: 0,
          visibility: rel <= MAX_BEHIND ? 'visible' : ('hidden' as const),
          transformPerspective: PERSPECTIVE,
        });
        setSlideZ(cards[oldIdx], slideZ(rel, total));
        if (rel > 0 && rel <= MAX_BEHIND) {
          gsap.to(cards[oldIdx], {
            y: `${-rel * TAB_OFFSET}rem`,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
      });
    }

    /* ── Navigate backward (un-flip card back into view) ── */
    function goToPrev() {
      if (animating) return;
      animating = true;

      active = (active - 1 + total) % total;

      // z-index: incoming card starts behind, will be promoted during flip
      cards.forEach((card, i) => {
        const rel = relPos(i, active, total);
        setSlideZ(card, i === active ? 0 : slideZ(rel, total));
      });

      const tl = gsap.timeline({
        onComplete: () => {
          animating = false;
          // Settle z-indexes
          cards.forEach((card, i) => {
            setSlideZ(card, slideZ(relPos(i, active, total), total));
          });
        },
      });

      // New card flips in from behind (reverse 360° — proxy tracks angle)
      const incoming = active;
      overlays[incoming].style.opacity = '1';
      const flipIn = { angle: -360 };
      gsap.set(cards[incoming], {
        rotateX: -360,
        y: 0,
        transformPerspective: PERSPECTIVE,
      });
      tl.to(
        flipIn,
        {
          angle: 0,
          duration: DURATION,
          ease: 'power2.inOut',
          onUpdate: () => {
            const abs = Math.abs(flipIn.angle);
            gsap.set(cards[incoming], {
              rotateX: flipIn.angle,
              transformPerspective: PERSPECTIVE,
            });
            setBackFace(cards[incoming], overlays[incoming], flipIn.angle);
            // Promote to front once past the backface zone
            setSlideZ(cards[incoming], abs <= 90 ? total + 1 : 0);
          },
          onComplete: () => {
            overlays[incoming].style.opacity = '0';
            const inner = cards[incoming].querySelector<HTMLElement>('.contact-team_cards-inner');
            if (inner) inner.style.opacity = '1';
            const tab = cards[incoming].querySelector<HTMLElement>('[cal-slider="tab"]');
            if (tab) tab.style.color = '';
          },
        },
        0
      );

      // Shift remaining cards backward in the stack
      cards.forEach((card, i) => {
        if (i === active) return;
        const rel = relPos(i, active, total);
        tl.to(
          card,
          {
            ...cardProps(rel),
            transformPerspective: PERSPECTIVE,
            duration: DURATION,
            ease: 'power2.out',
          },
          0
        );
      });
    }

    /* ── Go to arbitrary index ── */
    function goTo(target: number) {
      if (animating || target === active) return;
      const fwd = (((target - active) % total) + total) % total;
      if (fwd <= total / 2) goToNext();
      else goToPrev();
    }

    /* ── Navigation buttons ── */
    nextBtn?.addEventListener('click', goToNext);
    prevBtn?.addEventListener('click', goToPrev);

    /* ── Tab click → navigate ── */
    cards.forEach((card, i) => {
      const tab = card.querySelector<HTMLElement>('[cal-slider="tab"]');
      if (!tab) return;
      tab.style.cursor = 'pointer';
      tab.addEventListener('click', () => goTo(i));
    });

    /* ── Touch / swipe detection ── */
    let startY = 0;
    let startX = 0;

    container.addEventListener(
      'touchstart',
      (e) => {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );

    container.addEventListener(
      'touchend',
      (e) => {
        const dy = e.changedTouches[0].clientY - startY;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
          if (dy < 0) goToNext();
          else goToPrev();
        }
      },
      { passive: true }
    );

    /* ── Tab hover lift (behind-cards only) ── */
    cards.forEach((card, i) => {
      const tab = card.querySelector<HTMLElement>('[cal-slider="tab"]');
      if (!tab) return;

      tab.addEventListener('mouseenter', () => {
        const rel = relPos(i, active, total);
        if (rel === 0 || rel > MAX_BEHIND || animating) return;
        gsap.to(card, {
          y: `${-rel * TAB_OFFSET - 0.5}rem`,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      });

      tab.addEventListener('mouseleave', () => {
        const rel = relPos(i, active, total);
        if (rel === 0 || rel > MAX_BEHIND || animating) return;
        gsap.to(card, {
          y: `${-rel * TAB_OFFSET}rem`,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      });
    });

    /* ── Initial layout ── */
    layoutInstant();
  });
}
