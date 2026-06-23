/**
 * OfflineBanner — displays a subtle amber bar when the user goes offline.
 * Auto-hides when connectivity returns.
 */

export function createOfflineBanner() {
  const banner = document.createElement('div');
  banner.className = 'offline-banner';
  banner.id = 'offline-banner';
  banner.innerHTML = `
    <span class="offline-banner__icon">📡</span>
    <span>You're offline — data is cached and up to date</span>
    <button class="offline-banner__dismiss" aria-label="Dismiss">&times;</button>
  `;

  const dismissBtn = banner.querySelector('.offline-banner__dismiss');
  dismissBtn.addEventListener('click', () => {
    banner.classList.remove('offline-banner--visible');
  });

  document.body.appendChild(banner);

  // Show/hide based on connectivity
  const updateStatus = () => {
    if (!navigator.onLine) {
      requestAnimationFrame(() => banner.classList.add('offline-banner--visible'));
    } else {
      banner.classList.remove('offline-banner--visible');
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  // Check initial state
  updateStatus();

  return banner;
}
