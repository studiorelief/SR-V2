import gsap from 'gsap';

/**
 * Navbar Animation Controller
 * GSAP timeline + CSS pour hovers
 */

const CONFIG = {
  duration: 0.4,
  durationClose: 0.3, // Fermeture plus rapide
  ease: 'power3.out',
  openWidth: '12.5rem',
  slideY: '0.5rem', // Slide up depuis le bas
  slideX: '-0.5rem', // 8px en rem
  mediaQuery: '(min-width: 991px)',
} as const;

interface NavbarElements {
  component: HTMLElement;
  container: HTMLElement;
  titleTexts: HTMLElement[];
  linkWrappers: HTMLElement[];
  linkWrappersMulti: HTMLElement[];
  menuSections: HTMLElement[];
  linkIcons: HTMLElement[];
  iconOpen: HTMLElement | null;
  iconClose: HTMLElement | null;
}

let elements: NavbarElements | null = null;
let mainTimeline: gsap.core.Timeline | null = null;

/**
 * Cache DOM elements
 */
const getElements = (): NavbarElements | null => {
  const component = document.querySelector<HTMLElement>('.nav_component');
  if (!component) return null;

  const container = component.querySelector<HTMLElement>('.nav_container');
  if (!container) return null;

  return {
    component,
    container,
    titleTexts: [...component.querySelectorAll<HTMLElement>('.nav_menu_link-title-text')],
    linkWrappers: [...component.querySelectorAll<HTMLElement>('.nav_menu_link-wrapper')],
    linkWrappersMulti: [
      ...component.querySelectorAll<HTMLElement>('.nav_menu_link-wrapper.is-multi'),
    ],
    menuSections: [...component.querySelectorAll<HTMLElement>('.nav_menu-section')],
    linkIcons: [...component.querySelectorAll<HTMLElement>('.nav_menu_link-icon')],
    iconOpen: component.querySelector<HTMLElement>(
      '.nav_menu-section-brand .nav_menu_link-icon-open'
    ),
    iconClose: component.querySelector<HTMLElement>(
      '.nav_menu-section-brand .nav_menu_link-icon-close'
    ),
  };
};

/**
 * Build the main timeline
 */
const buildTimeline = (): gsap.core.Timeline => {
  if (!elements) return gsap.timeline();

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: CONFIG.ease },
    onStart: () => {
      // Add class for CSS link hovers
      elements!.component.classList.add('is-open');

      // Show elements before animating
      gsap.set(elements!.titleTexts, { display: 'flex' });
      gsap.set(elements!.linkWrappers, { display: 'flex' });

      // Show iconOpen (hidden by default in Webflow)
      if (elements!.iconOpen) gsap.set(elements!.iconOpen, { display: 'flex' });
    },
    onReverseComplete: () => {
      // Remove class
      elements!.component.classList.remove('is-open');

      // Hide elements
      gsap.set(elements!.titleTexts, {
        display: 'none',
        opacity: 0,
        y: CONFIG.slideY,
        clearProps: 'paddingBottom',
      });
      gsap.set(elements!.linkWrappers, { display: 'none', opacity: 0, x: CONFIG.slideX });
      gsap.set(elements!.linkWrappersMulti, { marginTop: 0 });

      // Reset icons
      if (elements!.iconOpen) gsap.set(elements!.iconOpen, { display: 'none', opacity: 0 });
      if (elements!.iconClose) gsap.set(elements!.iconClose, { opacity: 1 });
    },
  });

  // Container width
  tl.to(
    elements.container,
    {
      width: CONFIG.openWidth,
      duration: CONFIG.duration,
    },
    0
  );

  // Link icons transformation
  if (elements.linkIcons.length > 0) {
    tl.to(
      elements.linkIcons,
      {
        width: 'var(--_sizes---icons--medium)',
        height: 'var(--_sizes---icons--medium)',
        borderRadius: 'var(--_sizes---border-radius--xxsmall)',
        border: '1px solid var(--_theme---border-color--primary)',
        marginBottom: 'var(--_layout---spacing--large)',
        duration: CONFIG.duration,
      },
      0
    );
  }

  // Menu sections padding
  if (elements.menuSections.length > 0) {
    tl.to(
      elements.menuSections,
      {
        paddingLeft: 'var(--_layout---spacing--small)',
        paddingRight: 'var(--_layout---spacing--small)',
        paddingTop: 'var(--_layout---spacing--small)',
        paddingBottom: 'var(--_layout---spacing--medium)',
        duration: CONFIG.duration,
      },
      0
    );
  }

  // Icon crossfade - GSAP controlled
  if (elements.iconClose) {
    tl.to(
      elements.iconClose,
      {
        opacity: 0,
        duration: 0.25,
      },
      0
    );
  }

  if (elements.iconOpen) {
    tl.to(
      elements.iconOpen,
      {
        opacity: 1,
        duration: 0.3,
      },
      0.05
    );
  }

  // Title texts - fade in + slide up (smooth)
  if (elements.titleTexts.length > 0) {
    // Set padding immédiatement (pas animé = plus smooth)
    tl.set(elements.titleTexts, { paddingBottom: 'var(--_layout---spacing--medium)' }, 0);
    tl.fromTo(
      elements.titleTexts,
      { opacity: 0, y: CONFIG.slideY },
      {
        opacity: 1,
        y: 0,
        duration: CONFIG.duration * 0.7,
        ease: 'power2.out',
        stagger: 0.03,
      },
      0.05
    );
  }

  // Link wrappers - fade in + slide
  if (elements.linkWrappers.length > 0) {
    tl.fromTo(
      elements.linkWrappers,
      { opacity: 0, x: CONFIG.slideX },
      {
        opacity: 1,
        x: 0,
        duration: CONFIG.duration * 0.6,
        stagger: 0.02,
      },
      0.1
    );
  }

  // Multi wrappers margin
  if (elements.linkWrappersMulti.length > 0) {
    tl.to(
      elements.linkWrappersMulti,
      {
        marginTop: 'var(--_layout---spacing--small)',
        duration: CONFIG.duration * 0.5,
      },
      0.1
    );
  }

  return tl;
};

