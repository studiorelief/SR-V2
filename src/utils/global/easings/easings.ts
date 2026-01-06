/**
 * Centralized easing functions for GSAP animations
 *
 * Usage:
 * import { EASINGS } from '$utils/global/easings';
 *
 * gsap.to(element, {
 *   x: 100,
 *   ease: EASINGS.backOut
 * });
 */

export const EASINGS = {
  // Back easing - creates overshoot/bounce effect
  backOut: 'back.out(1.7)',
  backIn: 'back.in(1.7)',
  backInOut: 'back.inOut(1.7)',

  // Power easing - smooth acceleration/deceleration
  power2Out: 'power2.out',
  power2In: 'power2.in',
  power2InOut: 'power2.inOut',

  // Elastic easing - spring-like effect
  elasticOut: 'elastic.out(1, 0.3)',
  elasticIn: 'elastic.in(1, 0.3)',

  // Bounce easing
  bounceOut: 'bounce.out',
  bounceIn: 'bounce.in',

  // Custom cubic-bezier
  customBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // None - linear
  none: 'none',
} as const;

export type EasingKey = keyof typeof EASINGS;
