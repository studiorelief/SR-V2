const CAL_EMBED_SRC = 'https://app.cal.com/embed/embed.js';
const CAL_NAMESPACE = 'rendez-vous-de-30-min';
const CAL_LINK = 'clement-murzeau/rendez-vous-de-30-min';
const CAL_SELECTOR = '#my-cal-inline-rendez-vous-de-30-min';

interface CalFunction {
  (...args: unknown[]): void;
  ns: Record<string, CalFunction>;
  q: unknown[][];
  loaded?: boolean;
}

let embedLoaded = false;

/**
 * Load the Cal.com embed script and render the inline widget.
 * The script is loaded once; the widget re-binds on every Swup visit.
 */
export function initCal(): void {
  const w = window as Window & { Cal?: CalFunction };

  // Bootstrap Cal global — faithfully reproduces the official snippet
  if (!w.Cal) {
    const p = (a: CalFunction, ar: unknown[]) => {
      a.q.push(ar);
    };

    const cal = function (...args: unknown[]) {
      // Handle "init" + namespace: create a queue function in Cal.ns
      if (args[0] === 'init') {
        const api = function (...apiArgs: unknown[]) {
          p(api as CalFunction, apiArgs);
        } as CalFunction;
        api.q = [];
        const namespace = args[1];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], args);
          p(cal, ['initNamespace', namespace]);
        } else {
          p(cal, args);
        }
        return;
      }
      p(cal, args);
    } as CalFunction;

    cal.ns = {};
    cal.q = [];
    w.Cal = cal;
  }

  // Load embed script once
  if (!embedLoaded) {
    const script = document.createElement('script');
    script.src = CAL_EMBED_SRC;
    script.async = true;
    document.head.appendChild(script);
    embedLoaded = true;
  }

  const { Cal } = w as Window & { Cal: CalFunction };

  Cal('init', CAL_NAMESPACE, { origin: 'https://app.cal.com' });

  Cal.ns[CAL_NAMESPACE]('inline', {
    elementOrSelector: CAL_SELECTOR,
    config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme: 'light' },
    calLink: CAL_LINK,
  });

  Cal.ns[CAL_NAMESPACE]('ui', {
    theme: 'light',
    cssVarsPerTheme: {
      light: { 'cal-brand': '#FF7900' },
      dark: { 'cal-brand': '#FF7900' },
    },
    hideEventTypeDetails: false,
    layout: 'month_view',
  });
}
