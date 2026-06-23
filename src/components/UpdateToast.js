/**
 * UpdateToast — shows a toast notification when a new service worker
 * version is available, with a "Refresh" button to activate it.
 */

export function showUpdateToast(registration) {
  // Remove existing if any
  const existing = document.getElementById('update-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'update-toast';
  toast.id = 'update-toast';
  toast.innerHTML = `
    <span class="update-toast__icon">✨</span>
    <span class="update-toast__text">A new version is available</span>
    <button class="update-toast__btn" id="update-refresh-btn">Refresh</button>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('update-toast--visible');
    });
  });

  // Refresh button
  toast.querySelector('#update-refresh-btn').addEventListener('click', () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  });
}
