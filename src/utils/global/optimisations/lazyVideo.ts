/**
 * Lazy Video Loading
 * Defers video loading until the video is near the viewport
 * Uses Intersection Observer for performance
 *
 * Usage in Webflow:
 * - Add attribute `data-lazy-video="true"` to <video> elements
 * - The video src will be moved to data-src and loaded when near viewport
 */

interface LazyVideoInstance {
  video: HTMLVideoElement;
  observer: IntersectionObserver;
}

const instances: LazyVideoInstance[] = [];

/**
 * Initialize lazy loading for a single video
 */
const initLazyVideo = (video: HTMLVideoElement): LazyVideoInstance | null => {
  // Skip if already initialized
  if (video.hasAttribute('data-lazy-initialized')) return null;
  video.setAttribute('data-lazy-initialized', 'true');

  // Get src from video or source element
  let originalSrc = video.getAttribute('src');
  const sourceEl = video.querySelector('source');

  if (!originalSrc && sourceEl) {
    originalSrc = sourceEl.getAttribute('src');
  }

  if (!originalSrc) return null;

  // Store original src and remove it
  video.setAttribute('data-src', originalSrc);
  video.removeAttribute('src');
  if (sourceEl) {
    sourceEl.removeAttribute('src');
  }

  // Set preload to none
  video.preload = 'none';

  // Create observer with rootMargin to start loading before video enters viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLVideoElement;
          const src = target.getAttribute('data-src');

          if (src) {
            // Restore src
            const source = target.querySelector('source');
            if (source) {
              source.setAttribute('src', src);
            } else {
              target.setAttribute('src', src);
            }

            // Load the video
            target.load();

            // Stop observing
            observer.unobserve(target);
          }
        }
      });
    },
    {
      rootMargin: '200px 0px', // Start loading 200px before entering viewport
      threshold: 0,
    }
  );

  observer.observe(video);

  return { video, observer };
};

/**
 * Initialize lazy loading for all videos with data-lazy-video attribute
 */
export const initLazyVideos = (): void => {
  const videos = document.querySelectorAll<HTMLVideoElement>('[data-lazy-video="true"]');

  videos.forEach((video) => {
    const instance = initLazyVideo(video);
    if (instance) {
      instances.push(instance);
    }
  });
};

/**
 * Destroy all lazy video observers
 */
export const destroyLazyVideos = (): void => {
  instances.forEach(({ observer, video }) => {
    observer.unobserve(video);
    observer.disconnect();
    video.removeAttribute('data-lazy-initialized');
  });
  instances.length = 0;
};
