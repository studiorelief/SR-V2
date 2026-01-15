const loadedScripts: HTMLScriptElement[] = [];

export function initFsLibrairiesScripts(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');

    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
    loadedScripts.push(script);
  });
}

export function destroyFsLibrairiesScripts(): void {
  loadedScripts.forEach((script) => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
  loadedScripts.length = 0;
}

//   loadScript('https://cdn.jsdelivr.net/npm/@finsweet/attributes-selectcustom@1/selectcustom.js');
//   loadScript('https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsselect@1/cmsselect.js');
//   loadScript('https://cdn.jsdelivr.net/npm/@finsweet/attributes-inputactive@1/inputactive.js');
