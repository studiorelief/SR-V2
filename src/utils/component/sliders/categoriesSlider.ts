/*
 *============================================================================
 * COMPONENT : SECTION / CATEGORIES
 *============================================================================
 */

import 'swiper/css/bundle';

import Swiper from 'swiper/bundle';

export function initCategoriesSlider() {
  const swipers = document.querySelectorAll('.swiper.is-categories');

  if (swipers.length === 0) {
    return;
  }

  swipers.forEach((swiperEl) => {
    // Clone slides to ensure smooth looping with few items
    const wrapper = swiperEl.querySelector('.swiper-wrapper');
    const originalCount = wrapper ? wrapper.children.length : 0;
    if (wrapper) {
      const originalSlides = Array.from(wrapper.children);
      originalSlides.forEach((slide) => {
        const clone = slide.cloneNode(true) as HTMLElement;
        wrapper.appendChild(clone);
      });
    }

    const parent = swiperEl.parentElement;
    const paginationEl =
      parent?.querySelector('.swiper-pagination') || swiperEl.querySelector('.swiper-pagination');

    const swiper = new Swiper(swiperEl as HTMLElement, {
      direction: 'horizontal',
      centeredSlides: true,
      loop: true,
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

    // Custom pagination — only render bullets for original slides
    if (paginationEl && originalCount > 0) {
      paginationEl.innerHTML = '';
      // Create bullets
      for (let i = 0; i < originalCount; i++) {
        const bullet = document.createElement('span');
        bullet.classList.add('swiper-bullet');
        bullet.addEventListener('click', () => swiper.slideToLoop(i));
        paginationEl.appendChild(bullet);
      }

      const bullets = paginationEl.querySelectorAll('.swiper-bullet');

      const updateBullets = () => {
        const realIndex = swiper.realIndex % originalCount;
        bullets.forEach((b, i) => {
          b.classList.toggle('is-active', i === realIndex);
        });
      };

      swiper.on('slideChange', updateBullets);
      updateBullets();
    }
  });
}
