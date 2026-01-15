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
 * Validates and sets the favicon from the provided URL
 */
function validateAndSetFavicon(url: string): void {
  const testImg = new Image();

  // Add timeout to prevent hanging
  const timeout = setTimeout(() => {
    // Timeout handled silently
  }, 250);

  testImg.onload = () => {
    clearTimeout(timeout);
    setFavicon(url);
  };

  testImg.onerror = () => {
    clearTimeout(timeout);
  };

  testImg.src = url;
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
 * Can be called multiple times (e.g., after Barba.js transitions)
 */
export function updateFavicon(): void {
  // Use requestAnimationFrame to ensure DOM is ready after Barba transitions
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const img = document.querySelector<HTMLImageElement>(`img[${ATTR}]`);

      // If no image found, try again after a short delay
      if (!img) {
        setTimeout(() => {
          const retryImg = document.querySelector<HTMLImageElement>(`img[${ATTR}]`);
          if (retryImg) {
            const newSrc = retryImg.src || retryImg.getAttribute('src');
            if (newSrc) {
              validateAndSetFavicon(newSrc);
            }
          }
        }, 300);
        return;
      }

      const newSrc = img.src || img.getAttribute('src');

      // If no valid src, exit
      if (!newSrc) {
        return;
      }

      // Validate and set favicon
      validateAndSetFavicon(newSrc);
    });
  });
}

/**
 * Initializes the custom favicon functionality
 */
export function initCustomFavicon(): void {
  injectStyle();
  updateFavicon();
}
