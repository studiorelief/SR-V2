import gsap from 'gsap';

/**
 * Injecte un élément statique [portfolio-static="baseline"] en haut de la 2e colonne
 * d'une collection list en column-count: 2.
 *
 * Pré-requis Webflow :
 *   - Ajouter l'attribut  portfolio-list="grid"  sur le Collection List Wrapper
 *   - Ajouter l'attribut  portfolio-static="baseline"  sur l'élément statique
 *
 * Fonctionne avec :
 *   - Finsweet CMS Filter (items cachés via display:none)
 *   - Finsweet CMS Load More (nouveaux items injectés dans le DOM)
 */

let baselineEl: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let observer: MutationObserver | null = null;
let isPositioning = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getVisibleItems = (list: HTMLElement): HTMLElement[] =>
  Array.from(list.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el !== baselineEl && el.style.display !== 'none'
  );

/**
 * Retourne le premier item dont le left est significativement plus grand que le premier item.
 * Cela correspond au premier item de la colonne 2 dans un layout column-count.
 */
const getFirstCol2Item = (items: HTMLElement[]): HTMLElement | null => {
  if (items.length < 2) return null;
  const firstLeft = items[0].getBoundingClientRect().left;
  return items.find((item) => item.getBoundingClientRect().left > firstLeft + 10) ?? null;
};

const connectObserver = (): void => {
  if (!observer || !listEl) return;
  // childList: nouveaux items (load more) | attributeFilter: display:none sur enfants directs (filtre)
  // Pas de subtree: on évite de capturer les mutations GSAP sur les éléments imbriqués dans les items
  observer.observe(listEl, {
    childList: true,
    attributeFilter: ['style'],
  });
};

// ─── Positionnement ───────────────────────────────────────────────────────────

const positionBaseline = (): void => {
  if (!baselineEl || !listEl || isPositioning) return;
  isPositioning = true;

  // Déconnecter l'observer pendant la manipulation pour éviter les boucles infinies
  observer?.disconnect();

  // Retirer le baseline de la liste pour mesurer la disposition réelle
  if (baselineEl.parentElement === listEl) {
    listEl.removeChild(baselineEl);
  }

  // Attendre le prochain frame pour que le navigateur recalcule le layout
  requestAnimationFrame(() => {
    if (!baselineEl || !listEl) {
      isPositioning = false;
      connectObserver();
      return;
    }

    const items = getVisibleItems(listEl);
    const firstCol2Item = getFirstCol2Item(items);

    if (firstCol2Item) {
      // Injecter en haut de la colonne 2
      listEl.insertBefore(baselineEl!, firstCol2Item);

      gsap.fromTo(
        baselineEl!,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.05 }
      );
    } else {
      // Pas assez d'items pour créer 2 colonnes → cacher le baseline
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

  // Forcer le baseline au début d'une nouvelle colonne (CSS column layout)
  baselineEl.style.breakBefore = 'column';
  gsap.set(baselineEl, { opacity: 0 });

  // Ignorer les mutations sur baselineEl lui-même (causées par GSAP qui anime opacity/transform)
  observer = new MutationObserver((mutations) => {
    const hasRelevantMutation = mutations.some((m) => m.target !== baselineEl);
    if (hasRelevantMutation) positionBaseline();
  });

  // Lancer le premier positionnement (connectObserver() appelé à la fin du rAF)
  positionBaseline();
};

export const destroyPortfolioBaseline = (): void => {
  observer?.disconnect();
  observer = null;

  // Retirer le baseline de la liste si injecté
  if (baselineEl && listEl && baselineEl.parentElement === listEl) {
    listEl.removeChild(baselineEl);
  }

  baselineEl = null;
  listEl = null;
  isPositioning = false;
};
