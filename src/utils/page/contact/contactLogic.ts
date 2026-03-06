/*
 *==========================================
 * CONTACT FORM - LOGIC
 * ↳ Summary section reacts to radio selection
 *==========================================
 */

import gsap from 'gsap';

import { getUploadedFiles } from '$utils/page/contact/contactFileUpload';

const STARTER_ID = 'starter';
const SUR_MESURE_ID = 'sur-mesure';

interface OffreConfig {
  color: string;
  background: string;
  text: string;
}

const OFFRE_STARTER: OffreConfig = {
  color: 'var(--_theme---text-color--primary)',
  background: 'var(--_theme---background--accent-orange)',
  text: 'Offre Starter',
};

const OFFRE_SUR_MESURE: OffreConfig = {
  color: 'var(--_theme---text-color--primary)',
  background: 'var(--_theme---background--accent-purple)',
  text: 'Offre Sur-mesure',
};

const STARTER_BUDGET_VALUE = '4 000 €';
const SUR_MESURE_BUDGET_VALUE = '5 000 - 10 000€';

// Sur-mesure preset values for step 2 selects
const SUR_MESURE_PRESETS: Record<string, string> = {
  projet: 'Créer',
  produit: 'Marketing',
  page: '5 - 10 pages',
  deadline: '1 - 3 mois',
};

// Sur-mesure preset for step 3 checkboxes
const SUR_MESURE_CHECKBOXES: Record<string, boolean> = {
  branding: true,
  webdesign: true,
  fondation: true,
  fonctionnalite: true,
  accompagnement: true,
  performance: false,
};

// Starter preset values for step 2 selects
const STARTER_PRESETS: Record<string, string> = {
  projet: 'Créer',
  produit: 'Marketing',
  page: '1 - 5 pages',
  deadline: '< 1 mois',
};

// Starter preset for step 3 checkboxes
const STARTER_CHECKBOXES: Record<string, boolean> = {
  branding: true,
  webdesign: true,
  fondation: true,
  fonctionnalite: true,
  accompagnement: true,
  performance: false,
};

let starterRadio: HTMLInputElement | null = null;
let surMesureRadio: HTMLInputElement | null = null;

// Store initial values to restore when nothing is checked
let initialOffreWrapperShimmer: string | null = null;
let initialOffreText = '';
let starterBudgetOption: HTMLOptionElement | null = null;

function getElements() {
  const offreWrapper = document.querySelector<HTMLElement>('[summary="offre-wrapper"]');
  const mainWrapper = document.querySelector<HTMLElement>('[summary="main-wrapper"]');
  const bullets = document.querySelectorAll<HTMLElement>('[summary="bullet"]');
  const offreText = document.querySelector<HTMLElement>('[summary="offre-text"]');
  return { offreWrapper, mainWrapper, bullets, offreText };
}

function saveInitialState(): void {
  const { offreWrapper, offreText } = getElements();

  if (offreWrapper) {
    initialOffreWrapperShimmer = offreWrapper.getAttribute('shimmer-loader');
  }
  if (offreText) {
    initialOffreText = offreText.textContent ?? '';
  }
}

function applyConfig(config: OffreConfig): void {
  const { offreWrapper, mainWrapper, bullets, offreText } = getElements();

  if (offreWrapper) {
    offreWrapper.style.setProperty('color', config.color, 'important');
    offreWrapper.style.setProperty('background', config.background, 'important');
    offreWrapper.removeAttribute('shimmer-loader');
  }
  if (mainWrapper) {
    mainWrapper.style.setProperty('background', config.background, 'important');
  }
  bullets.forEach((bullet) => {
    bullet.style.setProperty('background-color', config.background, 'important');
  });
  if (offreText) {
    animateTextRoulette(offreText, config.text);
  }
}

