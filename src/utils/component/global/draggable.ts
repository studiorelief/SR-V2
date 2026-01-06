import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

// Store Draggable instances for cleanup
const draggableInstances: Draggable[] = [];

/**
 * Initializes draggable functionality on all elements with trigger="draggable" attribute
 * @returns Array of created Draggable instances
 */
export function initDraggable(): Draggable[] {
  // Find all elements with trigger="draggable" attribute
  const draggableElements = document.querySelectorAll<HTMLElement>('[trigger="draggable"]');

  draggableElements.forEach((element) => {
    // Check if element already has a Draggable instance
    const existingInstance = Draggable.get(element);
    if (existingInstance) {
      // If it exists, enable it and add to instances array if not already there
      existingInstance.enable();
      if (!draggableInstances.includes(existingInstance)) {
        draggableInstances.push(existingInstance);
      }
      return;
    }

    // Create new Draggable instance
    const instance = Draggable.create(element, {
      type: 'x,y', // Allow dragging in both directions by default
      cursor: 'grab',
      activeCursor: 'grabbing',
    })[0]; // Draggable.create returns an array, get the first instance

    if (instance) {
      draggableInstances.push(instance);
    }
  });

  return draggableInstances;
}

/**
 * Destroys all Draggable instances and cleans up event listeners
 * Useful for cleanup during page transitions
 */
export function destroyAllDraggables(): void {
  draggableInstances.forEach((instance) => {
    instance.kill();
  });
  draggableInstances.length = 0; // Clear the array
}
