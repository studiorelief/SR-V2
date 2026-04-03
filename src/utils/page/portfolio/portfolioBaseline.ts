import gsap from 'gsap';

/**
 * Injecte un élément statique [portfolio-static="baseline"] en haut de la 2e colonne
 * d'une collection list en column-count: 2, et stabilise l'ordre des items
 * lors du load-more pour éviter le saut visuel causé par la redistribution des colonnes.
 *
 * Pré-requis Webflow :
 *   - Le wrapper parent doit être en column-count: 2
 *   - Ajouter l'attribut  portfolio-static="baseline"  sur l'élément statique
 *
 * Stratégie :
 *   - Load-more (nouveaux nodes) → réordonne le DOM pour lecture horizontale
 *   - Filtre / sort (Finsweet) → on ne touche pas au DOM, juste le baseline
 *
 * Fonctionne avec :
 *   - Finsweet CMS Filter / Sort (aucune interférence)
 *   - Finsweet CMS Load More (réordonnement transparent)
 */

let baselineEl: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let observer: MutationObserver | null = null;
let isPositioning = false;
let orderCounter = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Tag chaque item CMS avec son ordre original (une seule fois par item) */
const tagOriginalOrder = (): void => {
  if (!listEl) return;
  Array.from(listEl.children).forEach((el) => {
    if (el instanceof HTMLElement && el !== baselineEl && !el.dataset.portfolioOrder) {
      el.dataset.portfolioOrder = String(orderCounter);
      orderCounter += 1;
    }
  });
};

/** Détecte si une mutation contient des items load-more (nodes sans tag d'ordre) */
const hasNewUntrackedItems = (mutations: MutationRecord[]): boolean =>
  mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (node) =>
        node instanceof HTMLElement &&
        node.classList.contains('w-dyn-item') &&
        !node.dataset.portfolioOrder
    )
  );

const getVisibleItems = (): HTMLElement[] => {
  if (!listEl) return [];
  return Array.from(listEl.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el !== baselineEl && el.style.display !== 'none'
  );
};

/** Items visibles triés par ordre CMS original */
const getVisibleItemsSorted = (): HTMLElement[] =>
  getVisibleItems().sort(
    (a, b) => Number(a.dataset.portfolioOrder || 0) - Number(b.dataset.portfolioOrder || 0)
  );

const getFirstCol2Item = (items: HTMLElement[]): HTMLElement | null => {
  if (items.length < 2) return null;
  const firstLeft = items[0].getBoundingClientRect().left;
  return items.find((item) => item.getBoundingClientRect().left > firstLeft + 10) ?? null;
};

const connectObserver = (): void => {
  if (!observer || !listEl) return;
  observer.observe(listEl, {
    childList: true,
    attributeFilter: ['style'],
  });
};

// ─── Réordonnement (load-more uniquement) ────────────────────────────────────

/**
 * Réordonne les items pour que column-count: 2 produise un ordre de lecture horizontal.
 * Avec N items, column-count met les N/2 premiers en col 1 et le reste en col 2.
 * On interleave : indices pairs (horizontal) → col 1, impairs → col 2.
 */
const reorderForLoadMore = (): void => {
  if (!listEl || !baselineEl) return;

  tagOriginalOrder();

  const items = getVisibleItemsSorted();
  const n = items.length;
  if (n < 2) return;

  const col1: HTMLElement[] = [];
  const col2: HTMLElement[] = [];
  items.forEach((item, i) => {
    if (i % 2 === 0) col1.push(item);
    else col2.push(item);
  });

  // Réordonner : col1, puis baseline (break-before: column), puis col2
  col1.forEach((item) => listEl!.appendChild(item));
  listEl!.appendChild(baselineEl!);
  col2.forEach((item) => listEl!.appendChild(item));
};

// ─── Positionnement baseline ─────────────────────────────────────────────────

const positionBaseline = (): void => {
  if (!baselineEl || !listEl || isPositioning) return;
  isPositioning = true;
  observer?.disconnect();

  if (baselineEl.parentElement === listEl) {
    listEl.removeChild(baselineEl);
  }

  requestAnimationFrame(() => {
    if (!baselineEl || !listEl) {
      isPositioning = false;
      connectObserver();
      return;
    }

    const items = getVisibleItems();
    const firstCol2Item = getFirstCol2Item(items);

    if (firstCol2Item) {
      listEl.insertBefore(baselineEl!, firstCol2Item);

      gsap.fromTo(
        baselineEl!,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.05 }
      );
    } else {
      gsap.set(baselineEl!, { opacity: 0 });
    }

    isPositioning = false;
    connectObserver();
  });
};

// ─── Init / Destroy ───────────────────────────────────────────────────────────

export const initPortfolioBaseline = (): void => {
  baselineEl = document.querySelector<HTMLElement>('[portfolio-static="baseline"]');
  listEl = document.querySelector<HTMLElement>('.portfolio_collection-list-wrapper .w-dyn-items');

  if (!baselineEl || !listEl) return;

  baselineEl.style.breakBefore = 'column';
  gsap.set(baselineEl, { opacity: 0 });

  // Tag les items déjà présents
  tagOriginalOrder();

  observer = new MutationObserver((mutations) => {
    const hasRelevantMutation = mutations.some((m) => m.target !== baselineEl);
    if (!hasRelevantMutation) return;

    if (hasNewUntrackedItems(mutations)) {
      // Load-more : réordonner le DOM puis repositionner baseline
      observer?.disconnect();
      reorderForLoadMore();
      gsap.fromTo(
        baselineEl!,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.05 }
      );
      connectObserver();
    } else {
      // Filtre / sort : cacher le baseline immédiatement, puis repositionner après Finsweet
      gsap.killTweensOf(baselineEl!);
      gsap.set(baselineEl!, { opacity: 0 });

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        positionBaseline();
      }, 50);
    }
  });

  // Premier positionnement : réordonne + baseline
  reorderForLoadMore();
  gsap.fromTo(
    baselineEl,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.05 }
  );
  connectObserver();
};

export const destroyPortfolioBaseline = (): void => {
  observer?.disconnect();
  observer = null;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (baselineEl && listEl && baselineEl.parentElement === listEl) {
    listEl.removeChild(baselineEl);
  }

  baselineEl = null;
  listEl = null;
  isPositioning = false;
  orderCounter = 0;
};
