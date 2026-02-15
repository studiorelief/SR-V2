export function initSearchBar(): void {
  const wrapper = document.querySelector<HTMLElement>("[search-form='wrapper']");
  const input = document.querySelector<HTMLInputElement>("[search-form='input']");
  const resetButton = document.querySelector<HTMLElement>("[search-form='reset']");

  if (!wrapper || !input || !resetButton) return;

  input.addEventListener('input', () => {
    wrapper.classList.toggle('is-active', input.value.length > 0);
  });

  resetButton.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });
}