function animateTextRoulette(el: HTMLElement, newText: string): void {
  if (el.textContent === newText) return;

  const parent = el.parentElement;
  if (!parent) {
    el.textContent = newText;
    return;
  }

  // Ensure parent clips the overflow for the slide effect
  parent.style.overflow = 'hidden';

  // Slide current text up and out
  gsap.to(el, {
    yPercent: -100,
    opacity: 0,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: () => {
      el.textContent = newText;
      // Position new text below, then slide up into view
      gsap.fromTo(
        el,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    },
  });
}

function resetToInitial(): void {
  const { offreWrapper, mainWrapper, bullets, offreText } = getElements();

  if (offreWrapper) {
    offreWrapper.style.removeProperty('color');
    offreWrapper.style.removeProperty('background');
    if (initialOffreWrapperShimmer !== null) {
      offreWrapper.setAttribute('shimmer-loader', initialOffreWrapperShimmer);
    }
  }
  if (mainWrapper) {
    mainWrapper.style.removeProperty('background');
  }
  bullets.forEach((bullet) => {
    bullet.style.removeProperty('background-color');
  });
  if (offreText) {
    animateTextRoulette(offreText, initialOffreText);
  }
}

function setBudgetValue(value: string): void {
  const budgetSelect = document.querySelector<HTMLSelectElement>('#budget');
  if (!budgetSelect) return;
  budgetSelect.value = value;
  budgetSelect.dispatchEvent(new Event('input', { bubbles: true }));
}

function addStarterBudget(): void {
  const budgetSelect = document.querySelector<HTMLSelectElement>('#budget');
  if (!budgetSelect) return;

  // Only create the option once
  if (!starterBudgetOption) {
    starterBudgetOption = document.createElement('option');
    starterBudgetOption.value = STARTER_BUDGET_VALUE;
    starterBudgetOption.textContent = STARTER_BUDGET_VALUE;
  }

  // Insert the option and select it
  budgetSelect.appendChild(starterBudgetOption);
  budgetSelect.value = STARTER_BUDGET_VALUE;
  budgetSelect.dispatchEvent(new Event('input', { bubbles: true }));
}

function applyPresets(selects: Record<string, string>, checkboxes: Record<string, boolean>): void {
  for (const [id, value] of Object.entries(selects)) {
    const select = document.querySelector<HTMLSelectElement>(`#${id}`);
    if (!select) continue;
    select.value = value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
  }

  for (const [id, checked] of Object.entries(checkboxes)) {
    const cb = document.querySelector<HTMLInputElement>(`#${id}`);
    if (!cb) continue;
    cb.checked = checked;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Default checkboxes when no offre is selected
const DEFAULT_CHECKBOXES: Record<string, boolean> = {
  branding: true,
  webdesign: true,
  fondation: true,
  fonctionnalite: true,
  accompagnement: true,
  performance: false,
};

function resetPresets(): void {
  const allSelectIds = new Set([
    ...Object.keys(STARTER_PRESETS),
    ...Object.keys(SUR_MESURE_PRESETS),
  ]);
  for (const id of allSelectIds) {
    const select = document.querySelector<HTMLSelectElement>(`#${id}`);
    if (!select) continue;
    select.value = '';
    select.dispatchEvent(new Event('input', { bubbles: true }));
  }

  for (const [id, checked] of Object.entries(DEFAULT_CHECKBOXES)) {
    const cb = document.querySelector<HTMLInputElement>(`#${id}`);
    if (!cb) continue;
    cb.checked = checked;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function removeStarterBudget(): void {
  const budgetSelect = document.querySelector<HTMLSelectElement>('#budget');
  if (!budgetSelect || !starterBudgetOption) return;

  // If the starter option is currently selected, reset to default
  if (budgetSelect.value === STARTER_BUDGET_VALUE) {
    starterBudgetOption.remove();
    budgetSelect.value = '';
    budgetSelect.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    starterBudgetOption.remove();
  }
}

/*
 *==========================================
 * SUMMARY FIELDS SYNC
 * ↳ Step 2 selects → summary text
 * ↳ Step 3 checkboxes → service badges
 *==========================================
 */

const SUMMARY_FIELDS = ['projet', 'produit', 'page', 'deadline', 'budget'] as const;

const SERVICE_LABELS: Record<string, string> = {
  branding: 'Branding',
  webdesign: 'Webdesign',
  fondation: 'Fondation',
  fonctionnalite: 'Fonctionnalité',
  accompagnement: 'Accompagnement',
  performance: 'Performance',
};

let serviceItemTemplate: HTMLElement | null = null;
let serviceContainer: HTMLElement | null = null;
let fieldListeners: Array<{ el: HTMLElement; handler: () => void }> = [];
let progressListeners: Array<{ el: HTMLElement; handler: () => void }> = [];

function syncSummaryField(fieldId: string): void {
  const input = document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${fieldId}`);
  const summary = document.querySelector<HTMLElement>(`[summary="${fieldId}"]`);
  if (!input || !summary) return;
  const newValue = input.value || '';
  if (summary.textContent !== newValue) {
    // Skip animation if field is still in loading state (not visible yet)
    if (summary.classList.contains('is-loading')) {
      summary.textContent = newValue;
    } else {
      animateTextRoulette(summary, newValue);
    }
  }
}

function syncAllSummaryFields(): void {
  for (const id of SUMMARY_FIELDS) {
    syncSummaryField(id);
  }
}

function getCloneId(clone: HTMLElement): string {
  return clone.getAttribute('data-service-id') || '';
}

function animateContainerHeight(container: HTMLElement, callback: () => void): void {
  const startHeight = container.offsetHeight;
  callback();

  // Let DOM settle, then measure new height
  requestAnimationFrame(() => {
    const endHeight = container.offsetHeight;
    if (startHeight === endHeight) return;

    container.style.overflow = 'hidden';
    gsap.fromTo(
      container,
      { height: startHeight },
      {
        height: endHeight,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => {
          container.style.height = '';
          container.style.overflow = '';
        },
      }
    );
  });
}

function syncServiceItems(): void {
  if (!serviceItemTemplate || !serviceContainer) return;

  const steps = document.querySelectorAll<HTMLElement>('[data-form="step"]');
  const isStep3Visible = steps[2] && steps[2].style.display !== 'none';

  // Get checked IDs
  const checkedIds = new Set<string>();
  document
    .querySelectorAll<HTMLInputElement>('[step-3="checkbox"]:checked')
    .forEach((cb) => checkedIds.add(cb.id));

  // Map existing clones by their service ID
  const existingClones = new Map<string, HTMLElement>();
  serviceContainer
    .querySelectorAll<HTMLElement>('[summary="service-item"]:not([data-template])')
    .forEach((clone) => existingClones.set(getCloneId(clone), clone));

  // Get the wrapper for smooth height animation
  const wrapper = serviceContainer.closest<HTMLElement>('.contact-form_cards-services-w');

  const doSync = () => {
    // FLIP: capture "First" positions of items that will stay
    const stayingItems: Array<{ el: HTMLElement; rect: DOMRect }> = [];
    existingClones.forEach((clone, id) => {
      if (checkedIds.has(id)) {
        stayingItems.push({ el: clone, rect: clone.getBoundingClientRect() });
      }
    });

    // Remove items no longer checked
    existingClones.forEach((clone, id) => {
      if (checkedIds.has(id)) return;
      if (isStep3Visible) {
        // Pull item out of flow at its current position
        const rect = clone.getBoundingClientRect();
        const parentRect = clone.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
        clone.style.position = 'absolute';
        clone.style.left = `${rect.left - parentRect.left}px`;
        clone.style.top = `${rect.top - parentRect.top}px`;
        clone.style.width = `${rect.width}px`;

        gsap.to(clone, {
          opacity: 0,
          scale: 0.8,
          duration: 0.25,
          ease: 'power1.out',
          onComplete: () => clone.remove(),
        });
      } else {
        clone.remove();
      }
    });

    // Add new items
    checkedIds.forEach((id) => {
      if (existingClones.has(id)) return;

      const clone = serviceItemTemplate!.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-template');
      clone.setAttribute('data-service-id', id);
      clone.style.display = '';

      if (isStep3Visible) {
        clone.classList.remove('is-loading');
      }

      const textEl = clone.querySelector<HTMLElement>('[summary="service-text"]');
      const label = SERVICE_LABELS[id] || id;
      if (textEl) {
        textEl.textContent = label;
      } else {
        clone.textContent = label;
      }

      serviceContainer!.appendChild(clone);

      if (isStep3Visible) {
        gsap.fromTo(
          clone,
          { width: 0, opacity: 0, overflow: 'hidden' },
          {
            width: 'auto',
            opacity: 1,
            duration: 0.3,
            ease: 'power1.out',
            onComplete: () => {
              clone.style.overflow = '';
            },
          }
        );
      }
    });

    // FLIP: animate staying items from old to new positions
    if (isStep3Visible) {
      stayingItems.forEach(({ el, rect: oldRect }) => {
        const newRect = el.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (dx !== 0 || dy !== 0) {
          gsap.fromTo(el, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.3, ease: 'power1.out' });
        }
      });
    }
  };

  // Animate container height if visible, otherwise just sync
  if (isStep3Visible && wrapper) {
    animateContainerHeight(wrapper, doSync);
  } else {
    doSync();
  }
}

function bindSummaryListeners(): void {
  // Bind change/input on step 2 fields
  for (const id of SUMMARY_FIELDS) {
    const input = document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`);
    if (!input) continue;

    const handler = () => syncSummaryField(id);
    input.addEventListener('change', handler);
    input.addEventListener('input', handler);
    fieldListeners.push({ el: input, handler });
  }

  // Bind change on step 3 checkboxes
  const step3Checkboxes = document.querySelectorAll<HTMLInputElement>('[step-3="checkbox"]');
  step3Checkboxes.forEach((cb) => {
    const handler = () => syncServiceItems();
    cb.addEventListener('change', handler);
    fieldListeners.push({ el: cb, handler });
  });

  // Save template for service items
  const templateItem = document.querySelector<HTMLElement>('[summary="service-item"]');
  if (templateItem) {
    serviceContainer = templateItem.parentElement;
    serviceItemTemplate = templateItem;
    serviceItemTemplate.setAttribute('data-template', '');
    serviceItemTemplate.classList.add('is-loading');
    serviceItemTemplate.style.display = 'none';
  }
}

function unbindSummaryListeners(): void {
  for (const { el, handler } of fieldListeners) {
    el.removeEventListener('change', handler);
    el.removeEventListener('input', handler);
  }
  fieldListeners = [];
  serviceItemTemplate = null;
  serviceContainer = null;
}

/*
 *==========================================
 * STEP 4 - SUMMARY FIELDS SYNC
 * ↳ Personal info fields → summary text
 * ↳ File uploads → summary files
 * ↳ Cards visibility based on input state
 *==========================================
 */

const STEP4_FIELD_MAP: Record<string, string> = {
  prenom: 'prenom',
  nom: 'nom',
  entreprise: 'entreprise',
  telephone: 'telephone',
  email: 'email',
  description: 'description',
};

let step4Listeners: Array<{ el: HTMLElement; handler: () => void }> = [];
let fileObserver: MutationObserver | null = null;

function updateCardsWrapperEmpty(): void {
  document
    .querySelectorAll<HTMLElement>('.contact-form_cards-c-w, .cards-line_component')
    .forEach((wrapper) => {
      const hasVisibleCard = wrapper.querySelector<HTMLElement>(
        '.contact-form_cards-c:not([style*="display: none"])'
      );
      wrapper.classList.toggle('is-empty', !hasVisibleCard);
    });
}

function syncStep4Field(inputId: string, summaryAttr: string): void {
  const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${inputId}`);
  const summary = document.querySelector<HTMLElement>(`[summary="${summaryAttr}"]`);
  if (!summary) return;

  const value = input?.value || '';
  summary.textContent = value;

  // Show/hide parent .contact-form_cards-c based on input value
  const card = summary.closest<HTMLElement>('.contact-form_cards-c');
  if (card) {
    const wasHidden = card.style.display === 'none';
    const globalWrapper = document.querySelector<HTMLElement>('.contact-form_cards');

    const applyChange = () => {
      if (value.trim()) {
        card.style.display = 'flex';
        if (wasHidden) {
          gsap.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
        }
      } else {
        card.style.display = 'none';
      }
      updateCardsWrapperEmpty();
    };

    // Animate global wrapper height if visibility changes
    if ((wasHidden && value.trim()) || (!wasHidden && !value.trim())) {
      if (globalWrapper) {
        animateContainerHeight(globalWrapper, applyChange);
      } else {
        applyChange();
      }
    } else {
      applyChange();
    }
  } else {
    updateCardsWrapperEmpty();
  }
  validateStep4Submit();
}

function syncStep4Files(): void {
  const summary = document.querySelector<HTMLElement>('[summary="files"]');
  if (!summary) return;

  const files = getUploadedFiles();
  summary.textContent = files.map((f) => f.name).join(', ');

  const card = summary.closest<HTMLElement>('.contact-form_cards-c');
  if (card) {
    const wasHidden = card.style.display === 'none';
    const globalWrapper = document.querySelector<HTMLElement>('.contact-form_cards');

    const applyChange = () => {
      if (files.length > 0) {
        card.style.display = 'flex';
        if (wasHidden) {
          gsap.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
        }
      } else {
        card.style.display = 'none';
      }
      updateCardsWrapperEmpty();
    };

    if ((wasHidden && files.length > 0) || (!wasHidden && files.length === 0)) {
      if (globalWrapper) {
        animateContainerHeight(globalWrapper, applyChange);
      } else {
        applyChange();
      }
    } else {
      applyChange();
    }
  } else {
    updateCardsWrapperEmpty();
  }
}

function syncAllStep4Fields(): void {
  for (const [inputId, summaryAttr] of Object.entries(STEP4_FIELD_MAP)) {
    syncStep4Field(inputId, summaryAttr);
  }
  syncStep4Files();
}

function bindStep4Listeners(): void {
  for (const [inputId, summaryAttr] of Object.entries(STEP4_FIELD_MAP)) {
    const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${inputId}`);
    if (!input) continue;

    const handler = () => syncStep4Field(inputId, summaryAttr);
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
    step4Listeners.push({ el: input, handler });
  }

  // Observe file list changes to sync summary=files
  const fileListParent = document.querySelector<HTMLElement>('.form_field-wrapper:has(.is-upload)');
  if (fileListParent) {
    fileObserver = new MutationObserver(() => syncStep4Files());
    fileObserver.observe(fileListParent, { childList: true, subtree: true });
  }
}

function unbindStep4Listeners(): void {
  for (const { el, handler } of step4Listeners) {
    el.removeEventListener('input', handler);
    el.removeEventListener('change', handler);
  }
  step4Listeners = [];
  if (fileObserver) {
    fileObserver.disconnect();
    fileObserver = null;
  }
}

/*
 *==========================================
 * STEP NAVIGATION SKIP
 * ↳ Starter → skip to step 4
 * ↳ Sur-mesure → normal flow (step 2)
 *==========================================
 */

let currentStepIndex = 0;

let step1NextBtn: HTMLElement | null = null;
let step2BackBtn: HTMLElement | null = null;
let step2NextBtn: HTMLElement | null = null;
let step3BackBtn: HTMLElement | null = null;
let step3NextBtn: HTMLElement | null = null;
let step4BackBtn: HTMLElement | null = null;

const LOADING_FIELDS = ['projet', 'produit', 'page', 'deadline', 'budget'] as const;

function revealSummaryFields(animate = true): void {
  LOADING_FIELDS.forEach((id) => {
    const el = document.querySelector<HTMLElement>(`[summary="${id}"]`);
    if (!el) return;
    el.classList.remove('is-loading');
    if (animate) {
      gsap.fromTo(
        el,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.05 }
      );
    }
  });
}

