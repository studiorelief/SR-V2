/*
 *============================================================================
 * SWIPER — SETUP MODULAIRE
 *============================================================================
 *
 * Charge Swiper avec uniquement les modules réellement utilisés par le projet,
 * au lieu du `swiper/bundle` complet qui inclut tous les modules + effets.
 *
 * Modules utilisés :
 * - Pagination       → cmsCardsSlider, cmsProjetsSlider
 * - Navigation       → authorsSlider
 * - Keyboard         → tous les sliders (option `keyboard: true`)
 * - Mousewheel       → tous les sliders (option `mousewheel: {...}`)
 * - EffectFade       → reviewSlider (option `effect: 'fade'`)
 *
 * Les modules sont enregistrés une seule fois côté Swiper. Toutes les
 * instances créées via cet export les ont disponibles.
 */

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Swiper from 'swiper';
import { EffectFade, Keyboard, Mousewheel, Navigation, Pagination } from 'swiper/modules';

Swiper.use([Pagination, Navigation, Keyboard, Mousewheel, EffectFade]);

/*
 *============================================================================
 * SWIPER LIFECYCLE — TRACKER POUR CLEANUP SWUP
 *============================================================================
 *
 * Chaque init de slider crée un `new Swiper(...)` qui attache observers /
 * mousewheel / keyboard / pointer listeners + lance sa propre boucle interne.
 * Sur swup transition, le DOM du slider est remplacé mais l'instance Swiper
 * orpheline reste vivante en mémoire (références gardées par ses listeners
 * + son ticker interne) → elle continue à consommer du CPU sur des nodes
 * détachés. Sur N navigations, on accumule N instances ghosts.
 *
 * Pour éviter ça : chaque init appelle `trackSwiper()`, et `destroyAllSliders`
 * est appelé dans `content:replace` pour libérer toutes les instances avant
 * que le nouveau DOM soit injecté.
 */
const trackedSwipers: Swiper[] = [];

export const trackSwiper = (swiper: Swiper): void => {
  trackedSwipers.push(swiper);
};

export const destroyAllSliders = (): void => {
  trackedSwipers.forEach((swiper) => {
    try {
      swiper.destroy(true, true);
    } catch {
      /* déjà détruit, on ignore */
    }
  });
  trackedSwipers.length = 0;
};

export default Swiper;
