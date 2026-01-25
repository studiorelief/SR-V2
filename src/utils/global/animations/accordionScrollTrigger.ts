import { ScrollTrigger } from 'gsap/ScrollTrigger';

let observer: MutationObserver | null = null;
let treeObserver: MutationObserver | null = null;
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Refresh ScrollTrigger after accordion animation completes
 * Uses debouncing to avoid multiple refreshes during rapid changes
 */
const refreshScrollTriggerDebounced = (): void => {
  // Clear any pending refresh
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  // Wait for CSS transition to complete (0.3s) + small buffer
  refreshTimeout = setTimeout(() => {
    ScrollTrigger.refresh();
    refreshTimeout = null;
  }, 350); // 300ms transition + 50ms buffer
};

/**
 * Setup observers for existing accordion headers
 */
const setupAccordionObservers = (): void => {
  // Find all accordion headers in the document
  const accordionHeaders = document.querySelectorAll<HTMLElement>(
    '[fs-accordion-element="trigger"]'
  );

  accordionHeaders.forEach((header) => {
    // Only observe if not already observed
    if (!header.hasAttribute('data-accordion-observed')) {
      observer!.observe(header, {
        attributes: true,
        attributeFilter: ['class'],
      });
      header.setAttribute('data-accordion-observed', 'true');
    }
  });
};

/**
 * Initialize accordion ScrollTrigger refresh listener
 * Monitors accordion header elements for class changes
 * Also watches for dynamically added accordions
 */
export const initAccordionScrollTrigger = (): void => {
  // Clean up existing observers if any
  destroyAccordionScrollTrigger();

  // Create MutationObserver to watch for class changes on existing headers
  observer = new MutationObserver((mutations) => {
    let shouldRefresh = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement;
        // Check if the changed element is an accordion header
        if (
          target.hasAttribute('fs-accordion-element') &&
          target.getAttribute('fs-accordion-element') === 'trigger'
        ) {
          shouldRefresh = true;
        }
      }
    });

    if (shouldRefresh) {
      refreshScrollTriggerDebounced();
    }
  });

  // Create a tree observer to watch for newly added accordion headers
  treeObserver = new MutationObserver(() => {
    setupAccordionObservers();
  });

  // Watch the entire document body for new accordion elements
  treeObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Setup observers for existing accordions
  setupAccordionObservers();
};

/**
 * Kill the accordion ScrollTrigger listener
 */
export const destroyAccordionScrollTrigger = (): void => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (treeObserver) {
    treeObserver.disconnect();
    treeObserver = null;
  }

  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }

  // Remove observation markers from accordion headers
  const accordionHeaders = document.querySelectorAll<HTMLElement>(
    '[fs-accordion-element="trigger"][data-accordion-observed]'
  );
  accordionHeaders.forEach((header) => {
    header.removeAttribute('data-accordion-observed');
  });
};