function hideSummaryFields(): void {
  LOADING_FIELDS.forEach((id) => {
    const el = document.querySelector<HTMLElement>(`[summary="${id}"]`);
    if (!el) return;
    el.classList.add('is-loading');
    gsap.set(el, { clearProps: 'all' });
  });
}

function revealServiceItems(animate = true): void {
  document
    .querySelectorAll<HTMLElement>('[summary="service-item"]:not([data-template])')
    .forEach((el) => {
      el.classList.remove('is-loading');
      if (animate) {
        gsap.fromTo(
          el,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.05 }
        );
      }
    });
}

function hideServiceItems(): void {
  document
    .querySelectorAll<HTMLElement>('[summary="service-item"]:not([data-template])')
    .forEach((el) => {
      el.classList.add('is-loading');
      gsap.set(el, { clearProps: 'all' });
    });
}

/**
 * Apply the correct loading/reveal state for a given step index.
 * Step 0 (1): fields loading, services loading, last cards hidden
 * Step 1 (2): fields revealed, services loading, last cards hidden
 * Step 2 (3): fields revealed, services revealed, last cards hidden
 * Step 3 (4): fields revealed, services revealed, last cards visible
 */
function applyStepState(stepIndex: number): void {
  const isForward = stepIndex > currentStepIndex;

  if (stepIndex >= 1) {
    revealSummaryFields(isForward && stepIndex === 1);
  } else {
    hideSummaryFields();
  }

  if (stepIndex >= 2) {
    revealServiceItems(isForward && stepIndex === 2);
  } else {
    hideServiceItems();
  }

  if (stepIndex >= 3) {
    showLastCards();
  } else {
    hideLastCards();
  }

  currentStepIndex = stepIndex;
}

