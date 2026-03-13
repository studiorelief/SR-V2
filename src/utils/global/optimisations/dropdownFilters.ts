/**
 * Click-outside handler for Finsweet accordion filter dropdowns.
 * Closes any open accordion when clicking outside the group wrapper.
 */
export function initDropdownFiltersClickOutside(): void {
  const GROUP_SELECTOR = '.form_filters_main-wrapper';
  const TRIGGER_SELECTOR = '[fs-accordion-element="trigger"]';
  const ACTIVE_CLASS = 'is-active-accordion';

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const wrapper = document.querySelector(GROUP_SELECTOR);
    if (!wrapper) return;

    // Click is inside the filter wrapper — let Finsweet handle it
    if (wrapper.contains(target)) return;

    // Find all active triggers and click them to close
    const activeTriggers = wrapper.querySelectorAll<HTMLElement>(
      `${TRIGGER_SELECTOR}.${ACTIVE_CLASS}`
    );
    activeTriggers.forEach((trigger) => trigger.click());
  });
}
