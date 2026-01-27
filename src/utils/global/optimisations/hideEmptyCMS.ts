export function hideDynListIfEmpty() {
  const dynLists = document.querySelectorAll('.w-dyn-list[if-empty="hide"]');

  if (dynLists.length === 0) {
    return;
  }

  dynLists.forEach((list) => {
    const isEmpty = list.querySelector('.w-dyn-empty') !== null;

    if (isEmpty && list instanceof HTMLElement) {
      list.style.display = 'none';
    }
  });
}