/**
 * Set initial state
 */
const setInitialState = (): void => {
  if (!elements) return;

  elements.component.classList.remove('is-open');

  gsap.set(elements.titleTexts, {
    display: 'none',
    opacity: 0,
    y: CONFIG.slideY,
  });
  gsap.set(elements.linkWrappers, { display: 'none', opacity: 0, x: CONFIG.slideX });
  gsap.set(elements.linkWrappersMulti, { marginTop: 0 });

  // Icons initial state
  if (elements.iconOpen) {
    gsap.set(elements.iconOpen, { display: 'none', opacity: 0 });
  }
  if (elements.iconClose) {
    gsap.set(elements.iconClose, { opacity: 1 });
  }
};

/**
 * Open navbar
 */
const openNavbar = (): void => {
  if (!mainTimeline) return;
  // Reset timeScale pour l'ouverture
  mainTimeline.timeScale(1);
  mainTimeline.play();
};

/**
 * Close navbar (plus rapide que l'ouverture)
 */
const closeNavbar = (): void => {
  if (!mainTimeline) return;
  // Accélérer la fermeture
  mainTimeline.timeScale(CONFIG.duration / CONFIG.durationClose);
  mainTimeline.reverse();
};

const isDesktop = (): boolean => window.matchMedia(CONFIG.mediaQuery).matches;

/**
 * Navbar Highlight - Animations between highlights
 */
export function initNavbarHighlight(): void {
  const highlightMap: Record<string, string> = {
    portfolio: 'nav-portfolio',
    solutions: 'nav-solutions',
    approche: 'nav-approche',
    ressources: 'nav-ressources',
    reperes: 'nav-reperes',
  };

  Object.entries(highlightMap).forEach(([sourceHighlight, targetHighlight]) => {
    const sourceElements = document.querySelectorAll<HTMLElement>(
      `[highlight="${sourceHighlight}"]`
    );
    const targetElement = document.querySelector<HTMLElement>(`[highlight="${targetHighlight}"]`);

    if (!targetElement) return;

    const svgComponent = targetElement.querySelector<HTMLElement>('.svg-component');

    sourceElements.forEach((sourceEl) => {
      // Mouse enter
      sourceEl.addEventListener('mouseenter', () => {
        gsap.to(targetElement, {
          backgroundColor: 'var(--_theme---background--accent-orange)',
        });

        if (svgComponent) {
          gsap.to(svgComponent, {
            rotation: 7.5,
            scale: 1.15,
            duration: 0.3,
            ease: 'back.out(1.2)',
            transformOrigin: 'center center',
            force3D: true,
          });
        }
      });

      // Mouse leave
      sourceEl.addEventListener('mouseleave', () => {
        gsap.to(targetElement, {
          backgroundColor: '',
        });

        if (svgComponent) {
          gsap.to(svgComponent, {
            rotation: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            transformOrigin: 'center center',
            force3D: true,
          });
        }
      });
    });
  });
}

