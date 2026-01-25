import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

// Store Draggable instances for cleanup (e.g. Barba transitions)
const beforeAfterInstances: Draggable[] = [];

/**
 * Initializes before/after slider on all elements with before-after="wrapper" attribute.
 * Requires child elements: before-after="image-after" and before-after="dragger".
 *
 * @returns Array of created Draggable instances
 */
export function initBeforeAfter(): Draggable[] {
  const wrappers = document.querySelectorAll<HTMLElement>('[before-after="wrapper"]');

  wrappers.forEach((wrapper) => {
    const afterImgWrap = wrapper.querySelector<HTMLElement>('[before-after="image-after"]');
    const dragger = wrapper.querySelector<HTMLElement>('[before-after="dragger"]');

    if (!afterImgWrap || !dragger) return;

    // Skip if Draggable already exists on this dragger
    const existing = Draggable.get(dragger);
    if (existing) {
      existing.enable();
      if (!beforeAfterInstances.includes(existing)) {
        beforeAfterInstances.push(existing);
      }
      return;
    }

    const instances = Draggable.create(dragger, {
      type: 'x',
      bounds: wrapper,
      onDrag() {
        const x = wrapper.offsetWidth / 2 - (gsap.getProperty(this.target, 'x') as number);
        gsap.set(afterImgWrap, { clipPath: `inset(0 calc(${x}px - 0.125rem) 0 0)` });
      },
    });

    const instance = instances[0];
    if (instance) {
      beforeAfterInstances.push(instance);
    }
  });

  return beforeAfterInstances;
}

/**
 * Destroys all before/after Draggable instances.
 * Useful for cleanup during page transitions (e.g. Barba).
 */
export function destroyAllBeforeAfter(): void {
  beforeAfterInstances.forEach((instance) => {
    instance.kill();
  });
  beforeAfterInstances.length = 0;
}
