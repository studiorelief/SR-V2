/**
 * Mirror click : un trigger persistent (hors #swup) déclenche le click d'une
 * cible interne #swup, et la visibilité du trigger reflète celle de la cible.
 *
 * Pair init/destroy : le trigger + la cible vivent à des endroits différents,
 * et la cible peut être remplacée par Swup. On track le MutationObserver pour
 * pouvoir le déconnecter dans destroy. Flag d'init pour éviter de réattacher
 * un click listener au même trigger à chaque page:view.
 */

const clickMappings: [trigger: string, target: string][] = [
  ['#trigger-show-more', '#target-show-more'],
];

const observers = new Set<MutationObserver>();

export function mirrorClick(): void {
  clickMappings.forEach(([triggerSelector, targetSelector]) => {
    const trigger = document.querySelector<HTMLElement>(triggerSelector);
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!trigger || !target) return;

    if (!trigger.hasAttribute('data-mirror-click-init')) {
      trigger.setAttribute('data-mirror-click-init', 'true');
      trigger.addEventListener('click', () => {
        target.click();
      });
    }

    const syncVisibility = (): void => {
      const isHidden = target.style.display === 'none';
      trigger.style.display = isHidden ? 'none' : '';
    };

    syncVisibility();

    const obs = new MutationObserver(syncVisibility);
    obs.observe(target, {
      attributes: true,
      attributeFilter: ['style'],
    });
    observers.add(obs);
  });
}

/**
 * Cleanup à appeler dans Swup content:replace : disconnect tous les
 * MutationObservers (la cible est dans #swup donc le DOM va disparaître).
 */
export function destroyMirrorClick(): void {
  observers.forEach((obs) => obs.disconnect());
  observers.clear();
}
