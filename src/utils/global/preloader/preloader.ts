/**
 * ============================================================================
 * PRELOADER - Studio Relief
 * ============================================================================
 *
 * Preloader qui s'affiche uniquement lors de la première visite de session.
 * Utilise sessionStorage pour tracker si l'utilisateur a déjà vu le preloader.
 *
 * Éléments Webflow requis :
 * - preloader="component" : wrapper principal
 * - preloader="logo" : logo du studio
 * - #lottie-preloader : canvas pour l'animation Lottie
 * - preloader="loading-count" : texte affichant le % de chargement
 * - preloader="loading-line" : ligne de progression visuelle
 */

import { DotLottie } from '@lottiefiles/dotlottie-web';
import gsap from 'gsap';

// Clé sessionStorage pour tracker la visite
const PRELOADER_SHOWN_KEY = 'sr-preloader-shown';

// Instance Lottie pour pouvoir la détruire
let preloaderLottie: DotLottie | null = null;

// État du chargement
let loadProgress = 0;
let isLoadComplete = false;
let preloaderStartTime = 0;
const MINIMUM_PRELOADER_DURATION = 3000; // 3 secondes minimum

// Flag pour savoir si on est sur la home (utilise le Lottie hero)
let isHomePage = false;

// Référence au wrapper du Lottie hero pour restaurer le z-index
let heroLottieWrapper: HTMLElement | null = null;
const HERO_LOTTIE_FINAL_ZINDEX = '11';

/**
 * Vérifie si le preloader doit être affiché
 * Retourne true si c'est la première visite de la session
 */
export const shouldShowPreloader = (): boolean => {
  const hasSeenPreloader = sessionStorage.getItem(PRELOADER_SHOWN_KEY);
  return !hasSeenPreloader;
};

/**
 * Marque le preloader comme déjà vu pour cette session
 */
const markPreloaderAsShown = (): void => {
  sessionStorage.setItem(PRELOADER_SHOWN_KEY, 'true');
};

/**
 * Initialise l'animation Lottie du preloader avec fade-in une fois chargé
 * Sur la home : utilise #lottie-home-hero (même Lottie que le hero)
 * Sur les autres pages : utilise #lottie-preloader
 */
