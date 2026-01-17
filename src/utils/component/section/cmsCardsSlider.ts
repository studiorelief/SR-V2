/*
 *============================================================================
 * COMPONENT : SECTION / CMS CARDS (X3)
 *============================================================================
 */

import 'swiper/css/bundle';

import Swiper from 'swiper/bundle';

export function initCmsCardsSlider() {
  const swipers = document.querySelectorAll('.swiper.is-cms-cards-slider');

  if (swipers.length === 0) {
    return;
  }

  swipers.forEach((swiperEl) => {
    new Swiper(swiperEl as HTMLElement, {
      direction: 'horizontal',
      loop: true,
      //   centeredSlides: true,
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
      touchEventsTarget: 'wrapper',
      breakpoints: {
        992: {
          slidesPerView: 3,
          spaceBetween: 2 * 16,
        },
      },
    });
  });
}
