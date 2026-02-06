/*
 *============================================================================
 * COMPONENT : SECTION / REVIEWS
 *============================================================================
 */

import 'swiper/css/bundle';

import gsap from 'gsap';
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
      speed: 300,
      effect: 'fade',
      fadeEffect: {
        crossFade: true,
      },
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
    });

    // Animation sur les éléments asset (left to right) & text (right to left)
    const animateSlideIn = (slide: Element) => {
      const assets = slide.querySelectorAll('[review-slider="asset"]');
      const texts = slide.querySelectorAll('[review-slider="text"]');

      if (assets.length > 0) {
        gsap.fromTo(
          assets,
          { xPercent: -100, autoAlpha: 0 },
          { xPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }
        );
      }
      if (texts.length > 0) {
        gsap.fromTo(
          texts,
          { yPercent: 20, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }
        );
      }
    };

    const resetSlideElements = (slide: Element) => {
      const assets = slide.querySelectorAll('[review-slider="asset"]');
      const texts = slide.querySelectorAll('[review-slider="text"]');
      gsap.set(assets, { xPercent: -100, autoAlpha: 0 });
      gsap.set(texts, { yPercent: 20, autoAlpha: 0 });
    };

    // Reset tous les slides sauf l'actif au démarrage
    swiper.slides.forEach((slide, i) => {
      if (i !== swiper.activeIndex) resetSlideElements(slide);
    });

    swiper.on('slideChange', () => {
      // Reset tous les slides
      swiper.slides.forEach((slide) => resetSlideElements(slide));

      // Animer le nouveau slide actif avec un léger délai (laisser le fade démarrer)
      const activeSlide = swiper.slides[swiper.activeIndex];
      if (activeSlide) animateSlideIn(activeSlide);
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
