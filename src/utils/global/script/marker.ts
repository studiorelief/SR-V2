/*
 *============================================================================
 * SCRIPT RECETTAGE
 *============================================================================
 */

export async function initMarker() {
  // Only load marker if URL contains 'webflow' (staging only).
  // L'import dynamique exclut le SDK du bundle prod.
  if (!window.location.href.includes('webflow')) {
    return;
  }

  const { default: markerSDK } = await import('@marker.io/browser');
  await markerSDK.loadWidget({
    project: '693550e819816bee81d26fb4',
  });
}
