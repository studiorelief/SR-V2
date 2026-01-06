import './sticker.css';

import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

interface StickerOptions {
  rotate?: number;
  peelBackHoverPct?: number;
  peelBackActivePct?: number;
  peelEasing?: string;
  peelHoverEasing?: string;
  width?: number;
  shadowIntensity?: number;
  lightingIntensity?: number;
  initialPosition?: 'center' | 'random' | { x: number; y: number };
  peelDirection?: number;
}

interface StickerDOM {
  container: HTMLElement;
  dragTarget: HTMLElement;
  stickerContainer: HTMLElement;
  stickerMain: HTMLElement;
  stickerLighting: HTMLElement;
  stickerImage: HTMLImageElement;
  flap: HTMLElement;
  flapLighting: HTMLElement;
  flapImage: HTMLImageElement;
  pointLight: SVGFEPointLightElement;
  pointLightFlipped: SVGFEPointLightElement;
}

interface StickerFilterIds {
  pointLight: string;
  pointLightFlipped: string;
  dropShadow: string;
  expandAndFill: string;
  svg: SVGElement;
}

/**
 * Classe gérant l'effet de décollage d'autocollant (sticker peel)
 * Utilise GSAP pour les animations et le drag, avec des effets SVG pour l'éclairage
 */
export class StickerPeel {
  public readonly element: HTMLElement;
  private DOM!: StickerDOM;
  private draggableInstance: Draggable | null = null;
  private options: Required<StickerOptions>;
  private defaultPadding = 10;
  private filterIds: StickerFilterIds | null = null;

  // Event handlers stockés pour pouvoir les retirer
  private handleResize!: () => void;
  private handleOrientationChange!: () => void;
  private handleMouseMove!: (e: MouseEvent) => void;
  private handleTouchStart!: () => void;
  private handleTouchEnd!: () => void;

  constructor(element: HTMLElement, options: StickerOptions = {}) {
    this.element = element;
    this.options = {
      rotate: options.rotate ?? 30,
      peelBackHoverPct: options.peelBackHoverPct ?? 30,
      peelBackActivePct: options.peelBackActivePct ?? 40,
      peelEasing: options.peelEasing ?? 'power3.out',
      peelHoverEasing: options.peelHoverEasing ?? 'power2.out',
      width: options.width ?? 200,
      shadowIntensity: options.shadowIntensity ?? 0.6,
      lightingIntensity: options.lightingIntensity ?? 0.1,
      initialPosition: options.initialPosition ?? 'center',
      peelDirection: options.peelDirection ?? 0,
    };

    if (this.init()) {
      this.setupSVGFilters();
      this.setupInitialPosition();
      this.setupDraggable();
      this.setupLighting();
      this.setupTouchEvents();
      this.applyCSSVars();
    }
  }

  /**
   * Initialise les références DOM et crée la structure HTML nécessaire
   */
  private init(): boolean {
    // Récupère l'image source depuis l'élément
    const imageSrc =
      this.element.getAttribute('data-image-src') || this.element.querySelector('img')?.src || '';

    if (!imageSrc) {
      console.error(
        'StickerPeel: No image source found. Provide data-image-src attribute or an img element.'
      );
      return false;
    }

    // Crée la structure SVG pour les filtres
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const randomId = Math.random().toString(36).substr(2, 9);

    // Filtre pointLight
    const filterPointLight = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    const pointLightId = `pointLight-${randomId}`;
    filterPointLight.setAttribute('id', pointLightId);

    const blur1 = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur1.setAttribute('stdDeviation', '1');
    blur1.setAttribute('result', 'blur');

    const specLighting1 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'feSpecularLighting'
    );
    specLighting1.setAttribute('result', 'spec');
    specLighting1.setAttribute('in', 'blur');
    specLighting1.setAttribute('specularExponent', '100');
    specLighting1.setAttribute('specularConstant', String(this.options.lightingIntensity));
    specLighting1.setAttribute('lightingColor', 'white');

    const pointLight = document.createElementNS('http://www.w3.org/2000/svg', 'fePointLight');
    pointLight.setAttribute('x', '100');
    pointLight.setAttribute('y', '100');
    pointLight.setAttribute('z', '300');

    const composite1 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    composite1.setAttribute('in', 'spec');
    composite1.setAttribute('in2', 'SourceGraphic');
    composite1.setAttribute('result', 'lit');

