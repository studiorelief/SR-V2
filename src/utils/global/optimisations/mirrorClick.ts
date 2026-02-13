const clickMappings: [trigger: string, target: string][] = [
  ['#trigger-show-more', '#target-show-more'],
];

export function mirrorClick(): void {
  clickMappings.forEach(([triggerSelector, targetSelector]) => {
    const trigger = document.querySelector<HTMLElement>(triggerSelector);
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!trigger || !target) return;

    trigger.addEventListener('click', () => {
      target.click();
    });
  });
}
