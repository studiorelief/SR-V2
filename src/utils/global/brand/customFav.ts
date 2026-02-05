const ATTR = 'custom-favicon';

/**
 * Hide favicon source images completely (no layout cost)
 */
function injectStyle(): void {
  const style = document.createElement('style');
  style.textContent = `[${ATTR}] { display: none !important; }`;
  document.head.appendChild(style);
}

/**
 * Sets the favicon by removing existing favicon links and adding new ones
 */
function setFavicon(url: string): void {
  try {
    // Remove all existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach((el) => el.remove());

    // Add new favicon (both modern and legacy for compatibility)
    const modernLink = document.createElement('link');
    modernLink.rel = 'icon';
    modernLink.href = url;
    document.head.appendChild(modernLink);

    const legacyLink = document.createElement('link');
    legacyLink.rel = 'shortcut icon';
    legacyLink.href = url;
    document.head.appendChild(legacyLink);
  } catch (error) {
    console.error('🎨 BRIX Custom Favicon - Error setting favicon:', error);
  }
}

/**
 * Updates the favicon from the image with custom-favicon attribute
 * Can be called multiple times (e.g., after Swup transitions)
 */
export function updateFavicon(): void {
  const img = document.querySelector<HTMLImageElement>(`img[${ATTR}]`);

  if (!img) {
    return;
  }

  const newSrc = img.src || img.getAttribute('src');

  if (!newSrc) {
    return;
  }

  // Set favicon directly for immediate update
  setFavicon(newSrc);
}

/**
 * Initializes the custom favicon functionality
 */
export function initCustomFavicon(): void {
  injectStyle();
  updateFavicon();
}
