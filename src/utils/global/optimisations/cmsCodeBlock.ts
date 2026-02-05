import gsap from 'gsap';
import { codeToHtml } from 'shiki';

/**
 * Initialise le syntax highlighting sur les blocs de code CMS
 * Cible les éléments avec l'attribut [code-block="highlight"]
 * Ajoute automatiquement un bouton de copie
 */
export async function initCmsCodeBlock() {
  const codeBlocks = document.querySelectorAll<HTMLElement>('[code-block="highlight"]');

  if (codeBlocks.length === 0) {
    return;
  }

  for (const block of codeBlocks) {
    const codeElement = block.querySelector('code');
    if (!codeElement) continue;

    // Récupère le code brut (décode les entités HTML)
    const rawCode = decodeHtmlEntities(codeElement.textContent || '');

    // Détecte le langage depuis l'attribut ou par défaut
    const lang = block.getAttribute('code-lang') || detectLanguage(rawCode);

    try {
      // Génère le HTML avec syntax highlighting
      const highlightedHtml = await codeToHtml(rawCode, {
        lang,
        theme: 'material-theme-darker',
      });

      // Crée le wrapper avec le bouton de copie
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

      // Ajoute l'event listener pour la copie
      const copyButton = wrapper.querySelector('.code-block-copy');
      const copyText = wrapper.querySelector('.code-block-copy-text') as HTMLElement;

      // État initial du texte (caché à droite)
      if (copyText) {
        gsap.set(copyText, {
          opacity: 0,
          xPercent: 50,
        });
      }

      copyButton?.addEventListener('click', () => handleCopy(rawCode, copyText));

      // Remplace le bloc original
      block.innerHTML = '';
      block.appendChild(wrapper);
    } catch (error) {
      console.error('[cmsCodeBlock] Erreur lors du highlighting:', error);
    }
  }
}

/**
 * Gère la copie du code dans le presse-papier
 */
async function handleCopy(code: string, copyText: HTMLElement | null) {
  try {
    await navigator.clipboard.writeText(code);

    // Animation du texte "Code copié" par la droite
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

/**
 * Décode les entités HTML (&lt; &gt; etc.)
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Détecte le langage du code (basique)
 */
function detectLanguage(code: string): string {
  if (code.includes('application/ld+json') || code.includes('@context')) {
    return 'json';
  }
  if (code.includes('<script') || code.includes('</script>')) {
    return 'html';
  }
  // TypeScript (avant JavaScript car plus spécifique)
  if (
    code.includes(': string') ||
    code.includes(': number') ||
    code.includes('interface ') ||
    code.includes('<T>')
  ) {
    return 'typescript';
  }
  // React/TSX/JSX
  if (
    code.includes('useState') ||
    code.includes('useEffect') ||
    code.includes('React.') ||
    code.includes('className=')
  ) {
    return 'tsx';
  }
  // CSS
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
