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

type NamespaceHandlers = {
  /** Appelé AVANT que le rideau se lève (`content:replace`). */
  setup?: () => void;
  /**
   * Appelé APRÈS le rideau (`page:view`) ET au boot. Peut retourner un
   * `gsap.Context` pour profiter du revert auto au teardown.
   */
  run?: () => void | gsap.Context;
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

/**
 * Run du namespace courant. Appelé dans `page:view` après content:replace
 * ET au tout premier chargement. Si le `run()` retourne un gsap.Context,
 * il est tracké pour le revert au prochain teardown.
 */
export const runNamespaceRun = (): void => {
  const ns = getNamespace();
  if (!ns) return;

  const result = namespaceRegistry[ns]?.run?.();
  if (result && typeof (result as gsap.Context).revert === 'function') {
    namespaceContexts.set(ns, result as gsap.Context);
  }
};
