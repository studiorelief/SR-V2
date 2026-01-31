import gsap from 'gsap';

/**
 * Navbar Animation Controller
 * Desktop: GSAP timeline + CSS pour hovers
 * Mobile: Click/tap interactions pour menu sections
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  desktop: {
    duration: 0.4,
    durationClose: 0.3,
    ease: 'power3.out',
    openWidth: '12.5rem',
    slideY: '0.5rem',
    slideX: '-0.5rem',
    mediaQueryHover: '(min-width: 992px)', // Hover only on PC
    mediaQueryClick: '(min-width: 480px) and (max-width: 991px)', // Click on tablet
    mediaQuery: '(min-width: 480px)', // Desktop + Tablet (>= 480px)
  },
  mobile: {
    duration: 0.3,
    ease: 'power3.out',
    siblingOpacity: 0.5,
    mediaQuery: '(max-width: 479px)',
    startYPercent: -85,
    finalYPercent: -100,
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// STATE
// ============================================================================

let elements: NavbarElements | null = null;
let mainTimeline: gsap.core.Timeline | null = null;

// Mobile state
let mobileCleanup: (() => void) | null = null;
let activeMobileSection: HTMLElement | null = null;

// ============================================================================
// HELPERS
// ============================================================================

const isDesktop = (): boolean => window.matchMedia(CONFIG.desktop.mediaQuery).matches;
const isDesktopHover = (): boolean => window.matchMedia(CONFIG.desktop.mediaQueryHover).matches;
const isTablet = (): boolean => window.matchMedia(CONFIG.desktop.mediaQueryClick).matches;
const isMobile = (): boolean => window.matchMedia(CONFIG.mobile.mediaQuery).matches;

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

// ============================================================================
// DESKTOP NAVBAR
// ============================================================================

/**
 * Build the main desktop timeline
 */
const buildDesktopTimeline = (): gsap.core.Timeline => {
  if (!elements) return gsap.timeline();

  const { desktop } = CONFIG;

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: desktop.ease },
    onStart: () => {
      elements!.component.classList.add('is-open');
      gsap.set(elements!.titleTexts, { display: 'flex' });
      gsap.set(elements!.linkWrappers, { display: 'flex' });
      if (elements!.iconOpen) gsap.set(elements!.iconOpen, { display: 'flex' });
    },
    onReverseComplete: () => {
      elements!.component.classList.remove('is-open');
      gsap.set(elements!.titleTexts, {
        display: 'none',
        opacity: 0,
        y: desktop.slideY,
        clearProps: 'paddingBottom',
      });
      gsap.set(elements!.linkWrappers, { display: 'none', opacity: 0, x: desktop.slideX });
      gsap.set(elements!.linkWrappersMulti, { marginTop: 0 });
      if (elements!.iconOpen) gsap.set(elements!.iconOpen, { display: 'none', opacity: 0 });
      if (elements!.iconClose) gsap.set(elements!.iconClose, { opacity: 1 });
    },
  });

  // Container width
  tl.to(elements.container, { width: desktop.openWidth, duration: desktop.duration }, 0);

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
        duration: desktop.duration,
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
        duration: desktop.duration,
      },
      0
    );
  }

  // Icon crossfade
  if (elements.iconClose) {
    tl.to(elements.iconClose, { opacity: 0, duration: 0.25 }, 0);
  }
  if (elements.iconOpen) {
    tl.to(elements.iconOpen, { opacity: 1, duration: 0.3 }, 0.05);
  }

  // Title texts - fade in + slide up
  if (elements.titleTexts.length > 0) {
    tl.set(elements.titleTexts, { paddingBottom: 'var(--_layout---spacing--medium)' }, 0);
    tl.fromTo(
      elements.titleTexts,
      { opacity: 0, y: desktop.slideY },
      { opacity: 1, y: 0, duration: desktop.duration * 0.7, ease: 'power2.out', stagger: 0.03 },
      0.05
    );
  }

  // Link wrappers - fade in + slide
  if (elements.linkWrappers.length > 0) {
    tl.fromTo(
      elements.linkWrappers,
      { opacity: 0, x: desktop.slideX },
      { opacity: 1, x: 0, duration: desktop.duration * 0.6, stagger: 0.02 },
      0.1
    );
  }

  // Multi wrappers margin
  if (elements.linkWrappersMulti.length > 0) {
    tl.to(
      elements.linkWrappersMulti,
      { marginTop: 'var(--_layout---spacing--small)', duration: desktop.duration * 0.5 },
      0.1
    );
  }

  return tl;
};

