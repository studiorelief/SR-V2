import gsap from 'gsap';

/**
 * Initialise le syntax highlighting sur les blocs de code CMS
 * Cible les éléments avec l'attribut [code-block="highlight"]
 * Ajoute automatiquement un bouton de copie
 *
 * Shiki est chargé dynamiquement (import()) uniquement si au moins un bloc
 * existe dans le DOM → esbuild génère un chunk séparé qui n'est jamais
 * téléchargé sur les pages sans code (homepage, etc.).
 */
export async function initCmsCodeBlock() {
  const codeBlocks = document.querySelectorAll<HTMLElement>('[code-block="highlight"]');

  if (codeBlocks.length === 0) {
    return;
  }

  // Imports dynamiques : Shiki core + engine JS (beaucoup plus léger que le WASM
  // Oniguruma) + uniquement les 6 langs réellement utilisés + 1 seul thème.
  // On passe via les sous-chemins `shiki/...` car @shikijs/* n'est pas hoisté
  // par pnpm (transitive dep). Shiki re-exporte chaque lang/thème individuellement.
  const [
    { createHighlighterCore },
    { createJavaScriptRegexEngine },
    themeMaterial,
    langJson,
    langHtml,
    langCss,
    langJs,
    langTs,
    langTsx,
  ] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/themes/material-theme-darker.mjs'),
    import('shiki/langs/json.mjs'),
    import('shiki/langs/html.mjs'),
    import('shiki/langs/css.mjs'),
    import('shiki/langs/javascript.mjs'),
    import('shiki/langs/typescript.mjs'),
    import('shiki/langs/tsx.mjs'),
  ]);

  const highlighter = await createHighlighterCore({
    themes: [themeMaterial.default],
    langs: [
      langJson.default,
      langHtml.default,
      langCss.default,
      langJs.default,
      langTs.default,
      langTsx.default,
    ],
    engine: createJavaScriptRegexEngine(),
  });

  for (const block of codeBlocks) {
    const codeElement = block.querySelector('code');
    if (!codeElement) continue;

    const rawCode = decodeHtmlEntities(codeElement.textContent || '');
    const lang = block.getAttribute('code-lang') || detectLanguage(rawCode);

    try {
      const highlightedHtml = highlighter.codeToHtml(rawCode, {
        lang,
        theme: 'material-theme-darker',
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      wrapper.innerHTML = `
        <div class="code-block-header">
          <span class="code-block-lang">${lang}</span>
          <button class="code-block-copy" type="button" aria-label="Copier le code">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="code-block-copy-text">Code copié</span>
          </button>
        </div>
        <div class="code-block-content">${highlightedHtml}</div>
      `;

      const copyButton = wrapper.querySelector('.code-block-copy');
      const copyText = wrapper.querySelector('.code-block-copy-text') as HTMLElement;

      if (copyText) {
        gsap.set(copyText, {
          opacity: 0,
          xPercent: 50,
        });
      }

      copyButton?.addEventListener('click', () => handleCopy(rawCode, copyText));

      block.innerHTML = '';
      block.appendChild(wrapper);
    } catch (error) {
      console.error('[cmsCodeBlock] Erreur lors du highlighting:', error);
    }
  }
}

async function handleCopy(code: string, copyText: HTMLElement | null) {
  try {
    await navigator.clipboard.writeText(code);

    if (copyText) {
      gsap.to(copyText, {
        opacity: 1,
        xPercent: 0,
        duration: 0.3,
        ease: 'power2.out',
      });

      gsap.to(copyText, {
        opacity: 0,
        xPercent: 50,
        duration: 0.3,
        ease: 'power2.in',
        delay: 1.5,
      });
    }
  } catch (error) {
    console.error('[cmsCodeBlock] Erreur lors de la copie:', error);
  }
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function detectLanguage(code: string): string {
  if (code.includes('application/ld+json') || code.includes('@context')) {
    return 'json';
  }
  if (code.includes('<script') || code.includes('</script>')) {
    return 'html';
  }
  if (
    code.includes(': string') ||
    code.includes(': number') ||
    code.includes('interface ') ||
    code.includes('<T>')
  ) {
    return 'typescript';
  }
  if (
    code.includes('useState') ||
    code.includes('useEffect') ||
    code.includes('React.') ||
    code.includes('className=')
  ) {
    return 'tsx';
  }
  if (
    code.includes('{') &&
    (code.includes('color:') ||
      code.includes('display:') ||
      code.includes('margin:') ||
      code.includes('padding:'))
  ) {
    return 'css';
  }
  if (code.includes('function') || code.includes('const ') || code.includes('let ')) {
    return 'javascript';
  }
  return 'text';
}