const LAST_CARDS_SELECTORS = '.cards-line_component.is-last, .contact-form_cards-line.is-last';

function showLastCards(): void {
  const globalWrapper = document.querySelector<HTMLElement>('.contact-form_cards');
  const doShow = () => {
    document.querySelectorAll<HTMLElement>(LAST_CARDS_SELECTORS).forEach((el) => {
      el.style.display = 'flex';
      gsap.fromTo(
        el,
        { opacity: 0, yPercent: 20 },
        { opacity: 1, yPercent: 0, duration: 0.35, ease: 'power2.out' }
      );
    });
  };
  if (globalWrapper) {
    animateContainerHeight(globalWrapper, doShow);
  } else {
    doShow();
  }
}

function hideLastCards(): void {
  const globalWrapper = document.querySelector<HTMLElement>('.contact-form_cards');
  const doHide = () => {
    document.querySelectorAll<HTMLElement>(LAST_CARDS_SELECTORS).forEach((el) => {
      gsap.killTweensOf(el);
      el.style.display = 'none';
      gsap.set(el, { clearProps: 'opacity,yPercent' });
    });
  };
  if (globalWrapper) {
    animateContainerHeight(globalWrapper, doHide);
  } else {
    doHide();
  }
}

function validateStep4Submit(): void {
  const submitBtn = document.querySelector<HTMLElement>('[data-form="submit-btn"]');
  if (!submitBtn) return;

  const steps = document.querySelectorAll<HTMLElement>('[data-form="step"]');
  const step4 = steps[3];
  if (!step4 || step4.style.display === 'none') return;

  const requiredFields = step4.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input[required], textarea[required], select[required]'
  );
  const allFilled = Array.from(requiredFields).every((f) => f.value.trim() !== '');

  submitBtn.classList.toggle('disabled', !allFilled);
  submitBtn.style.pointerEvents = allFilled ? '' : 'none';
  submitBtn.style.opacity = allFilled ? '' : '0.5';
}

