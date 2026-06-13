/*
 *============================================================================
 * PAGE : STUDIO / CORE TEAM
 *============================================================================
 *
 * Slider horizontal des membres de la core team. Slide active centrée
 * (`centeredSlides`) + overflow visible (cf. sliders.css) pour laisser
 * dépasser les cards voisines. Gap graduel entre les cards (2rem mobile →
 * 5rem desktop). Pagination rendue sur l'élément `.swiper-pagination` voisin
 * (sibling) du `.swiper`.
 */

import Swiper, { trackSwiper } from '$utils/component/sliders/_swiperSetup';

export function initCoreTeamSlider() {
  const swipers = document.querySelectorAll('.swiper.is-core-team');

  if (swipers.length === 0) {
    return;
  }

  swipers.forEach((swiperEl) => {
    // Pagination = sibling `.swiper-pagination` (fallback : à l'intérieur du swiper)
    const parent = swiperEl.parentElement;
    const paginationEl =
      parent?.querySelector('.swiper-pagination') || swiperEl.querySelector('.swiper-pagination');

    const swiper = new Swiper(swiperEl as HTMLElement, {
      direction: 'horizontal',
      slidesPerView: 'auto',
      // centeredSlides: true,
      // initialSlide: 1,
      spaceBetween: 2 * 16,
      speed: 500,
      grabCursor: true,
      allowTouchMove: true,
      keyboard: true,
      mousewheel: {
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
        eventsTarget: 'container',
      },
      pagination: {
        el: paginationEl as HTMLElement,
        bulletClass: 'swiper-bullet',
        bulletActiveClass: 'is-active',
        clickable: true,
      },
      touchEventsTarget: 'wrapper',
      breakpoints: {
        768: {
          spaceBetween: 3 * 16,
          slidesPerView: 2,
        },
        992: {
          spaceBetween: 5 * 16,
          slidesPerView: 3,
        },
      },
    });
    trackSwiper(swiper);
  });
}
