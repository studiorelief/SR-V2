var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// bin/live-reload.js
new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

export {
  __export
};
//# sourceMappingURL=chunk-2S2BR7VX.js.map