/**
 * Initialize inner page highlight
 * Applies background color to nav highlights based on URL path
 */
export const initInnerHighlight = (): void => {
  const currentUrl = window.location.pathname;

  // Map URL paths to their corresponding nav highlights
  const pathToHighlightMap: Record<string, string> = {
    '/blog/': 'nav-ressources',
    '/labs/': 'nav-ressources',
    '/stack/': 'nav-ressources',
    '/formation/': 'nav-ressources',
    '/portfolio/': 'nav-portfolio',
  };

  // Get all unique highlights
  const allHighlights = [...new Set(Object.values(pathToHighlightMap))];

  // First, remove background color from all possible highlights
  allHighlights.forEach((highlight) => {
    const element = document.querySelector<HTMLElement>(`[highlight="${highlight}"]`);
    if (element) {
      gsap.set(element, {
        backgroundColor: '',
        clearProps: 'backgroundColor',
      });
    }
  });

  // Find matching path and get corresponding highlight
  const matchingPath = Object.keys(pathToHighlightMap).find((path) => currentUrl.includes(path));

  // If URL matches, apply background color to corresponding highlight
  if (matchingPath) {
    const highlight = pathToHighlightMap[matchingPath];
    const targetElement = document.querySelector<HTMLElement>(`[highlight="${highlight}"]`);

    if (targetElement) {
      gsap.set(targetElement, {
        backgroundColor: 'var(--_theme---background--accent-orange)',
      });
    }
  }
};

/**
 * Met à jour les classes w--current sur les liens de la navbar
 * À appeler après chaque navigation Swup
 */
export const initNavbarCurrentState = (): void => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav_menu_link');

  // Home = aucun lien current
  if (currentPath === '/') {
    navLinks.forEach((link) => link.classList.remove('w--current'));
    return;
  }

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Enlève w--current de tous les liens
    link.classList.remove('w--current');

    // Compare les chemins
    const linkPath = new URL(href, window.location.origin).pathname;

    // Skip le lien home
    if (linkPath === '/') return;

    // Autres pages : match exact ou préfixe pour les pages CMS
    const isExactMatch = currentPath === linkPath;
    const isPrefixMatch = currentPath.startsWith(linkPath) && linkPath.endsWith('/');

    if (isExactMatch || isPrefixMatch) {
      link.classList.add('w--current');
    }
  });
};

/**
 * Initialize
 */
export const initNavbar = (): void => {
  if (!isDesktop()) return;

  elements = getElements();
  if (!elements) return;

  setInitialState();
  mainTimeline = buildTimeline();

  elements.component.addEventListener('mouseenter', () => {
    if (isDesktop()) openNavbar();
  });

  elements.component.addEventListener('mouseleave', () => {
    if (isDesktop()) closeNavbar();
  });

  // Resize handling
  let wasDesktop = isDesktop();
  window.addEventListener('resize', () => {
    const nowDesktop = isDesktop();
    if (nowDesktop !== wasDesktop) {
      wasDesktop = nowDesktop;
      if (nowDesktop) {
        elements = getElements();
        if (elements) {
          setInitialState();
          mainTimeline = buildTimeline();
        }
      } else {
        mainTimeline?.kill();
        if (elements) {
          elements.component.classList.remove('is-open');
          gsap.set(
            [
              elements.container,
              ...elements.titleTexts,
              ...elements.linkWrappers,
              ...elements.menuSections,
              ...elements.linkIcons,
              elements.iconOpen,
              elements.iconClose,
            ].filter(Boolean),
            { clearProps: 'all' }
          );
        }
      }
    }
  });
};