    const composite2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    composite2.setAttribute('in', 'lit');
    composite2.setAttribute('in2', 'SourceAlpha');
    composite2.setAttribute('operator', 'in');

    specLighting1.appendChild(pointLight);
    filterPointLight.appendChild(blur1);
    filterPointLight.appendChild(specLighting1);
    filterPointLight.appendChild(composite1);
    filterPointLight.appendChild(composite2);

    // Filtre pointLightFlipped
    const filterPointLightFlipped = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'filter'
    );
    const pointLightFlippedId = `pointLightFlipped-${randomId}`;
    filterPointLightFlipped.setAttribute('id', pointLightFlippedId);

    const blur2 = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur2.setAttribute('stdDeviation', '10');
    blur2.setAttribute('result', 'blur');

    const specLighting2 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'feSpecularLighting'
    );
    specLighting2.setAttribute('result', 'spec');
    specLighting2.setAttribute('in', 'blur');
    specLighting2.setAttribute('specularExponent', '100');
    specLighting2.setAttribute('specularConstant', String(this.options.lightingIntensity * 7));
    specLighting2.setAttribute('lightingColor', 'white');

    const pointLightFlipped = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'fePointLight'
    );
    pointLightFlipped.setAttribute('x', '100');
    pointLightFlipped.setAttribute('y', '100');
    pointLightFlipped.setAttribute('z', '300');

    const composite3 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    composite3.setAttribute('in', 'spec');
    composite3.setAttribute('in2', 'SourceGraphic');
    composite3.setAttribute('result', 'lit');

    const composite4 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    composite4.setAttribute('in', 'lit');
    composite4.setAttribute('in2', 'SourceAlpha');
    composite4.setAttribute('operator', 'in');

    specLighting2.appendChild(pointLightFlipped);
    filterPointLightFlipped.appendChild(blur2);
    filterPointLightFlipped.appendChild(specLighting2);
    filterPointLightFlipped.appendChild(composite3);
    filterPointLightFlipped.appendChild(composite4);

    // Filtre dropShadow
    const filterDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    const dropShadowId = `dropShadow-${randomId}`;
    filterDropShadow.setAttribute('id', dropShadowId);

    const dropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    dropShadow.setAttribute('dx', '2');
    dropShadow.setAttribute('dy', '4');
    dropShadow.setAttribute('stdDeviation', String(3 * this.options.shadowIntensity));
    dropShadow.setAttribute('floodColor', 'black');
    dropShadow.setAttribute('floodOpacity', String(this.options.shadowIntensity));

    filterDropShadow.appendChild(dropShadow);

    // Filtre expandAndFill
    const filterExpandAndFill = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    const expandAndFillId = `expandAndFill-${randomId}`;
    filterExpandAndFill.setAttribute('id', expandAndFillId);

    const offset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
    offset.setAttribute('dx', '0');
    offset.setAttribute('dy', '0');
    offset.setAttribute('in', 'SourceAlpha');
    offset.setAttribute('result', 'shape');

    const flood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
    flood.setAttribute('floodColor', 'rgb(179,179,179)');
    flood.setAttribute('result', 'flood');

    const composite5 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    composite5.setAttribute('operator', 'in');
    composite5.setAttribute('in', 'flood');
    composite5.setAttribute('in2', 'shape');

    filterExpandAndFill.appendChild(offset);
    filterExpandAndFill.appendChild(flood);
    filterExpandAndFill.appendChild(composite5);

    defs.appendChild(filterPointLight);
    defs.appendChild(filterPointLightFlipped);
    defs.appendChild(filterDropShadow);
    defs.appendChild(filterExpandAndFill);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    // Stocke les IDs des filtres
    this.filterIds = {
      pointLight: pointLightId,
      pointLightFlipped: pointLightFlippedId,
      dropShadow: dropShadowId,
      expandAndFill: expandAndFillId,
      svg,
    };

    // Crée la structure HTML
    const dragTarget = document.createElement('div');
    dragTarget.className = 'sticker-draggable';

    const stickerContainer = document.createElement('div');
    stickerContainer.className = 'sticker-container';

    const stickerMain = document.createElement('div');
    stickerMain.className = 'sticker-main';

    const stickerLighting = document.createElement('div');
    stickerLighting.className = 'sticker-lighting';

    const stickerImage = document.createElement('img');
    stickerImage.src = imageSrc;
    stickerImage.className = 'sticker-image';
    stickerImage.draggable = false;
    stickerImage.addEventListener('contextmenu', (e) => e.preventDefault());

    const flap = document.createElement('div');
    flap.className = 'flap';

    const flapLighting = document.createElement('div');
    flapLighting.className = 'flap-lighting';
    flapLighting.style.filter = `url(#${pointLightFlippedId})`;

    const flapImage = document.createElement('img');
    flapImage.src = imageSrc;
    flapImage.className = 'flap-image';
    flapImage.draggable = false;
    flapImage.addEventListener('contextmenu', (e) => e.preventDefault());
    flapImage.style.filter = `url(#${expandAndFillId})`;

    // Assemble la structure
    stickerLighting.appendChild(stickerImage);
    stickerMain.appendChild(stickerLighting);
    flapLighting.appendChild(flapImage);
    flap.appendChild(flapLighting);
    stickerContainer.appendChild(stickerMain);
    stickerContainer.appendChild(flap);
    dragTarget.appendChild(stickerContainer);

    // Remplace le contenu de l'élément original
    this.element.innerHTML = '';
    this.element.appendChild(dragTarget);

    // Récupère les références aux éléments SVG depuis le DOM
    const pointLightElement = svg.querySelector(
      `#${pointLightId} fePointLight`
    ) as SVGFEPointLightElement;
    const pointLightFlippedElement = svg.querySelector(
      `#${pointLightFlippedId} fePointLight`
    ) as SVGFEPointLightElement;

    // Stocke les références
    this.DOM = {
      container: this.element,
      dragTarget,
      stickerContainer,
      stickerMain,
      stickerLighting,
      stickerImage,
      flap,
      flapLighting,
      flapImage,
      pointLight: pointLightElement,
      pointLightFlipped: pointLightFlippedElement,
    };

    return true;
  }

  /**
   * Configure les filtres SVG (déjà fait dans init, mais gardé pour compatibilité)
   */
  private setupSVGFilters(): void {
    // Les filtres sont créés dans init()
  }

  /**
   * Configure la position initiale du sticker
   */
  private setupInitialPosition(): void {
    const target = this.DOM.dragTarget;
    if (!target) return;

    let startX = 0;
    let startY = 0;

    if (this.options.initialPosition === 'center') {
      return;
    }

    if (typeof this.options.initialPosition === 'object') {
      startX = this.options.initialPosition.x;
      startY = this.options.initialPosition.y;
    } else if (this.options.initialPosition === 'random') {
      const boundsEl = target.parentElement || document.body;
      const boundsRect = boundsEl.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      startX = Math.random() * (boundsRect.width - targetRect.width);
      startY = Math.random() * (boundsRect.height - targetRect.height);
    }

    gsap.set(target, { x: startX, y: startY });
  }

  /**
   * Configure le drag avec GSAP Draggable
   */
  private setupDraggable(): void {
    const target = this.DOM.dragTarget;
    if (!target) return;

    // Même logique que dans global `draggable.ts`
    const existingInstance = Draggable.get(target);
    if (existingInstance) {
      existingInstance.enable();
      this.draggableInstance = existingInstance;
      return;
    }

    const [instance] = Draggable.create(target, {
      type: 'x,y',
      cursor: 'grab',
      activeCursor: 'grabbing',
    });

    this.draggableInstance = instance;
  }

  /**
   * Configure l'éclairage qui suit la souris
   */
  private setupLighting(): void {
    const container = this.DOM.stickerContainer;

    this.handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.DOM.pointLight) {
        gsap.set(this.DOM.pointLight, { attr: { x, y } });
      }

      const normalizedAngle = Math.abs(this.options.peelDirection % 360);
      if (this.DOM.pointLightFlipped) {
        if (normalizedAngle !== 180) {
          gsap.set(this.DOM.pointLightFlipped, {
            attr: { x, y: rect.height - y },
          });
        } else {
          gsap.set(this.DOM.pointLightFlipped, {
            attr: { x: -1000, y: -1000 },
          });
        }
      }
    };

    container.addEventListener('mousemove', this.handleMouseMove);
  }

  /**
   * Configure les événements tactiles
   */
  private setupTouchEvents(): void {
    const container = this.DOM.stickerContainer;

    this.handleTouchStart = () => {
      container.classList.add('touch-active');
    };

    this.handleTouchEnd = () => {
      container.classList.remove('touch-active');
    };

    container.addEventListener('touchstart', this.handleTouchStart);
    container.addEventListener('touchend', this.handleTouchEnd);
    container.addEventListener('touchcancel', this.handleTouchEnd);
  }

  /**
   * Applique les variables CSS personnalisées
   */
  private applyCSSVars(): void {
    const { dragTarget } = this.DOM;
    dragTarget.style.setProperty('--sticker-p', `${this.defaultPadding}px`);
    dragTarget.style.setProperty('--sticker-peelback-hover', `${this.options.peelBackHoverPct}%`);
    dragTarget.style.setProperty('--sticker-peelback-active', `${this.options.peelBackActivePct}%`);
    dragTarget.style.setProperty('--sticker-peel-easing', this.options.peelEasing);
    dragTarget.style.setProperty('--sticker-peel-hover-easing', this.options.peelHoverEasing);
    dragTarget.style.setProperty('--sticker-shadow-opacity', String(this.options.shadowIntensity));
    dragTarget.style.setProperty(
      '--sticker-lighting-constant',
      String(this.options.lightingIntensity)
    );
  }

  /**
   * Nettoie les event listeners et les instances
   */
  public destroy(): void {
    if (this.draggableInstance) {
      this.draggableInstance.kill();
      this.draggableInstance = null;
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);

    if (this.DOM.stickerContainer) {
      this.DOM.stickerContainer.removeEventListener('mousemove', this.handleMouseMove);
      this.DOM.stickerContainer.removeEventListener('touchstart', this.handleTouchStart);
      this.DOM.stickerContainer.removeEventListener('touchend', this.handleTouchEnd);
      this.DOM.stickerContainer.removeEventListener('touchcancel', this.handleTouchEnd);
    }

    // Nettoie les filtres SVG
    if (this.filterIds?.svg) {
      document.body.removeChild(this.filterIds.svg);
      this.filterIds = null;
    }

    gsap.killTweensOf(this.DOM.dragTarget);
  }
}