function goToStep(stepIndex: number): void {
  const steps = document.querySelectorAll<HTMLElement>('[data-form="step"]');
  const progressItems = document.querySelectorAll<HTMLElement>(
    '[data-form="custom-progress-indicator"]'
  );

  steps.forEach((step, i) => {
    step.style.display = i === stepIndex ? '' : 'none';
  });

  progressItems.forEach((item, i) => {
    item.classList.toggle('current', i === stepIndex);
    if (i === stepIndex) {
      item.classList.remove('disabled');
    }
  });

  // Show submit button & hide next button on last step
  const isLastStep = stepIndex === steps.length - 1;
  const submitBtn = document.querySelector<HTMLElement>('[data-form="submit-btn"]');
  const nextBtns = document.querySelectorAll<HTMLElement>('[data-form="next-btn"]');

  if (submitBtn) {
    submitBtn.style.display = isLastStep ? '' : 'none';
  }
  nextBtns.forEach((btn) => {
    btn.style.display = isLastStep ? 'none' : '';
  });

  // Animate new step elements
  const targetStep = steps[stepIndex];
  if (targetStep) {
    const targets = targetStep.querySelectorAll<HTMLElement>('[step-form]');
    targets.forEach((el) => {
      gsap.fromTo(
        el,
        { xPercent: -50, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1, ease: 'power2.out' }
      );
    });
  }
}

