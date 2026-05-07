/**
 * Search bar wrapper "is-active" toggle.
 * Called every page:view via initGlobalFunctions; paired with destroySearchBar
 * in content:replace to keep listener attachments idempotent.
 */

type Cleanup = () => void;
const cleanups = new Set<Cleanup>();

export function initSearchBar(): void {
  const wrapper = document.querySelector<HTMLElement>("[search-form='wrapper']");
  const input = document.querySelector<HTMLInputElement>("[search-form='input']");
  const resetButton = document.querySelector<HTMLElement>("[search-form='reset']");

  if (!wrapper || !input || !resetButton) return;

  const onInput = (): void => {
    wrapper.classList.toggle('is-active', input.value.length > 0);
  };
  const onReset = (): void => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  };

  input.addEventListener('input', onInput);
  resetButton.addEventListener('click', onReset);

  cleanups.add(() => input.removeEventListener('input', onInput));
  cleanups.add(() => resetButton.removeEventListener('click', onReset));
}

export function destroySearchBar(): void {
  cleanups.forEach((fn) => fn());
  cleanups.clear();
}
