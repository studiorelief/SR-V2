/*
 *============================================================================
 * COMPONENT : SECTION / PROJETS
 *============================================================================
 */

import 'swiper/css/bundle';

import Swiper from 'swiper/bundle';

export function initCmsProjetsSlider() {
  const swipers = document.querySelectorAll('.swiper.is-cms-projets');

  if (swipers.length === 0) {
    return;
  }

  swipers.forEach((swiperEl) => {
    // Find pagination element within the slider's parent container
    const parent = swiperEl.parentElement;
    const paginationEl =
      parent?.querySelector('.swiper-pagination') || swiperEl.querySelector('.swiper-pagination');

    new Swiper(swiperEl as HTMLElement, {
      direction: 'horizontal',
      //   loop: true,
      centeredSlides: true,
      initialSlide: 1,
      slidesPerView: 2,
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
        992: {
          slidesPerView: 2.5,
        },
        320: {
          slidesPerView: 1.5,
          spaceBetween: 1.5 * 16,
        },
      },
    });
  });
}
