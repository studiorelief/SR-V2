# Studio Relief — V2 Front-End

Custom TypeScript + GSAP + Swup, packagé en bundle ESM avec esbuild, déployé via CDN GitHub et injecté dans Webflow custom code.

> **Pour les conventions du starter Finsweet sous-jacent (build, CI, Changesets, etc.), voir [§ Finsweet developer starter](#finsweet-developer-starter) plus bas.**

## Sommaire

- [Stack](#stack)
- [Architecture](#architecture)
  - [Lifecycle Swup](#lifecycle-swup)
  - [Namespace registry](#namespace-registry)
  - [Pattern init / destroy](#pattern-init--destroy)
  - [Heavy hero defer (cold load WebKit)](#heavy-hero-defer-cold-load-webkit)
  - [Persistant vs page-level (#swup)](#persistant-vs-page-level-swup)
- [Dev local](#dev-local)
- [Quality checks](#quality-checks)
- [Conventions](#conventions)
- [Ajouter une nouvelle page / namespace](#ajouter-une-nouvelle-page--namespace)

---

## Stack

|                   |                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Front HTML/CSS    | **Webflow** (Client-First conventions)                                                             |
| TS/JS bundler     | **esbuild** (ESM, code-splitting, format ES2020 prod)                                              |
| Page transitions  | **Swup 4** (`@swup/head-plugin`, `@swup/preload-plugin`, `@swup/scroll-plugin`, `@swup/js-plugin`) |
| Animations        | **GSAP 3.13** (`ScrollTrigger`, `Draggable`, `SplitText`)                                          |
| Sliders           | **Swiper 12**                                                                                      |
| CMS helpers       | **Finsweet Attributes v2** (`@finsweet/ts-utils`)                                                  |
| Lottie            | `@lottiefiles/dotlottie-web` + `@lottiefiles/lottie-player`                                        |
| Backend (form)    | **Supabase** (`@supabase/supabase-js`)                                                             |
| Code highlighting | **Shiki** (lazy-loaded chunk)                                                                      |

Entry point unique : [src/index.ts](src/index.ts). Tous les plugins GSAP sont enregistrés une seule fois en haut du fichier.

---

## Architecture

### Lifecycle Swup

```
Click sur lien interne (hors hash, hors self-link, hors anchor)
│
├─ visit:start
├─ leaveAnimation        → swupLeaveAnimation() — rideau orange descend, animateGlobalHeroLeave (sun + lueurs sortent)
├─ content:replace       (le rideau couvre l'écran, le DOM va être remplacé)
│   ├─ ScrollTrigger.getAll().kill()       — kill global de tous les triggers
│   ├─ runNamespaceSetup()                 — ctx.revert() du namespace sortant + setup() custom
│   ├─ destroy*()                          — sticker, draggable, button, lottie, lazyVideos, sliders, search, social, mirror, sun, …
│   └─ updateFavicon()                     — switch favicon par namespace
├─ enterAnimation        → swupEnterAnimation() — rideau remonte, setupAndAnimateGlobalHero (entrée hero global)
├─ page:view             (le contenu est injecté, le rideau est remonté)
│   ├─ initGlobalFunctions()               — re-init listeners et animations globales (sticker, footer, hero global, …)
│   ├─ initNavbarCurrentState()            — w--current sur les liens
│   ├─ runNamespaceRun()                   — anims spécifiques au namespace courant (parallax, etc.)
│   └─ rAF: restartWebflow + restartFsAttributesModules + dedupeRelatedItems
└─ visit:end             → initCtaAnimation, initRessources*, …
```

**Règle d'or** : tout `init*` qui pose un listener doit avoir un `destroy*` paired appelé dans `content:replace`, **sauf** s'il vit hors `#swup` (élément persistant) — dans ce cas l'init doit être idempotent (flag attribute) et appelé une seule fois au boot.

### Namespace registry

Chaque page Webflow a un attribut `data-swup-namespace="..."` sur son `<main id="swup">`. Le registry centralise les init / setup par namespace :

```ts
// src/utils/swup/swupNamespaceRegistry.ts
registerNamespace('approche', {
  setup: () => {
    /* teardown perso (rare, ctx.revert le fait déjà) */
  },
  run: () =>
    gsap.context(() => {
      // toutes les anims/scrollTriggers du namespace
      initApprocheParallax();
      initApprocheHeroScroll();
      // ...
    }),
});
```

`run()` est appelé sur `page:view` ET au boot (premier chargement). Si `run()` retourne un `gsap.Context`, le registry le tracke automatiquement et appellera `ctx.revert()` au prochain `setup()` (au teardown du namespace).

`setup()` est optionnel et fire au `content:replace` AVANT que le DOM ne soit remplacé. À utiliser pour :

- Les cleanups **non-GSAP** que `ctx.revert()` ne couvre pas (cycles `onComplete` récursifs, observers, listeners externes, debounce timers).
- Préparer l'état initial du namespace entrant si nécessaire.

7 namespaces enregistrés : `home`, `approche`, `offres`, `produits`, `portfolio`, `cms-portfolio`, `contact`.

### Pattern init / destroy

```ts
// Module-scope state pour permettre un cleanup propre
const cleanups = new Set<() => void>();

export const initFoo = (): void => {
  const el = document.querySelector('.foo');
  if (!el) return; // null check obligatoire

  const handler = () => {
    /* ... */
  };
  el.addEventListener('click', handler);
  cleanups.add(() => el.removeEventListener('click', handler));
};

export const destroyFoo = (): void => {
  cleanups.forEach((fn) => fn());
  cleanups.clear();
};
```

`destroyFoo` est appelé dans le `swup.hooks.on('content:replace', …)` de [src/index.ts](src/index.ts).

### Heavy hero defer (cold load WebKit)

Sur direct refresh d'une inner page (`/approche`, `/offres`, …), le browser doit décoder ~20 MB de WebP hero (parallax animals, lueurs, falaises, mascotte) en parallèle. Si on init GSAP en même temps :

- 28+ éléments avec `will-change: transform` → autant de compositor layers.
- ScrollTriggers + timelines hero qui consomment du main thread.
- Sur WebKit/DIA, le scheduler ne lisse pas → 86 % du frame budget en Commit, **7 FPS visible**.

Solution dans [src/index.ts](src/index.ts) (`runHeavyHeroInit`) : on attend `window.load` PUIS `img.decode()` sur les images hero **avant** de créer les compositor layers et les triggers. Les images mobile-only (display:none sur desktop) sont filtrées via `img.complete && img.naturalWidth > 0` pour éviter un hang infini. Safety timeout 1500 ms.

**Pourquoi ça marche en navigation Swup** : Swup pré-fetch et pré-décode les images en background AVANT de swap le DOM. Le timing diffère du cold load direct.

### Persistant vs page-level (#swup)

```
<body>
  <nav class="nav_component">    ← PERSISTANT (hors #swup)
    ...
  </nav>

  <main id="swup" data-swup-namespace="home">    ← PAGE-LEVEL (DOM remplacé à chaque transition)
    ...
  </main>

  <footer class="footer_component">    ← PERSISTANT (hors #swup)
    ...
  </footer>
</body>
```

| Composant                                                           | Position              | Stratégie cleanup                                                            |
| ------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| Navbar                                                              | hors `#swup`          | Init unique au boot, listeners attachés une fois pour la session             |
| Footer                                                              | hors `#swup`          | Init flag-gated (`data-footer-loop-initialized`), idempotent sur `page:view` |
| `[scroll-top]` button                                               | hors `#swup` (footer) | Flag `data-scroll-top-init`                                                  |
| Hero, sliders, sticker, search, share, accordions, …, tout le reste | dans `#swup`          | DOM swap → `init/destroy` paired dans `content:replace`                      |

---

## Dev local

```bash
pnpm install
pnpm dev          # esbuild watch + serveur localhost:3000
```

Dans Webflow custom code (Project Settings → Custom Code → Footer Code), injecter en dev :

```html
<script type="module" src="http://localhost:3000/index.js"></script>
<link href="http://localhost:3000/index.css" rel="stylesheet" type="text/css" />
```

> **Important** : `type="module"` est obligatoire — esbuild produit de l'ESM avec code-splitting (Shiki, DotLottie, Supabase, Marker chargés en chunks séparés).

En prod, le bundle vient du CDN GitHub Pages du repo (master ou tag).

## Quality checks

À passer avant chaque commit :

```bash
pnpm check        # tsc --noEmit
pnpm lint:fix     # eslint --fix
pnpm lint         # eslint + prettier --check
pnpm build        # build production dans dist/
```

Smoke test post-deploy sur Webflow staging :

1. Cold load `/approche` (direct refresh) → hero animations smooth ≥ 60 FPS
2. Nav Home → Approche → Portfolio → CMS portfolio → Contact → Home (5 pages)
3. Console : `ScrollTrigger.getAll().length` stable entre 2 visites de la même page
4. DevTools Memory : "Detached HTMLElement" count stable entre 2 visites

## Conventions

### CSS — Client-First (côté Webflow)

- Custom classes : `component_element` avec underscores (`header_content`, `form_input`)
- Utility classes : pas d'underscore, `property-type-value` (`margin-bottom-large`, `text-color-primary`)
- Modifiers : préfixe `is-` en combo class (`button` + `is-brand`)
- Pas d'abréviations

### TypeScript

- `init*` / `destroy*` paired prefix
- Module-scope state pour stocker les références (timelines, observers, listener cleanups)
- `if (!element) return;` early-return obligatoire avant tout `addEventListener`
- Import des plugins GSAP : valeur uniquement, le `registerPlugin` est centralisé dans `src/index.ts`
- Path alias `$utils/*` pour `src/utils/*`
- JSDoc seulement quand le **WHY** est non-évident (préférer un nom de fonction clair à un commentaire)

### Commit messages

Conventional Commits : `feat`, `fix`, `perf`, `refactor`, `chore`, `docs` + scope optionnel.

```
perf(swup): close listener leaks on page transitions
fix(offres): hotfix cold-load slowness
refactor(gsap): centralize plugin registration
```

---

## Ajouter une nouvelle page / namespace

1. **Côté Webflow** : ajouter `data-swup-namespace="ma-page"` sur le `<main id="swup">` de la page.

2. **Côté code** : créer le module d'animations dans [src/utils/page/{ma-page}/](src/utils/page/) et exporter des `init*` (et `destroy*` si listeners non-GSAP).

3. **Enregistrer le namespace** dans [src/utils/swup/swupNamespaceRegistry.ts](src/utils/swup/swupNamespaceRegistry.ts) :

   ```ts
   registerNamespace('ma-page', {
     run: () =>
       gsap.context(() => {
         initMaPageAnim();
         // ...
       }),
   });
   ```

4. **Si listeners non-GSAP** (mousemove, debounce, observer, cycle récursif via onComplete), ajouter aussi un `setup` qui appelle le destroy explicite :

   ```ts
   registerNamespace('ma-page', {
     setup: () => destroyMaPageListeners(),
     run: () =>
       gsap.context(() => {
         initMaPageAnim();
         initMaPageListeners();
       }),
   });
   ```

5. **Si la page a un hero global** (sun, lueurs, h2 SplitText, hero-tag glare), pas d'action — ces anims sont gérées par [src/utils/swup/swupGlobalHero.ts](src/utils/swup/swupGlobalHero.ts) via les attributs `transition-trigger="hero-section|hero-sun|hero-lueurs|hero-tag"`.

---

# Finsweet developer starter

> Conventions et outils du starter Finsweet sous-jacent (build, CI, Changesets, …). Conservé tel quel pour référence.

## Reference

- [Included tools](#included-tools)
- [Requirements](#requirements)
- [Getting started](#getting-started)
  - [Installing](#installing)
  - [Building](#building)
    - [Serving files on development mode](#serving-files-on-development-mode)
    - [Building multiple files](#building-multiple-files)
    - [Setting up a path alias](#setting-up-a-path-alias)
- [Contributing guide](#contributing-guide)
- [Pre-defined scripts](#pre-defined-scripts)
- [CI/CD](#cicd)
  - [Continuous Integration](#continuous-integration)
  - [Continuous Deployment](#continuous-deployment)
  - [How to automatically deploy updates to npm](#how-to-automatically-deploy-updates-to-npm)

## Included tools

This template contains some preconfigured development tools:

- [Typescript](https://www.typescriptlang.org/): A superset of Javascript that adds an additional layer of Typings, bringing more security and efficiency to the written code.
- [Prettier](https://prettier.io/): Code formatting that assures consistency across all Finsweet's projects.
- [ESLint](https://eslint.org/): Code linting that enforces industries' best practices. It uses [our own custom configuration](https://github.com/finsweet/eslint-config) to maintain consistency across all Finsweet's projects.
- [Playwright](https://playwright.dev/): Fast and reliable end-to-end testing.
- [esbuild](https://esbuild.github.io/): Javascript bundler that compiles, bundles and minifies the original Typescript files.
- [Changesets](https://github.com/changesets/changesets): A way to manage your versioning and changelogs.
- [Finsweet's TypeScript Utils](https://github.com/finsweet/ts-utils): Some utilities to help you in your Webflow development.

## Requirements

This template requires the use of [pnpm](https://pnpm.js.org/en/). You can [install pnpm](https://pnpm.io/installation) with:

```bash
npm i -g pnpm
```

To enable automatic deployments to npm, please read the [Continuous Deployment](#continuous-deployment) section.

## Getting started

The quickest way to start developing a new project is by [creating a new repository from this template](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template).

Once the new repository has been created, update the `package.json` file with the correct information, specially the name of the package which has to be unique.

### Installing

After creating the new repository, open it in your terminal and install the packages by running:

```bash
pnpm install
```

If this is the first time using Playwright and you want to use it in this project, you'll also have to install the browsers by running:

```bash
pnpm playwright install
```

You can read more about the use of Playwright in the [Testing](#testing) section.

It is also recommended that you install the following extensions in your VSCode editor:

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

### Building

To build the files, you have two defined scripts:

- `pnpm dev`: Builds and creates a local server that serves all files (check [Serving files on development mode](#serving-files-on-development-mode) for more info).
- `pnpm build`: Builds to the production directory (`dist`).

### Serving files on development mode

When you run `pnpm dev`, two things happen:

- esbuild is set to `watch` mode. Every time that you save your files, the project will be rebuilt.
- A local server is created under `http://localhost:3000` that serves all your project files. You can import them in your Webflow projects like:

```html
<script defer src="http://localhost:3000/{FILE_PATH}.js"></script>
```

- Live Reloading is enabled by default, meaning that every time you save a change in your files, the website you're working on will reload automatically. You can disable it in `/bin/build.js`.

### Building multiple files

If you need to build multiple files into different outputs, you can do it by updating the build settings.

In `bin/build.js`, update the `ENTRY_POINTS` array with any files you'd like to build:

```javascript
const ENTRY_POINTS = [
  'src/home/index.ts',
  'src/contact/whatever.ts',
  'src/hooyah.ts',
  'src/home/other.ts',
];
```

This will tell `esbuild` to build all those files and output them in the `dist` folder for production and in `http://localhost:3000` for development.

### Building CSS files

CSS files are also supported by the bundler. When including a CSS file as an entry point, the compiler will generate a minified version in your output folder.

You can define a CSS entry point by either:

- Manually defining it in the `bin/build.js` config. [See previous section](#building-multiple-files) for reference.
- Or importing the file inside any of your JavaScript / TypeScript files:

```typescript
// src/index.ts
import './index.css';
```

CSS outputs are also available in `localhost` during [development mode](#serving-files-on-development-mode).

### Setting up a path alias

Path aliases are very helpful to avoid code like:

```typescript
import example from '../../../../utils/example';
```

Instead, we can create path aliases that map to a specific folder, so the code becomes cleaner like:

```typescript
import example from '$utils/example';
```

You can set up path aliases using the `paths` setting in `tsconfig.json`. This template has an already predefined path as an example:

```json
{
  "paths": {
    "$utils/*": ["src/utils/*"]
  }
}
```

To avoid any surprises, take some time to familiarize yourself with the [tsconfig](/tsconfig.json) enabled flags.

## Testing

As previously mentioned, this library has [Playwright](https://playwright.dev/) included as an automated testing tool.

All tests are located under the `/tests` folder. This template includes a test spec example that will help you catch up with Playwright.

After [installing the dependencies](#installing), you can try it out by running `pnpm test`.
Make sure you replace it with your own tests! Writing proper tests will help improve the maintainability and scalability of your project in the long term.

By default, Playwright will also run `pnpm dev` in the background while the tests are running, so [your files served](#serving-files-on-development-mode) under `localhost:3000` will run as usual.
You can disable this behavior in the `playwright.config.ts` file.

If you project doesn't require any testing, you should disable the Tests job in the [CI workflow](#continuous-integration) by commenting it out in the `.github/workflows/ci.yml` file.
This will prevent the tests from running when you open a Pull Request.

## Contributing guide

In general, your development workflow should look like this:

1. Create a new branch where to develop a new feature or bug fix.
2. Once you've finished the implementation, [create a Changeset](#continuous-deployment) (or multiple) explaining the changes that you've made in the codebase.
3. Open a Pull Request and wait until the [CI workflows](#continuous-integration) finish. If something fails, please try to fix it before merging the PR.
   If you don't want to wait for the CI workflows to run on GitHub to know if something fails, it will be always faster to run them in your machine before opening a PR.
4. Merge the Pull Request. The Changesets bot will automatically open a new PR with updates to the `CHANGELOG.md`, you should also merge that one. If you have [automatic npm deployments](#how-to-automatically-deploy-updates-to-npm) enabled, Changesets will also publish this new version on npm.

If you need to work on several features before publishing a new version on npm, it is a good practise to create a `development` branch where to merge all the PR's before pushing your code to master.

## Pre-defined scripts

This template contains a set of predefined scripts in the `package.json` file:

- `pnpm dev`: Builds and creates a local server that serves all files (check [Serving files on development mode](#serving-files-on-development-mode) for more info).
- `pnpm build`: Builds to the production directory (`dist`).
- `pnpm lint`: Scans the codebase with ESLint and Prettier to see if there are any errors.
- `pnpm lint:fix`: Fixes all auto-fixable issues in ESLint.
- `pnpm check`: Checks for TypeScript errors in the codebase.
- `pnpm format`: Formats all the files in the codebase using Prettier. You probably won't need this script if you have automatic [formatting on save](https://www.digitalocean.com/community/tutorials/code-formatting-with-prettier-in-visual-studio-code#automatically-format-on-save) active in your editor.
- `pnpm test`: Will run all the tests that are located in the `/tests` folder.
- `pnpm test:headed`: Will run all the tests that are located in the `/tests` folder visually in headed browsers.
- `pnpm release`: This command is defined for [Changesets](https://github.com/changesets/changesets). You don't have to interact with it.
- `pnpm run update`: Scans the dependencies of the project and provides an interactive UI to select the ones that you want to update.

## CI/CD

This template contains a set of helpers with proper CI/CD workflows.

### Continuous Integration

When you open a Pull Request, a Continuous Integration workflow will run to:

- Lint & check your code. It uses the `pnpm lint` and `pnpm check` commands under the hood.
- Run the automated tests. It uses the `pnpm test` command under the hood.

If any of these jobs fail, you will get a warning in your Pull Request and should try to fix your code accordingly.

**Note:** If your project doesn't contain any defined tests in the `/tests` folder, you can skip the Tests workflow job by commenting it out in the `.github/workflows/ci.yml` file. This will significantly improve the workflow running times.

### Continuous Deployment

[Changesets](https://github.com/changesets/changesets) allows us to generate automatic changelog updates when merging a Pull Request to the `master` branch.

Before starting, make sure to [enable full compatibility with Changesets in the repository](#how-to-enable-continuous-deployment-with-changesets).

To generate a new changelog, run:

```bash
pnpm changeset
```

You'll be prompted with a few questions to complete the changelog.

Once the Pull Request is merged into `master`, a new Pull Request will automatically be opened by a changesets bot that bumps the package version and updates the `CHANGELOG.md` file.
You'll have to manually merge this new PR to complete the workflow.

If an `NPM_TOKEN` secret is included in the repository secrets, Changesets will automatically deploy the new package version to npm.
See [how to automatically deploy updates to npm](#how-to-automatically-deploy-updates-to-npm) for more info.

#### How to enable Continuous Deployment with Changesets

Some repositories may not have the required permissions to let Changesets interact with the repository.

To enable full compatibility with Changesets, go to the repository settings (`Settings > Actions > General > Workflow Permissions`) and define:

- ✅ Read and write permissions.
- ✅ Allow GitHub Actions to create and approve pull requests.

Enabling this setting for your organization account (`Account Settings > Actions > General`) could help streamline the process. By doing so, any new repos created under the org will automatically inherit the setting, which can save your teammates time and effort. This can only be applied to organization accounts at the time.

#### How to automatically deploy updates to npm

As mentioned before, Changesets will automatically deploy the new package version to npm if an `NPM_TOKEN` secret is provided.

This npm token should be:

- From Finsweet's npm organization if this repository is meant for internal/product development.
- From a client's npm organization if this repository is meant for client development. In this case, you should ask the client to [create an npm account](https://www.npmjs.com/signup) and provide you the credentials (or the npm token, if they know how to get it).

Once you're logged into the npm account, you can get an access token by following [this guide](https://docs.npmjs.com/creating-and-viewing-access-tokens).

The access token must be then placed in a [repository secret](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-encrypted-secrets-for-your-repository-and-organization-for-codespaces#adding-secrets-for-a-repository) named `NPM_TOKEN`.
