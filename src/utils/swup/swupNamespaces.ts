/**
 * Gestion centralisée des namespaces Swup.
 *
 * API simplifiée : `{ setup?, run? }`.
 * - `setup` : appelé AVANT que le rideau se lève (`content:replace`). Sert
 *   au teardown du namespace sortant (revert d'un gsap.context, par ex.).
 * - `run`   : appelé APRÈS l'injection du contenu (`page:view`) ET au tout
 *   premier chargement (boot). Crée toutes les animations / scrollTriggers
 *   du namespace.
 *
 * `run` peut retourner un `gsap.Context` pour activer le cleanup automatique.
 * Le context est tracké côté registry et `setup` du même namespace appellera
 * `ctx.revert()` à la prochaine transition pour kill tweens + ScrollTriggers.
 */

import type gsap from 'gsap';

type RunResult = void | gsap.Context | Promise<void | gsap.Context>;

type NamespaceHandlers = {
  /** Appelé AVANT que le rideau se lève (`content:replace`). */
  setup?: () => void;
  /**
   * Appelé APRÈS le rideau (`page:view`) ET au boot. Peut retourner un
   * `gsap.Context` (pour cleanup auto au teardown), ou une Promise du
   * même type quand le module est dynamiquement importé.
   */
  run?: () => RunResult;
};

const namespaceRegistry: Record<string, NamespaceHandlers> = {};

/** Context GSAP actif par namespace, pour cleanup auto. */
const namespaceContexts = new Map<string, gsap.Context>();

export const registerNamespace = (namespace: string, handlers: NamespaceHandlers): void => {
  namespaceRegistry[namespace] = handlers;
};

/** Récupère le namespace courant depuis l'attribut `data-swup-namespace` du `#swup`. */
export const getNamespace = (): string | null => {
  return document.querySelector('#swup')?.getAttribute('data-swup-namespace') || null;
};

/**
 * Setup du namespace courant. Appelé dans `content:replace` avant le rideau.
 * Revert le gsap.context tracké (kill tweens + ScrollTriggers du namespace),
 * puis appelle le `setup()` custom si défini.
 */
export const runNamespaceSetup = (): void => {
  const ns = getNamespace();
  if (!ns) return;

  const ctx = namespaceContexts.get(ns);
  if (ctx) {
    ctx.revert();
    namespaceContexts.delete(ns);
  }

  namespaceRegistry[ns]?.setup?.();
};

const isContext = (v: unknown): v is gsap.Context =>
  typeof v === 'object' && v !== null && typeof (v as gsap.Context).revert === 'function';

/**
 * Run du namespace courant. Appelé dans `page:view` après content:replace
 * ET au tout premier chargement.
 *
 * Async-aware : un `run()` peut retourner directement un gsap.Context (sync)
 * ou une Promise<gsap.Context> (cas dynamic import). Le context est tracké
 * dès qu'il est résolu, pour le revert au prochain teardown.
 *
 * Fire-and-forget côté caller : si l'utilisateur scrolle avant la résolution
 * de l'import, le ScrollTrigger.kill global du content:replace nettoiera de
 * toute façon. SwupPreloadPlugin (preloadHoveredLinks) garde les chunks
 * chauds en pratique, donc latence quasi-nulle.
 */
export const runNamespaceRun = (): void => {
  const ns = getNamespace();
  if (!ns) return;

  const result = namespaceRegistry[ns]?.run?.();
  if (!result) return;

  if (isContext(result)) {
    namespaceContexts.set(ns, result);
    return;
  }

  // Promise<void | gsap.Context>
  void Promise.resolve(result).then((resolved) => {
    if (isContext(resolved)) {
      namespaceContexts.set(ns, resolved);
    }
  });
};
