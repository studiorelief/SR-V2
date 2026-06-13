import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { releaseLazyVideo } from '$utils/global/optimisations/lazyVideo';

gsap.registerPlugin(ScrollTrigger);

/**
 * Ratio minimal de la vidéo réellement visible (viewport + recouvrement
 * par les cards suivantes du stack) pour lancer la lecture.
 */
const VIDEO_VISIBLE_THRESHOLD = 0.25;

const initServicesVideos = (section: HTMLElement, cards: NodeListOf<HTMLElement>): void => {
  const videos = Array.from(cards).map((card) => card.querySelector<HTMLVideoElement>('video'));
  if (!videos.some(Boolean)) return;

  // Reprend la main sur ces vidéos : lazyVideo les gère par défaut (viewport
  // play/pause) mais ne sait pas qu'une card stackée n'est plus visible.
  videos.forEach((video) => {
    if (video) releaseLazyVideo(video);
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pauseAll = (): void => {
    videos.forEach((video) => {
      if (video && !video.paused) video.pause();
    });
  };

  const updateVideos = (): void => {
    videos.forEach((video, index) => {
      if (!video) return;

      const rect = video.getBoundingClientRect();
      if (rect.height === 0) return;

      // Bord bas réellement visible : limité par le viewport ET par la card
      // suivante qui vient recouvrir celle-ci pendant le stack.
      let visibleBottom = Math.min(rect.bottom, window.innerHeight);
      for (let next = index + 1; next < cards.length; next++) {
        visibleBottom = Math.min(visibleBottom, cards[next].getBoundingClientRect().top);
      }
      const visibleTop = Math.max(rect.top, 0);
      const visibleRatio = Math.max(0, visibleBottom - visibleTop) / rect.height;

      if (visibleRatio >= VIDEO_VISIBLE_THRESHOLD && !prefersReducedMotion) {
        if (video.paused) {
          video.play().catch(() => {
            /* autoplay bloqué — silencieux */
          });
        }
      } else if (!video.paused) {
        video.pause();
      }
    });
  };

  ScrollTrigger.create({
    id: 'home-services-videos',
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: updateVideos,
    onRefresh: updateVideos,
    onToggle: (self) => {
      if (self.isActive) updateVideos();
      else pauseAll();
    },
  });

  updateVideos();
};

export const initHomeServices = (): void => {
  const section = document.querySelector<HTMLElement>('[home-services="cards-wrapper"]');
  const cards = document.querySelectorAll<HTMLElement>('[home-services="cards"]');

  if (!section || cards.length === 0) return;

  ScrollTrigger.getById('home-services-videos')?.kill();
  initServicesVideos(section, cards);

  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const topOffsets = [4 * rem, 10 * rem, 16.5 * rem];
  const scaleValues = [0.8, 0.9];

  cards.forEach((card, index) => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.vars.id === `home-services-card-${index}` && st.trigger === card) {
        st.kill();
      }
    });

    const isLast = index === cards.length - 1;

    gsap.to(card, {
      scale: isLast ? 1 : (scaleValues[index] ?? 0.9),
      transformOrigin: 'center top',
      ease: 'none',
      scrollTrigger: {
        id: `home-services-card-${index}`,
        trigger: card,
        start: `top ${topOffsets[index] ?? 0}`,
        endTrigger: cards[cards.length - 1],
        end: `top ${topOffsets[topOffsets.length - 1]}`,
        pin: true,
        pinSpacing: false,
        scrub: true,
        invalidateOnRefresh: true,
        markers: false,
      },
    });
  });
};

export const destroyHomeServices = (): void => {
  ScrollTrigger.getAll().forEach((st) => {
    if (typeof st.vars.id === 'string' && st.vars.id.startsWith('home-services-')) {
      st.kill();
    }
  });
};