function handleStep1Next(e: Event): void {
  if (!starterRadio?.checked) return;

  // Starter: skip steps 2 & 3, go directly to step 4 (index 3)
  e.preventDefault();
  e.stopImmediatePropagation();
  goToStep(3);
  applyStepState(3);
  validateStep4Submit();
}

function handleRadioChange(): void {
  if (starterRadio?.checked) {
    applyConfig(OFFRE_STARTER);
    addStarterBudget();
    applyPresets(STARTER_PRESETS, STARTER_CHECKBOXES);
  } else if (surMesureRadio?.checked) {
    applyConfig(OFFRE_SUR_MESURE);
    removeStarterBudget();
    applyPresets(SUR_MESURE_PRESETS, SUR_MESURE_CHECKBOXES);
    setBudgetValue(SUR_MESURE_BUDGET_VALUE);
  } else {
    resetToInitial();
    removeStarterBudget();
    resetPresets();
  }
}

export function initContactLogic(): void {
  starterRadio = document.querySelector<HTMLInputElement>(`#${STARTER_ID}`);
  surMesureRadio = document.querySelector<HTMLInputElement>(`#${SUR_MESURE_ID}`);

  if (!starterRadio || !surMesureRadio) return;

  saveInitialState();

  starterRadio.addEventListener('change', handleRadioChange);
  surMesureRadio.addEventListener('change', handleRadioChange);

  // Bind summary sync listeners
  bindSummaryListeners();
  syncAllSummaryFields();
  syncServiceItems();

  // Bind step 4 personal info sync
  bindStep4Listeners();
  syncAllStep4Fields();

  // Hide last cards initially (only visible in step 4)
  hideLastCards();

  // Bind skip logic on the next button of step 1
  const steps = document.querySelectorAll<HTMLElement>('[data-form="step"]');
  if (steps[0]) {
    step1NextBtn = steps[0].querySelector<HTMLElement>('[data-form="next-btn"]');
    step1NextBtn?.addEventListener('click', handleStep1Next, true);
    step1NextBtn?.addEventListener('click', () => applyStepState(1));
  }
  if (steps[1]) {
    step2BackBtn = steps[1].querySelector<HTMLElement>('[data-form="back-btn"]');
    step2BackBtn?.addEventListener('click', () => applyStepState(0));
    step2NextBtn = steps[1].querySelector<HTMLElement>('[data-form="next-btn"]');
    step2NextBtn?.addEventListener('click', () => applyStepState(2));
  }
  if (steps[2]) {
    step3BackBtn = steps[2].querySelector<HTMLElement>('[data-form="back-btn"]');
    step3BackBtn?.addEventListener('click', () => applyStepState(1));
    step3NextBtn = steps[2].querySelector<HTMLElement>('[data-form="next-btn"]');
    step3NextBtn?.addEventListener('click', () => applyStepState(3));
  }
  if (steps[3]) {
    step4BackBtn = steps[3].querySelector<HTMLElement>('[data-form="back-btn"]');
    step4BackBtn?.addEventListener('click', () => applyStepState(2));
  }

  // Bind progress indicators to apply correct state per step
  const progressIndicators = document.querySelectorAll<HTMLElement>(
    '[data-form="custom-progress-indicator"]'
  );
  progressIndicators.forEach((indicator, i) => {
    const handler = () => applyStepState(i);
    indicator.addEventListener('click', handler);
    progressListeners.push({ el: indicator, handler });
  });

  // Apply state in case a radio is already checked on load
  handleRadioChange();

  // Ensure all service items have .is-loading after presets are applied (step 1)
  document.querySelectorAll<HTMLElement>('[summary="service-item"]').forEach((el) => {
    el.classList.add('is-loading');
  });
}

export function destroyContactLogic(): void {
  starterRadio?.removeEventListener('change', handleRadioChange);
  surMesureRadio?.removeEventListener('change', handleRadioChange);
  step1NextBtn?.removeEventListener('click', handleStep1Next, true);

  // Unbind progress indicator listeners
  for (const { el, handler } of progressListeners) {
    el.removeEventListener('click', handler);
  }
  progressListeners = [];

  step2BackBtn = null;
  step2NextBtn = null;
  step3BackBtn = null;
  step3NextBtn = null;
  step4BackBtn = null;
  unbindSummaryListeners();
  unbindStep4Listeners();
  starterRadio = null;
  surMesureRadio = null;
  step1NextBtn = null;
}