/**
 * Set initial desktop state
 */
const setDesktopInitialState = (): void => {
  if (!elements) return;

  const { desktop } = CONFIG;

  elements.component.classList.remove('is-open');
  gsap.set(elements.titleTexts, { display: 'none', opacity: 0, y: desktop.slideY });
  gsap.set(elements.linkWrappers, { display: 'none', opacity: 0, x: desktop.slideX });
  gsap.set(elements.linkWrappersMulti, { marginTop: 0 });

  if (elements.iconOpen) {
    gsap.set(elements.iconOpen, { display: 'none', opacity: 0 });
  }
  if (elements.iconClose) {
    gsap.set(elements.iconClose, { opacity: 1 });
  }
};

const openNavbar = (): void => {
  if (!mainTimeline) return;
  mainTimeline.timeScale(1);
  mainTimeline.play();
};

const closeNavbar = (): void => {
  if (!mainTimeline) return;
  const { desktop } = CONFIG;
  mainTimeline.timeScale(desktop.duration / desktop.durationClose);
  mainTimeline.reverse();
};

// Track navbar open state for click toggle
let isNavbarOpen = false;

/**
 * Toggle navbar (for tablet click)
 */
const toggleNavbar = (): void => {
  if (isNavbarOpen) {
    closeNavbar();
    isNavbarOpen = false;
  } else {
    openNavbar();
    isNavbarOpen = true;
  }
};

/**
 * Initialize desktop/tablet navbar
 * PC (>= 992px): hover events
 * Tablet (480-991px): click events
 */
