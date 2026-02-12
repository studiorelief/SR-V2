import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Store ScrollTrigger instances for cleanup
let ctaScrollTriggers: ScrollTrigger[] = [];

/*
 *============================================================================
 * CTA TEXT - PAGE MAPPING
 *============================================================================
 */

// Mapping des chemins vers les textes - facilement extensible
const pageTextMap: Record<string, string> = {
  '/expertises': 'Expertises',
  '/offres': 'Offres',
  '/portfolio': 'Portfolio',
  '/portfolio/*': 'Projet',
  '/blog': 'Blog',
};

// Texte par défaut si la page n'est pas dans le mapping
const defaultText = '';

// Pages où animateCtaTextEnter ne s'affiche pas
const excludedPagesForCtaText: string[] = ['/'];

/*
 *============================================================================
 * CTA TEXT - HOVER MESSAGES
 *============================================================================
 */

// Messages génériques (affichés sur toutes les pages)
const genericHoverMessages: string[] = [
  'Prêt à faire le grand saut ?',
  'On y va ?',
  'Je vous écoute !',
];

// Messages spécifiques par page (combinés avec les génériques)
const pageHoverMessages: Record<string, string[]> = {
  '/': ["Let's go !", "C'est parti !"],
  '/expertises': ["Besoin d'aide ?", 'On reste encordé !'],
  '/portfolio': [],
  '/blog': [],
};

/**
 * Retourne les messages de hover pour la page actuelle (génériques + spécifiques)
 */
const getHoverMessagesForCurrentPage = (): string[] => {
  const path = window.location.pathname;
  const pageMessages = pageHoverMessages[path] ?? [];
  return [...genericHoverMessages, ...pageMessages];
};

// Track le dernier message affiché (pour éviter les répétitions)
let lastHoverMessageIndex: number | null = null;

// Track si un texte interactif (hover ou trigger) est actuellement affiché
let isInteractiveTextActive = false;

// Track le scroll pour bloquer le hover pendant le momentum scroll
let isScrolling = false;
let scrollEndTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Retourne le texte correspondant au chemin actuel
 * Supporte les wildcards: '/portfolio/*' matche '/portfolio/jockiz'
 */
const getTextForCurrentPage = (): string => {
  const path = window.location.pathname;

  // Vérifier d'abord les correspondances exactes
  if (pageTextMap[path]) {
    return pageTextMap[path];
  }

  // Vérifier les patterns avec wildcard (*)
  for (const [pattern, text] of Object.entries(pageTextMap)) {
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2); // Enlève '/*'
      if (path.startsWith(basePath + '/')) {
        return text;
      }
    }
  }

  return defaultText;
};

/*
 *============================================================================
 * CTA TEXT - ANIMATIONS
 *============================================================================
 */

// Durée d'affichage avant auto-hide (en secondes)
const CTA_TEXT_DISPLAY_DURATION = 2;

// Store le delayedCall pour pouvoir le kill
let ctaTextDelayedCall: gsap.core.Tween | null = null;

/**
 * Animation de sortie du texte CTA (retour vers la droite)
 * FadeOut + translateX vers la droite
 */
const hideCtaText = (): void => {
  const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
  if (!textWrapper) return;

  gsap.fromTo(
    textWrapper,
    { x: '0rem', opacity: 1 },
    {
      x: '3rem',
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
    }
  );
};

/**
 * Kill toutes les animations du texte CTA en cours
 */
const killCtaTextAnimations = (): void => {
  if (ctaTextDelayedCall) {
    ctaTextDelayedCall.kill();
    ctaTextDelayedCall = null;
  }
  const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
  if (textWrapper) {
    gsap.killTweensOf(textWrapper);
    // Position de départ pour la prochaine animation d'entrée
    gsap.set(textWrapper, { x: '3rem', opacity: 0 });
  }
};

/**
 * Retourne un message de hover aléatoire (jamais deux fois le même)
 */
const getRandomHoverMessage = (): string => {
  const messages = getHoverMessagesForCurrentPage();
  let index: number;
  do {
    index = Math.floor(Math.random() * messages.length);
  } while (index === lastHoverMessageIndex && messages.length > 1);

  lastHoverMessageIndex = index;
  return messages[index];
};

/**
 * Affiche un message de hover avec animation
 */
