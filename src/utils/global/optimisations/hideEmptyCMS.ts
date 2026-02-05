export function hideDynListIfEmpty() {
  const elements = document.querySelectorAll('[if-empty="hide"]');

  if (elements.length === 0) {
    return;
  }

  elements.forEach((element) => {
    const isEmpty = element.querySelector('.w-dyn-empty') !== null;

    if (isEmpty && element instanceof HTMLElement) {
      element.style.display = 'none';
    }
  });
}