export const initNavbar = (): void => {
  if (!isDesktop()) return;

  elements = getElements();
  if (!elements) return;

  setDesktopInitialState();
  mainTimeline = buildDesktopTimeline();
  isNavbarOpen = false;

  // PC: hover events
  const handleMouseEnter = (): void => {
    if (isDesktopHover()) {
      openNavbar();
      isNavbarOpen = true;
    }
  };

  const handleMouseLeave = (): void => {
    if (isDesktopHover()) {
      closeNavbar();
      isNavbarOpen = false;
    }
  };

  // Tablet: click event
  const handleClick = (): void => {
    if (isTablet()) {
      toggleNavbar();
    }
  };

  elements.component.addEventListener('mouseenter', handleMouseEnter);
  elements.component.addEventListener('mouseleave', handleMouseLeave);
  elements.component.addEventListener('click', handleClick);

  // Tablet: close on click outside .nav_container
  const handleClickOutside = (e: MouseEvent): void => {
    if (!isTablet() || !isNavbarOpen) return;

    const target = e.target as HTMLElement;
    const container = document.querySelector('.nav_container');

    if (container && !container.contains(target)) {
      closeNavbar();
      isNavbarOpen = false;
    }
  };

  document.addEventListener('click', handleClickOutside);

  // Resize handling
  let wasDesktop = isDesktop();
  window.addEventListener('resize', () => {
    const nowDesktop = isDesktop();
    if (nowDesktop !== wasDesktop) {
      wasDesktop = nowDesktop;
      if (nowDesktop) {
        elements = getElements();
        if (elements) {
          setDesktopInitialState();
          mainTimeline = buildDesktopTimeline();
          isNavbarOpen = false;
        }
      } else {
        mainTimeline?.kill();
        isNavbarOpen = false;
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

// ============================================================================
// MOBILE NAVBAR
// ============================================================================

/**
 * Open a mobile section - show .is-multi children and dim siblings
 */
const openMobileSection = (section: HTMLElement, allSections: HTMLElement[]): void => {
  const { mobile } = CONFIG;

  // Get .is-multi wrappers inside this section
  const multiWrappers = section.querySelectorAll<HTMLElement>('.nav_menu_link-wrapper.is-multi');

  // Animate .is-multi wrappers in (fade + slide up)
  if (multiWrappers.length > 0) {
    gsap.set(multiWrappers, { display: 'flex' });
    gsap.fromTo(
      multiWrappers,
      { opacity: 0, yPercent: mobile.startYPercent },
      {
        opacity: 1,
        yPercent: mobile.finalYPercent,
        duration: mobile.duration,
        ease: mobile.ease,
        stagger: 0.05,
      }
    );
  }

  // Dim sibling sections
  const siblings = allSections.filter((s) => s !== section);
  if (siblings.length > 0) {
    gsap.to(siblings, {
      opacity: mobile.siblingOpacity,
      duration: mobile.duration,
      ease: mobile.ease,
    });
  }

  // Mark as active
  section.classList.add('is-active');
  activeMobileSection = section;
};

/**
 * Close a mobile section - hide .is-multi children and restore siblings
 */
const closeMobileSection = (section: HTMLElement, allSections: HTMLElement[]): void => {
  const { mobile } = CONFIG;

  // Get .is-multi wrappers inside this section
  const multiWrappers = section.querySelectorAll<HTMLElement>('.nav_menu_link-wrapper.is-multi');

  // Animate .is-multi wrappers out (fade + slide down)
  if (multiWrappers.length > 0) {
    gsap.to(multiWrappers, {
      opacity: 0,
      yPercent: mobile.startYPercent,
      duration: mobile.duration * 0.7,
      ease: mobile.ease,
      onComplete: () => {
        gsap.set(multiWrappers, { display: 'none' });
      },
    });
  }

  // Restore sibling sections
  const siblings = allSections.filter((s) => s !== section);
  if (siblings.length > 0) {
    gsap.to(siblings, {
      opacity: 1,
      duration: mobile.duration,
      ease: mobile.ease,
    });
  }

  // Remove active state
  section.classList.remove('is-active');
  activeMobileSection = null;
};

/**
 * Toggle mobile section
 */
const toggleMobileSection = (section: HTMLElement, allSections: HTMLElement[]): void => {
  // If this section is already active, close it
  if (activeMobileSection === section) {
    closeMobileSection(section, allSections);
    return;
  }

  // If another section is active, close it first
  if (activeMobileSection) {
    closeMobileSection(activeMobileSection, allSections);
  }

  // Open the clicked section
  openMobileSection(section, allSections);
};

/**
 * Set initial mobile state
 */
const setMobileInitialState = (): void => {
  const component = document.querySelector<HTMLElement>('.nav_component');
  if (!component) return;

  // Hide all .is-multi wrappers
  const multiWrappers = component.querySelectorAll<HTMLElement>('.nav_menu_link-wrapper.is-multi');
  gsap.set(multiWrappers, { display: 'none', opacity: 0, yPercent: CONFIG.mobile.startYPercent });

  // Reset all sections
  const sections = component.querySelectorAll<HTMLElement>('.nav_menu-section');
  sections.forEach((section) => {
    section.classList.remove('is-active');
    gsap.set(section, { opacity: 1 });
  });

  activeMobileSection = null;
};

/**
 * Initialize mobile navbar
 */
export const initNavbarMobile = (): void => {
  if (!isMobile()) return;

  // Cleanup previous instance
  if (mobileCleanup) {
    mobileCleanup();
    mobileCleanup = null;
  }

  const component = document.querySelector<HTMLElement>('.nav_component');
  if (!component) return;

  const menuSections = [...component.querySelectorAll<HTMLElement>('.nav_menu-section')];
  if (menuSections.length === 0) return;

  setMobileInitialState();

  // Event handlers storage for cleanup
  const handlers: Array<{ element: HTMLElement; handler: () => void }> = [];

  menuSections.forEach((section) => {
    // Check if section has .is-multi children
    const hasMulti = section.querySelector('.nav_menu_link-wrapper.is-multi');
    if (!hasMulti) return;

    const handler = (): void => {
      if (isMobile()) {
        toggleMobileSection(section, menuSections);
      }
    };

    section.addEventListener('click', handler);
    handlers.push({ element: section, handler });
  });

  // Mobile: close on click outside .nav_container
  const handleClickOutside = (e: MouseEvent): void => {
    if (!isMobile() || !activeMobileSection) return;

    const target = e.target as HTMLElement;
    const container = document.querySelector('.nav_container');

    if (container && !container.contains(target)) {
      closeMobileSection(activeMobileSection, menuSections);
    }
  };

  document.addEventListener('click', handleClickOutside);

  // Cleanup function
  mobileCleanup = () => {
    handlers.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    document.removeEventListener('click', handleClickOutside);

    // Reset states
    if (activeMobileSection) {
      closeMobileSection(activeMobileSection, menuSections);
    }
    setMobileInitialState();
  };

  // Resize handling
  const resizeHandler = (): void => {
    if (!isMobile() && mobileCleanup) {
      mobileCleanup();
      mobileCleanup = null;
    }
  };

  window.addEventListener('resize', resizeHandler);
};

// ============================================================================
// HIGHLIGHT FUNCTIONS
// ============================================================================

/**
 * Navbar Highlight - Animations between highlights
 * PC (>= 480px): target [highlight="${targetHighlight}"]
 * Mobile (<= 479px): target [highlight-mobile="${targetHighlight}"]
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

    // Get target based on screen size (both use "nav-xxx" values)
    const getTarget = (): { element: HTMLElement | null; svg: HTMLElement | null } => {
      const selector = isMobile()
        ? `[highlight-mobile="${targetHighlight}"]`
        : `[highlight="${targetHighlight}"]`;
      const element = document.querySelector<HTMLElement>(selector);
      return {
        element,
        svg: element?.querySelector<HTMLElement>('.svg-component') || null,
      };
    };

    sourceElements.forEach((sourceEl) => {
      sourceEl.addEventListener('mouseenter', () => {
        const { element, svg } = getTarget();
        if (!element) return;

        gsap.to(element, {
          backgroundColor: 'var(--_theme---background--accent-orange)',
        });

        if (svg) {
          gsap.to(svg, {
            rotation: 7.5,
            scale: 1.15,
            duration: 0.3,
            ease: 'back.out(1.2)',
            transformOrigin: 'center center',
            force3D: true,
          });
        }
      });

      sourceEl.addEventListener('mouseleave', () => {
        const { element, svg } = getTarget();
        if (!element) return;

        gsap.to(element, {
          backgroundColor: '',
        });

        if (svg) {
          gsap.to(svg, {
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
 * PC (>= 480px): target [highlight="nav-xxx"]
 * Mobile (<= 479px): target [highlight-mobile="nav-xxx"]
 */
export const initInnerHighlight = (): void => {
  const currentUrl = window.location.pathname;

  // Map paths to highlight values (same values for desktop and mobile)
  const pathToHighlightMap: Record<string, string> = {
    '/blog/': 'nav-ressources',
    '/labs/': 'nav-ressources',
    '/stack/': 'nav-ressources',
    '/formation/': 'nav-ressources',
    '/portfolio/': 'nav-portfolio',
  };

  const allHighlights = [...new Set(Object.values(pathToHighlightMap))];

  // Clear all highlights (both desktop and mobile use same values)
  allHighlights.forEach((highlight) => {
    const selector = isMobile()
      ? `[highlight-mobile="${highlight}"]`
      : `[highlight="${highlight}"]`;
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      gsap.set(element, {
        backgroundColor: '',
        clearProps: 'backgroundColor',
      });
    }
  });

  // Find matching path and apply highlight
  const matchingPath = Object.keys(pathToHighlightMap).find((path) => currentUrl.includes(path));

  if (matchingPath) {
    const highlight = pathToHighlightMap[matchingPath];
    const selector = isMobile()
      ? `[highlight-mobile="${highlight}"]`
      : `[highlight="${highlight}"]`;
    const targetElement = document.querySelector<HTMLElement>(selector);

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

  if (currentPath === '/') {
    navLinks.forEach((link) => link.classList.remove('w--current'));
    return;
  }

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    link.classList.remove('w--current');

    const linkPath = new URL(href, window.location.origin).pathname;

    if (linkPath === '/') return;

    const isExactMatch = currentPath === linkPath;
    const isPrefixMatch = currentPath.startsWith(linkPath) && linkPath.endsWith('/');

    if (isExactMatch || isPrefixMatch) {
      link.classList.add('w--current');
    }
  });
};
