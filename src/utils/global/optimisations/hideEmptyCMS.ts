export function hideDynListIfEmpty() {
  const elements = document.querySelectorAll('[if-empty="hide"]');

  if (elements.length === 0) {
    return;
  }

  elements.forEach((element) => {
    const hasItems = element.querySelector('.w-dyn-item') !== null;

    if (!hasItems && element instanceof HTMLElement) {
      element.style.display = 'none';
    }
  });
}
