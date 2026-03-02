let cachedCode: string | null = null;

const MULTI_STEP_SRC = 'https://cdn.jsdelivr.net/gh/videsigns/webflow-tools@latest/multi-step.js';

export async function initContactMultiStep(): Promise<void> {
  if (!cachedCode) {
    const response = await fetch(MULTI_STEP_SRC);
    cachedCode = await response.text();
  }

  // new Function() crée un scope frais à chaque exécution,
  // ce qui force le script à se ré-initialiser même après une navigation Swup
  new Function(cachedCode)();
}

export function destroyContactMultiStep(): void {
  // Pas de cleanup DOM nécessaire — Swup remplace le contenu
}
