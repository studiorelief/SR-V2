import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type InitAllAnchorFillsOptions = {
  navRoot?: ParentNode; // ex: document.querySelector("nav")!
  linkSelector?: string; // ex: 'a.anchor'
  fillSelector?: string; // défaut: .anchor_background-scroll
  start?: string;
  end?: string;
  scrub?: boolean | number;
};

export function initAllAnchorFills({
  navRoot = document,
  linkSelector = 'a[href^="#"]',
  fillSelector = '.anchor_background-scroll',
  start = 'top top',
  end = 'bottom top',
  scrub = true,
}: InitAllAnchorFillsOptions = {}): ScrollTrigger[] {
  const links = Array.from(navRoot.querySelectorAll<HTMLAnchorElement>(linkSelector));

  const triggers: ScrollTrigger[] = [];

  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href || href === '#' || !href.startsWith('#')) continue;

    const x = decodeURIComponent(href.slice(1));
    if (!x) continue;

    const section = document.getElementById(x);
    if (!section) continue;

    const fillEl = link.querySelector<HTMLElement>(fillSelector);
    if (!fillEl) continue;

    gsap.set(fillEl, { width: '0%' });

    const tween = gsap.to(fillEl, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start,
        end,
        scrub,
        invalidateOnRefresh: true,
      },
    });

    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  }

  return triggers;
}

// Exemple
// initAllAnchorFills({ navRoot: document.querySelector(".nav-anchors")! });
