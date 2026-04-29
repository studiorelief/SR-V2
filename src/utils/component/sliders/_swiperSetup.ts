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

export default Swiper;