// Stockage des instances pour le nettoyage
const stickerInstances: StickerPeel[] = [];

/**
 * Initialise l'effet sticker peel sur tous les éléments avec trigger="sticker"
 */
export function initSticker(): StickerPeel[] {
  const stickerElements = document.querySelectorAll<HTMLElement>('[trigger="sticker"]');

  stickerElements.forEach((element) => {
    // Vérifie si l'élément a déjà une instance
    const existingInstance = stickerInstances.find((instance) => instance.element === element);
    if (existingInstance) {
      return;
    }

    // Vérifie que l'élément est bien dans le DOM
    if (!element.isConnected) {
      console.error('StickerPeel: Element is not connected to DOM', element);
      return;
    }

    // Récupère les options depuis les attributs data
    const { dataset } = element;
    const options: StickerOptions = {
      rotate: dataset.rotate ? parseFloat(dataset.rotate) : undefined,
      peelBackHoverPct: dataset.peelBackHoverPct ? parseFloat(dataset.peelBackHoverPct) : undefined,
      peelBackActivePct: dataset.peelBackActivePct
        ? parseFloat(dataset.peelBackActivePct)
        : undefined,
      peelEasing: dataset.peelEasing,
      peelHoverEasing: dataset.peelHoverEasing,
      width: dataset.width ? parseFloat(dataset.width) : undefined,
      shadowIntensity: dataset.shadowIntensity ? parseFloat(dataset.shadowIntensity) : undefined,
      lightingIntensity: dataset.lightingIntensity
        ? parseFloat(dataset.lightingIntensity)
        : undefined,
      peelDirection: dataset.peelDirection ? parseFloat(dataset.peelDirection) : undefined,
    };

    const instance = new StickerPeel(element, options);
    stickerInstances.push(instance);
  });

  return stickerInstances;
}

/**
 * Détruit toutes les instances de StickerPeel
 */
export function destroyAllStickers(): void {
  stickerInstances.forEach((instance) => instance.destroy());
  stickerInstances.length = 0;
}