const initPreloaderLottie = (): void => {
  // Vérifier si on est sur la home (présence du Lottie hero)
  const heroLottieCanvas = document.querySelector<HTMLCanvasElement>('#lottie-home-hero');

  if (heroLottieCanvas) {
    // HOME PAGE : Utiliser le Lottie du hero
    isHomePage = true;

    // Trouver le wrapper du Lottie hero pour gérer le z-index
    heroLottieWrapper = heroLottieCanvas.parentElement;

    if (heroLottieWrapper) {
      // Mettre le wrapper au premier plan (au-dessus du preloader background)
      // Ne pas toucher à position pour ne pas casser le layout
      heroLottieWrapper.style.zIndex = '10000';
    }

    // Cacher le canvas initialement pour le fade-in
    gsap.set(heroLottieCanvas, { opacity: 0 });

    // Initialiser le Lottie hero tôt
    const heroLottieUrl =
      heroLottieCanvas.dataset.lottieSrc ||
      'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/Assets/Studio%20Relief%20-%20V2/lottie_mascotte-home-hero.lottie';

    preloaderLottie = new DotLottie({
      autoplay: true,
      loop: true,
      canvas: heroLottieCanvas,
      src: heroLottieUrl,
    });

    // Fade-in une fois le Lottie chargé
    preloaderLottie.addEventListener('load', () => {
      gsap.to(heroLottieCanvas, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    // Marquer comme déjà initialisé pour que lottieFiles.ts ne le réinitialise pas
    heroLottieCanvas.setAttribute('data-preloader-initialized', 'true');

    return;
  }

  // AUTRES PAGES : Utiliser le Lottie du preloader
  isHomePage = false;
  const lottieCanvas = document.querySelector<HTMLCanvasElement>('#lottie-preloader');

  if (!lottieCanvas) return;

  // Cacher le canvas initialement pour le fade-in
  gsap.set(lottieCanvas, { opacity: 0 });

  const lottieUrl =
    lottieCanvas.dataset.lottieSrc ||
    'https://nsbivjygtwdtnijkvewq.supabase.co/storage/v1/object/public/Assets/Studio%20Relief%20-%20V2/lottie_mascotte-home-hero.lottie';

  preloaderLottie = new DotLottie({
    autoplay: true,
    loop: true,
    canvas: lottieCanvas,
    src: lottieUrl,
  });

  // Fade-in une fois le Lottie chargé
  preloaderLottie.addEventListener('load', () => {
    gsap.to(lottieCanvas, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  });
};

/**
 * Met à jour l'affichage du pourcentage de chargement
 */
const updateLoadingDisplay = (progress: number): void => {
  const countElement = document.querySelector<HTMLElement>('[preloader="loading-count"]');
  const lineElement = document.querySelector<HTMLElement>('[preloader="loading-line"]');

  if (countElement) {
    countElement.textContent = `${Math.round(progress)}%`;
  }

  if (lineElement) {
    gsap.to(lineElement, {
      width: `${progress}%`,
      duration: 0.3,
      ease: 'power2.out',
    });
  }
};

/**
 * Simule une progression de chargement fluide
 * La progression accélère au début puis ralentit vers la fin
 * Se complète uniquement quand window.load est déclenché
 */
const simulateProgress = (): void => {
  // Animation de progression qui va jusqu'à 90% max
  // Les derniers 10% sont réservés pour quand le load est vraiment terminé
  const progressTween = gsap.to(
    { value: 0 },
    {
      value: 90,
      duration: 2.5,
      ease: 'power2.out',
      onUpdate: function () {
        if (!isLoadComplete) {
          loadProgress = this.targets()[0].value;
          updateLoadingDisplay(loadProgress);
        }
      },
    }
  );

  // Fonction de complétion du chargement
  const completeLoading = (): void => {
    if (isLoadComplete) return; // Éviter double appel
    isLoadComplete = true;
    progressTween.kill();

    // Calculer le temps restant pour atteindre la durée minimum
    const elapsedTime = Date.now() - preloaderStartTime;
    const remainingTime = Math.max(0, MINIMUM_PRELOADER_DURATION - elapsedTime);

    // Durée de l'animation de 90% à 100% (ajustée selon le temps restant)
    const completionDuration = Math.max(0.5, remainingTime / 1000);

    // Compléter de la position actuelle à 100%
    gsap.to(
      { value: loadProgress },
      {
        value: 100,
        duration: completionDuration,
        ease: 'power2.out',
        onUpdate: function () {
          updateLoadingDisplay(this.targets()[0].value);
        },
        onComplete: () => {
          // Petit délai pour que l'utilisateur voie le 100%
          gsap.delayedCall(0.3, animatePreloaderOut);
        },
      }
    );
  };

  // Si la page est déjà chargée, compléter immédiatement
  // Sinon attendre l'événement load
  if (document.readyState === 'complete') {
    completeLoading();
  } else {
    window.addEventListener('load', completeLoading, { once: true });
  }
};

/**
 * Animation de sortie du preloader
 * Sur la home : le Lottie reste visible (c'est celui du hero)
 * Sur les autres pages : tout fade out
 */
const animatePreloaderOut = (): void => {
  const component = document.querySelector<HTMLElement>('[preloader="component"]');
  const background = document.querySelector<HTMLElement>('[preloader="background"]');
  const logo = document.querySelector<HTMLElement>('[preloader="logo"]');
  const countElement = document.querySelector<HTMLElement>('[preloader="loading-count"]');
  const lineElement = document.querySelector<HTMLElement>('[preloader="loading-line"]');

  if (!component) return;

  const tl = gsap.timeline({
    onComplete: () => {
      // Cacher complètement le preloader
      component.style.display = 'none';
      component.style.visibility = 'hidden';

      if (isHomePage) {
        // HOME : Mettre le z-index final du Lottie hero
        if (heroLottieWrapper) {
          heroLottieWrapper.style.zIndex = HERO_LOTTIE_FINAL_ZINDEX;
        }
        // Ne pas détruire le Lottie, il appartient au hero maintenant
        preloaderLottie = null;
      } else {
        // AUTRES PAGES : Détruire l'instance Lottie du preloader
        if (preloaderLottie) {
          preloaderLottie.destroy();
          preloaderLottie = null;
        }
      }

      // Marquer comme vu pour cette session
      markPreloaderAsShown();

      // Réactiver le scroll
      document.body.style.overflow = '';

      // Dispatch un event custom pour signaler la fin du preloader
      window.dispatchEvent(new CustomEvent('preloaderComplete'));
    },
  });

  // 1. Fade out des éléments de loading (count + line)
  tl.to(
    [countElement, lineElement],
    {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
    },
    0
  );

  // 2. Logo : scale de 1 à 0 + se déplace vers top-right du component
  if (logo) {
    tl.to(
      logo,
      {
        scale: 0,
        opacity: 0,
        xPercent: 100, // déplace vers la droite
        yPercent: -100, // déplace vers le haut
        y: '1.5rem', // décale de 2rem vers le haut en plus du yPercent
        x: '5rem', // décale de 2rem vers la droite en plus du xPercent
        duration: 0.5,
        ease: 'power2.in',
      },
      0.2
    );
  }

  // 3. Sur autres pages : fade out du Lottie preloader
  if (!isHomePage) {
    const preloaderLottieCanvas = document.querySelector<HTMLElement>('#lottie-preloader');
    if (preloaderLottieCanvas) {
      tl.to(
        preloaderLottieCanvas,
        {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
        },
        0.2
      );
    }
  }

  // 4. Fade out du background
  if (background) {
    tl.to(
      background,
      {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      },
      0.3
    );
  }

  // 5. Cacher le component (pour s'assurer qu'il est bien caché)
  tl.set(component, { autoAlpha: 0 });
};

/**
 * Initialise le preloader si c'est la première visite
 */
export const initPreloader = (): void => {
  const component = document.querySelector<HTMLElement>('[preloader="component"]');

  if (!component) return;

  // Si ce n'est pas la première visite, s'assurer que le preloader est caché
  if (!shouldShowPreloader()) {
    component.style.display = 'none';
    component.style.visibility = 'hidden';
    return;
  }

  // Première visite : afficher le preloader
  component.style.display = 'flex';
  component.style.visibility = 'visible';
  component.style.opacity = '1';

  // Enregistrer le temps de démarrage pour la durée minimum
  preloaderStartTime = Date.now();

  // Bloquer le scroll pendant le chargement
  document.body.style.overflow = 'hidden';

  // Initialiser l'affichage à 0%
  updateLoadingDisplay(0);

  // Initialiser la ligne de progression à 0%
  const lineElement = document.querySelector<HTMLElement>('[preloader="loading-line"]');
  if (lineElement) {
    gsap.set(lineElement, { width: '0%' });
  }

  // Initialiser le Lottie
  initPreloaderLottie();

  // Démarrer la simulation de progression
  simulateProgress();
};

/**
 * Détruit le preloader et nettoie les ressources
 */
export const destroyPreloader = (): void => {
  if (preloaderLottie) {
    preloaderLottie.destroy();
    preloaderLottie = null;
  }
};