const showHoverText = (): void => {
  const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
  const textElement = document.querySelector<HTMLElement>('[cta-fixed="text"]');
  const illustrationWrapper = document.querySelector<HTMLElement>(
    '[cta-fixed="illustration-wrapper"]'
  );

  if (!textWrapper || !textElement) return;

  // Bloquer le hover pendant le scroll (évite le flicker)
  if (isScrolling) return;

  isInteractiveTextActive = true;

  // Kill les animations en cours (page text)
  killCtaTextAnimations();

  // Changer le texte pour un message aléatoire
  textElement.textContent = getRandomHoverMessage();

  // Animation d'entrée du texte
  gsap.to(textWrapper, {
    x: '0rem',
    opacity: 1,
    duration: 0.4,
    ease: 'back.out(1.7)',
  });

  // Scale down de l'illustration
  if (illustrationWrapper) {
    gsap.to(illustrationWrapper, {
      scale: 0.9,
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

/**
 * Cache le message de hover avec animation
 */
const hideHoverText = (): void => {
  const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
  const illustrationWrapper = document.querySelector<HTMLElement>(
    '[cta-fixed="illustration-wrapper"]'
  );

  if (!textWrapper) return;

  isInteractiveTextActive = false;

  // Animation de sortie du texte
  gsap.to(textWrapper, {
    x: '3rem',
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
  });

  // Scale up de l'illustration (retour à 1)
  if (illustrationWrapper) {
    gsap.to(illustrationWrapper, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

/**
 * Animation de sortie du texte CTA (Leave transition)
 * Kill les animations en cours et reset la position
 */
export const animateCtaTextLeave = (): Promise<void> => {
  return new Promise((resolve) => {
    // Kill tout d'abord
    killCtaTextAnimations();
    resolve();
  });
};

/**
 * Animation d'entrée du texte CTA (Enter transition)
 * Met à jour le texte puis FadeIn + translateX depuis la droite
 * Disparaît automatiquement après 2 secondes
 */
export const animateCtaTextEnter = (): Promise<void> => {
  return new Promise((resolve) => {
    const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
    const textElement = document.querySelector<HTMLElement>('[cta-fixed="text"]');

    // Skip animation sur les pages exclues (et cacher le wrapper)
    if (excludedPagesForCtaText.includes(window.location.pathname)) {
      if (textWrapper) {
        gsap.set(textWrapper, { x: '3rem', opacity: 0 });
      }
      resolve();
      return;
    }

    if (!textWrapper) {
      resolve();
      return;
    }

    // Mettre à jour le texte selon la page
    const newText = getTextForCurrentPage();
    if (textElement) {
      textElement.textContent = newText;
    }

    // Position de départ (à droite, invisible)
    gsap.set(textWrapper, { x: '3rem', opacity: 0 });

    // Animation d'entrée
    gsap.to(textWrapper, {
      x: '0rem',
      opacity: 1,
      duration: 0.6,
      ease: 'back.out(1.7)',
      onComplete: () => {
        resolve();
        // Auto-hide après 2 secondes (stocké pour pouvoir kill)
        ctaTextDelayedCall = gsap.delayedCall(CTA_TEXT_DISPLAY_DURATION, hideCtaText);
      },
    });
  });
};

/**
 * Initialise le texte CTA au premier chargement de page
 * Définit le texte et l'affiche avec animation
 * Disparaît automatiquement après 2 secondes
 */
export const initCtaText = (): void => {
  const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
  const textElement = document.querySelector<HTMLElement>('[cta-fixed="text"]');

  if (!textWrapper || !textElement) return;

  // Skip animation sur les pages exclues (et cacher le wrapper)
  if (excludedPagesForCtaText.includes(window.location.pathname)) {
    gsap.set(textWrapper, { x: '3rem', opacity: 0 });
    return;
  }

  // Définir le texte selon la page actuelle
  textElement.textContent = getTextForCurrentPage();

  // Animation d'entrée initiale
  gsap.set(textWrapper, { x: '3rem', opacity: 0 });
  gsap.to(textWrapper, {
    x: '0rem',
    opacity: 1,
    duration: 0.6,
    delay: 0.5,
    ease: 'back.out(1.7)',
    onComplete: () => {
      // Auto-hide après 2 secondes (stocké pour pouvoir kill)
      ctaTextDelayedCall = gsap.delayedCall(CTA_TEXT_DISPLAY_DURATION, hideCtaText);
    },
  });
};

/*
 *============================================================================
 * CTA FIXED - SCROLL TRIGGER LOGIC
 *============================================================================
 */

// Délai avant de cacher ctaFixed quand mascotte-hero est visible
// = durée affichage texte (2s) + durée hide (0.4s) + 1s extra
const CTA_HERO_HIDE_DELAY = CTA_TEXT_DISPLAY_DURATION + 0.4 + 1;

// Store le delayedCall pour mascotte-hero
let ctaHeroDelayedCall: gsap.core.Tween | null = null;
// Track si le délai hero a déjà été exécuté (pour passer en mode immédiat après)
let heroDelayFired = false;

const killCtaFixed = (): void => {
  ctaScrollTriggers.forEach((trigger) => trigger.kill());
  ctaScrollTriggers = [];
  if (ctaHeroDelayedCall) {
    ctaHeroDelayedCall.kill();
    ctaHeroDelayedCall = null;
  }
  heroDelayFired = false;
};

// Animate CTA visibility
const showCta = (ctaFixed: HTMLElement): void => {
  gsap.to(ctaFixed, {
    scale: 1,
    opacity: 1,
    duration: 0.3,
    ease: 'power2.inOut',
  });
};

const hideCta = (ctaFixed: HTMLElement): void => {
  gsap.to(ctaFixed, {
    scale: 0,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.inOut',
  });
};

// Store hover listeners pour cleanup
let hoverEnterHandler: (() => void) | null = null;
let hoverLeaveHandler: (() => void) | null = null;
let scrollHandler: (() => void) | null = null;

// Store trigger listeners pour cleanup
let triggerListeners: Array<{ el: HTMLElement; enter: () => void; leave: () => void }> = [];

/**
 * Affiche un texte custom depuis un élément trigger
 */
const showTriggerText = (text: string): void => {
  const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
  const textElement = document.querySelector<HTMLElement>('[cta-fixed="text"]');
  const illustrationWrapper = document.querySelector<HTMLElement>(
    '[cta-fixed="illustration-wrapper"]'
  );

  if (!textWrapper || !textElement) return;

  // Bloquer pendant le scroll (évite le flicker)
  if (isScrolling) return;

  isInteractiveTextActive = true;

  // Kill les animations en cours
  killCtaTextAnimations();

  // Définir le texte custom
  textElement.textContent = text;

  // Animation d'entrée du texte
  gsap.to(textWrapper, {
    x: '0rem',
    opacity: 1,
    duration: 0.4,
    ease: 'back.out(1.7)',
  });

  // Scale down de l'illustration
  if (illustrationWrapper) {
    gsap.to(illustrationWrapper, {
      scale: 0.9,
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

/**
 * Cache le texte trigger avec animation
 */
const hideTriggerText = (): void => {
  const textWrapper = document.querySelector<HTMLElement>('[cta-fixed="text-wrapper"]');
  const illustrationWrapper = document.querySelector<HTMLElement>(
    '[cta-fixed="illustration-wrapper"]'
  );

  if (!textWrapper) return;

  isInteractiveTextActive = false;

  // Animation de sortie du texte
  gsap.to(textWrapper, {
    x: '3rem',
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
  });

  // Scale up de l'illustration (retour à 1)
  if (illustrationWrapper) {
    gsap.to(illustrationWrapper, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

/**
 * Initialise les listeners pour les éléments avec cta-fixed-trigger
 */
const initTriggerListeners = (): void => {
  // Cleanup previous listeners
  triggerListeners.forEach(({ el, enter, leave }) => {
    el.removeEventListener('mouseenter', enter);
    el.removeEventListener('mouseleave', leave);
  });
  triggerListeners = [];

  // Setup new listeners
  const triggerElements = document.querySelectorAll<HTMLElement>('[cta-fixed-trigger]');
  triggerElements.forEach((el) => {
    const text = el.getAttribute('cta-fixed-trigger');
    if (!text) return;

    const enter = () => showTriggerText(text);
    const leave = () => hideTriggerText();

    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);

    triggerListeners.push({ el, enter, leave });
  });
};

export const initCtaFixed = (): void => {
  killCtaFixed();

  const ctaFixed = document.querySelector<HTMLElement>('.cta-fixed_component');
  const mascotteElements = document.querySelectorAll<HTMLElement>('[asset="mascotte"]');
  const mascotteHeroElements = document.querySelectorAll<HTMLElement>('[asset="mascotte-hero"]');

  if (!ctaFixed) return;

  // Remove previous hover listeners if any
  if (hoverEnterHandler) {
    ctaFixed.removeEventListener('mouseenter', hoverEnterHandler);
  }
  if (hoverLeaveHandler) {
    ctaFixed.removeEventListener('mouseleave', hoverLeaveHandler);
  }
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
  }

  // Setup hover listeners
  hoverEnterHandler = showHoverText;
  hoverLeaveHandler = hideHoverText;
  ctaFixed.addEventListener('mouseenter', hoverEnterHandler);
  ctaFixed.addEventListener('mouseleave', hoverLeaveHandler);

  // Hide texte interactif (hover + trigger) on scroll + bloquer mouseenter pendant le momentum
  scrollHandler = () => {
    isScrolling = true;
    if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
    scrollEndTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
    if (isInteractiveTextActive) {
      isInteractiveTextActive = false;
      hideHoverText();
    }
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });

  // Setup trigger listeners pour éléments avec cta-fixed-trigger
  initTriggerListeners();

  // Track active triggers (mascotte in viewport) - effet immédiat
  const activeSet = new Set<ScrollTrigger>();
  // Track active hero triggers - effet avec délai
  const activeHeroSet = new Set<ScrollTrigger>();

  // Function to update CTA based on active triggers
  const updateCta = (): void => {
    // Si mascotte normale visible → hide immédiat
    if (activeSet.size > 0) {
      if (ctaHeroDelayedCall) {
        ctaHeroDelayedCall.kill();
        ctaHeroDelayedCall = null;
      }
      hideCta(ctaFixed);
    }
    // Si mascotte-hero visible
    else if (activeHeroSet.size > 0) {
      // Si le délai a déjà été exécuté → hide immédiat (comme mascotte normale)
      if (heroDelayFired) {
        hideCta(ctaFixed);
      }
      // Première fois → hide avec délai
      else if (!ctaHeroDelayedCall) {
        ctaHeroDelayedCall = gsap.delayedCall(CTA_HERO_HIDE_DELAY, () => {
          hideCta(ctaFixed);
          ctaHeroDelayedCall = null;
          heroDelayFired = true; // Marquer comme exécuté
        });
      }
    }
    // Rien de visible → show
    else {
      if (ctaHeroDelayedCall) {
        ctaHeroDelayedCall.kill();
        ctaHeroDelayedCall = null;
      }
      showCta(ctaFixed);
    }
  };

  // Create ScrollTriggers pour mascotte (effet immédiat)
  mascotteElements.forEach((mascotte) => {
    const trigger = ScrollTrigger.create({
      trigger: mascotte,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) {
          activeSet.add(self);
        } else {
          activeSet.delete(self);
        }
        updateCta();
      },
    });

    ctaScrollTriggers.push(trigger);
  });

  // Create ScrollTriggers pour mascotte-hero (effet avec délai)
  mascotteHeroElements.forEach((mascotte) => {
    const trigger = ScrollTrigger.create({
      trigger: mascotte,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) {
          activeHeroSet.add(self);
        } else {
          activeHeroSet.delete(self);
        }
        updateCta();
      },
    });

    ctaScrollTriggers.push(trigger);
  });

  // Si aucun élément mascotte, montrer le CTA
  if (mascotteElements.length === 0 && mascotteHeroElements.length === 0) {
    showCta(ctaFixed);
    return;
  }

  // Check initial state after triggers are created
  requestAnimationFrame(() => {
    ctaScrollTriggers.forEach((trigger) => {
      const el = trigger.trigger as HTMLElement;
      if (trigger.isActive) {
        if (el?.getAttribute('asset') === 'mascotte-hero') {
          activeHeroSet.add(trigger);
        } else {
          activeSet.add(trigger);
        }
      }
    });

    // Set initial state
    if (activeSet.size > 0) {
      // Mascotte normale visible → hide immédiat
      gsap.set(ctaFixed, { scale: 0, opacity: 0 });
    } else if (activeHeroSet.size > 0) {
      // Mascotte-hero visible → show maintenant, hide après délai
      gsap.set(ctaFixed, { scale: 1, opacity: 1 });
      ctaHeroDelayedCall = gsap.delayedCall(CTA_HERO_HIDE_DELAY, () => {
        hideCta(ctaFixed);
        ctaHeroDelayedCall = null;
        heroDelayFired = true; // Marquer comme exécuté
      });
    } else {
      gsap.set(ctaFixed, { scale: 1, opacity: 1 });
    }
  });
};
