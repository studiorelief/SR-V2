/**
 * Gestion centralisée des namespaces Swup
 * Permet d'enregistrer des callbacks par namespace pour setup/animate
 */

type NamespaceHandlers = {
  /** Appelé AVANT que le rideau se lève (content:replace) */
  setup?: () => void;
  /** Appelé APRÈS que le rideau soit levé (visit:end) */
  animate?: () => void;
  /** Appelé au premier chargement (setup + animate) */
  init?: () => void;
};

const namespaceRegistry: Record<string, NamespaceHandlers> = {};

/**
 * Enregistre les handlers pour un namespace
 */
export const registerNamespace = (namespace: string, handlers: NamespaceHandlers): void => {
  namespaceRegistry[namespace] = handlers;
};

/**
 * Récupère le namespace actuel depuis le DOM
 */
export const getNamespace = (): string | null => {
  return document.querySelector('#swup')?.getAttribute('data-swup-namespace') || null;
};

/**
 * Exécute le setup du namespace actuel (avant le rideau)
 */
export const runNamespaceSetup = (): void => {
  const ns = getNamespace();
  if (ns && namespaceRegistry[ns]?.setup) {
    namespaceRegistry[ns].setup();
  }
};

/**
 * Exécute l'animation du namespace actuel (après le rideau)
 */
export const runNamespaceAnimate = (): void => {
  const ns = getNamespace();
  if (ns && namespaceRegistry[ns]?.animate) {
    namespaceRegistry[ns].animate();
  }
};

/**
 * Exécute l'init du namespace actuel (premier chargement)
 */
export const runNamespaceInit = (): void => {
  const ns = getNamespace();
  if (ns && namespaceRegistry[ns]?.init) {
    namespaceRegistry[ns].init();
  }
};
