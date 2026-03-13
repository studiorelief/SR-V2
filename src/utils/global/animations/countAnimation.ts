import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Anime le nombre affiché par Finsweet `fs-list-element="items-count"`
 * de 0 jusqu'à la valeur cible avec un count-up fluide.
 * L'animation se déclenche quand la <section> parente entre dans le viewport.
 */

gsap.registerPlugin(ScrollTrigger);

const SELECTOR = '[fs-list-element="items-count"]';
const DURATION = 1.5;
const DEBOUNCE_MS = 400;

interface ElementState {
  observer: MutationObserver;
  target: number;
  pendingValue: number;
  hasPlayed: boolean;
  scrollTrigger?: ScrollTrigger;
  timer?: ReturnType<typeof setTimeout>;
}

const states = new WeakMap<HTMLElement, ElementState>();
const allObservers: MutationObserver[] = [];

function animateCount(el: HTMLElement, state: ElementState, to: number): void {
  gsap.killTweensOf(el);
  state.target = to;
  state.hasPlayed = true;

  // Déconnecter l'observer pendant toute la durée du tween
  state.observer.disconnect();

  // Fade in + count-up simultanés
  const obj = { value: 0 };

  gsap.to(el, { opacity: 1, duration: 0.4, ease: 'power2.out' });

  gsap.to(obj, {
    value: to,
    duration: DURATION,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = Math.round(obj.value).toString();
    },
    onComplete() {
      // Reconnecter l'observer pour capter les futurs changements Finsweet
      state.observer.observe(el, { childList: true, characterData: true, subtree: true });
    },
  });
}

function scheduleAnimation(el: HTMLElement, state: ElementState, value: number): void {
  state.pendingValue = value;

  // Si déjà joué ou pas encore dans le viewport, on attend le ScrollTrigger
  if (!state.hasPlayed) return;

  animateCount(el, state, value);
}

function handleElement(el: HTMLElement): void {
  // Masquer immédiatement pour cacher le nombre brut pendant le debounce
  gsap.set(el, { opacity: 0 });

  const section = el.closest('section');

  const state: ElementState = {
    target: 0,
    pendingValue: 0,
    hasPlayed: false,
    observer: null!,
  };

  const observer = new MutationObserver(() => {
    const text = el.textContent?.trim() ?? '';
    const parsed = parseInt(text, 10);

    if (!isNaN(parsed) && parsed > 0 && parsed !== state.target) {
      // Debounce : attendre que Finsweet ait fini de paginer
      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => {
        state.timer = undefined;
        scheduleAnimation(el, state, parsed);
      }, DEBOUNCE_MS);
    }
  });

  state.observer = observer;
  states.set(el, state);
  allObservers.push(observer);

  // ScrollTrigger sur la section parente (ou l'élément lui-même en fallback)
  state.scrollTrigger = ScrollTrigger.create({
    trigger: section ?? el,
    start: 'top 80%',
    once: true,
    onEnter() {
      if (state.pendingValue > 0) {
        animateCount(el, state, state.pendingValue);
      } else {
        // Marquer comme prêt — l'animation se lancera dès que la valeur arrive
        state.hasPlayed = true;
      }
    },
  });

  // Si le nombre est déjà présent, stocker la valeur (le ScrollTrigger décidera quand animer)
  const text = el.textContent?.trim() ?? '';
  const num = parseInt(text, 10);

  if (!isNaN(num) && num > 0) {
    state.timer = setTimeout(() => {
      state.timer = undefined;
      scheduleAnimation(el, state, num);
    }, DEBOUNCE_MS);
  }

  observer.observe(el, { childList: true, characterData: true, subtree: true });
}

export function initCountAnimation(): void {
  const elements = document.querySelectorAll<HTMLElement>(SELECTOR);
  elements.forEach(handleElement);
}

export function destroyCountAnimation(): void {
  allObservers.forEach((o) => o.disconnect());
  allObservers.length = 0;

  const elements = document.querySelectorAll<HTMLElement>(SELECTOR);
  elements.forEach((el) => {
    const state = states.get(el);
    if (state?.timer) clearTimeout(state.timer);
    state?.scrollTrigger?.kill();
    gsap.killTweensOf(el);
  });
}
