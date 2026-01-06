/*
 *============================================================================
 * COMPONENT : SECTION / WHO (STUDIOS)
 *============================================================================
 */

import 'swiper/css/bundle';

import Swiper from 'swiper/bundle';

export function initReviewSlider() {
  const swipers = document.querySelectorAll('.swiper.is-review');

  if (swipers.length === 0) {
    return;
  }

  swipers.forEach((swiperEl) => {
    const swiper = new Swiper(swiperEl as HTMLElement, {
      direction: 'horizontal',
      loop: true,
      centeredSlides: true,
      slidesPerView: 1,
      spaceBetween: 2 * 16,
      speed: 500,
      //   autoplay: {
      //     delay: 5000,
      //     disableOnInteraction: false,
      //   },
      grabCursor: true,
      allowTouchMove: true,
      keyboard: true,
      mousewheel: {
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
        eventsTarget: 'container',
      },
      // pagination: {
      //   el: '.services_component .swiper-pagination-wrapper',
      //   bulletClass: 'swiper-bullet',
      //   bulletActiveClass: 'is-active',
      //   clickable: true,
      // },
      //   navigation: {
      //     prevEl: '.home_who_navigation .swiper-left',
      //     nextEl: '.home_who_navigation .swiper-right',
      //   },
      touchEventsTarget: 'wrapper',
      //   breakpoints: {
      //     992: {
      //       slidesPerView: 2.5,
      //     },
      //     240: {
      //       slidesPerView: 1.5,
      //       spaceBetween: 1.5 * 16,
      //     },
      //   },
    });

    // Pagination personnalisée
    const paginationCards = document.querySelectorAll('.review_pagination-cards');

    // Fonction pour mettre à jour la classe active
    const updatePaginationCards = () => {
      const activeSlide = swiper.slides[swiper.activeIndex];
      const activeReviewCard = activeSlide?.querySelector('.review_cards');
      const activeId = activeReviewCard?.getAttribute('id');

      paginationCards.forEach((paginationCard) => {
        const cardId = paginationCard.getAttribute('id');
        const isActive = cardId === activeId;

        if (isActive) {
          paginationCard.classList.add('is-active');
        } else {
          paginationCard.classList.remove('is-active');
        }
      });
    };

    // Mettre à jour au changement de slide
    swiper.on('slideChange', updatePaginationCards);

    // Initialiser l'état au chargement
    updatePaginationCards();

    paginationCards.forEach((paginationCard) => {
      paginationCard.addEventListener('click', () => {
        const targetId = paginationCard.getAttribute('id');

        if (!targetId) {
          return;
        }

        // Trouver le slide correspondant avec le même id
        const slides = swiperEl.querySelectorAll('.swiper-slide.is-review');

        slides.forEach((slide, index) => {
          const reviewCard = slide.querySelector('.review_cards');

          if (reviewCard && reviewCard.getAttribute('id') === targetId) {
            swiper.slideTo(index);
          }
        });
      });
    });
  });
}
