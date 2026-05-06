/**
 * Dédoublonnage des Collection Lists "Related Items".
 *
 * Webflow ne permet pas de filtrer un item par lui-même quand on combine
 * une référence DIRECTE et une référence REVERSE pointant vers la même
 * collection. Résultat : un item peut apparaître dans les deux listes,
 * ce qui produit des doublons dans le DOM.
 *
 * Ce module parcourt chaque wrapper marqué `[data-related-dedupe]` et :
 *   1. Garde la 1ère occurrence de chaque `data-slug`
 *   2. Supprime les suivantes (typiquement la liste reverse, placée
 *      après la liste directe dans le DOM)
 *   3. Cache les Collection Lists devenues vides
 *
 * ──────────────────────────────────────────────────────────────────────
 * Usage Webflow :
 *
 *   <div data-related-dedupe>
 *     <!-- Liste DIRECTE (rendue en premier dans le DOM) -->
 *     <div class="w-dyn-list">
 *       <div role="list" class="w-dyn-items">
 *         <div role="listitem" data-slug="article-a">…</div>
 *       </div>
 *     </div>
 *
 *     <!-- Liste REVERSE (les doublons éventuels seront retirés ici) -->
 *     <div class="w-dyn-list">
 *       <div role="list" class="w-dyn-items">
 *         <div role="listitem" data-slug="article-a">…</div>  ← supprimé
 *         <div role="listitem" data-slug="article-b">…</div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Côté Webflow : ajouter un attribut `data-slug` sur l'élément collection-item
 * et le binder au champ Slug du CMS via les Custom Attributes.
 * ──────────────────────────────────────────────────────────────────────
 */

// Sélecteurs centralisés pour être faciles à modifier si besoin.
const WRAPPER_SELECTOR = '[data-related-dedupe]';
const ITEM_SELECTOR = '[data-slug]';
const COLLECTION_LIST_SELECTOR = '.w-dyn-list';

// Mettre à `true` pour vérifier dans la console que le dédoublonnage tourne.
const DEBUG = false;

/*
 *==========================================
 * TYPES Finsweet Attributes v2
 *==========================================
 * On déclare le strict minimum pour pouvoir s'enregistrer dans la file
 * `window.FinsweetAttributes` sans dépendre du package officiel.
 */

interface FinsweetListInstance {
  /** Promise qui résout quand le 1er rendering du module List est terminé. */
  loading: Promise<unknown>;
}

type FinsweetListCallback = (instances: FinsweetListInstance[]) => void | Promise<void>;

interface FinsweetQueue {
  push: (entry: ['list', FinsweetListCallback]) => void;
}

/**
 * Parcourt tous les wrappers `[data-related-dedupe]` et supprime du DOM
 * les items dont le `data-slug` apparaît plusieurs fois dans le wrapper.
 *
 * Idempotente : peut être rappelée sans risque (un second passage ne
 * trouvera plus de doublons).
 */
export function dedupeRelatedItems(): void {
  const wrappers = document.querySelectorAll<HTMLElement>(WRAPPER_SELECTOR);

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[dedupe-related-items] wrappers trouvés :', wrappers.length);
  }

  wrappers.forEach((wrapper) => {
    // Set des slugs déjà rencontrés DANS CE WRAPPER (scopé pour ne pas
    // dédoublonner accidentellement entre plusieurs sections de la page).
    // Set choisi pour son lookup en O(1) et l'unicité par construction.
    const seenSlugs = new Set<string>();

    // querySelectorAll renvoie une NodeList statique → on peut muter
    // le DOM (item.remove()) pendant l'itération sans casser la boucle.
    const items = wrapper.querySelectorAll<HTMLElement>(ITEM_SELECTOR);

    let removed = 0;

    items.forEach((item) => {
      const { slug } = item.dataset;

      // Pas de slug exploitable → on laisse l'item tel quel.
      if (!slug) return;

      if (seenSlugs.has(slug)) {
        // Doublon détecté → on retire l'item du DOM.
        item.remove();
        removed += 1;
      } else {
        seenSlugs.add(slug);
      }
    });

    // Après suppression, certaines Collection Lists peuvent être vides.
    // On les masque pour éviter d'afficher un conteneur sans contenu
    // (ou pire, un padding/margin résiduel issu du style Webflow).
    const collectionLists = wrapper.querySelectorAll<HTMLElement>(COLLECTION_LIST_SELECTOR);

    collectionLists.forEach((list) => {
      const remainingItems = list.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
      if (remainingItems.length === 0) {
        list.style.display = 'none';
      }
    });

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log(
        `[dedupe-related-items] wrapper traité — ${items.length} items, ${removed} doublon(s) retiré(s)`
      );
    }
  });
}

/**
 * Initialise le dédoublonnage de manière robuste vis-à-vis du timing :
 *
 *   1. Passe sync immédiate (items déjà rendus côté serveur Webflow CMS).
 *   2. Hook dans la file Finsweet Attributes v2 pour rejouer le dédoublonnage
 *      APRÈS que le module `list` ait fini son rendering — y compris après
 *      chaque `restart()` (donc post-transition Swup). Sans ce hook, la 1ère
 *      passe peut tomber avant que Finsweet n'ait fini de cloner/filtrer
 *      ses items, et les doublons restent visibles.
 *
 * À appeler une seule fois au chargement initial. Le hook Finsweet se
 * re-déclenche tout seul à chaque restart, donc pas besoin de re-push.
 */
export function initRelatedItemsDedupe(): void {
  // Passe 1 — DOM serveur.
  dedupeRelatedItems();

  // Passe 2 — hook Finsweet List.
  // Le pattern v2 : on push une entry `[moduleName, callback]` dans la file
  // globale `window.FinsweetAttributes`. Avant chargement du script, c'est
  // un Array ; après chargement, c'est l'objet du module qui expose `.push`.
  // Dans les deux cas, `.push(...)` est valide.
  const w = window as Window & { FinsweetAttributes?: FinsweetQueue };
  w.FinsweetAttributes ||= [] as unknown as FinsweetQueue;
  w.FinsweetAttributes.push([
    'list',
    async (instances) => {
      // Attendre que tous les List instances aient fini leur 1er rendering.
      await Promise.all(instances.map((instance) => instance.loading));
      dedupeRelatedItems();
    },
  ]);
}
