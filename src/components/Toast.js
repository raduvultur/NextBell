/**
 * Toast notification component.
 */

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

/**
 * Show a toast notification.
 * @param {string} message - The message to display
 * @param {object} options - { type: 'info'|'success'|'bell', duration: ms, icon: string }
 */
export function showToast(message, options = {}) {
  const { type = 'info', duration = 5000, icon = '' } = options;
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <div class="toast__icon">${icon || getDefaultIcon(type)}</div>
    <div class="toast__content">
      <p class="toast__message">${message}</p>
    </div>
    <button class="toast__close" aria-label="Dismiss">&times;</button>
  `;

  // Close button handler
  const closeBtn = toast.querySelector('.toast__close');
  closeBtn.addEventListener('click', () => dismissToast(toast));

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  // Auto dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

function dismissToast(toast) {
  toast.classList.remove('toast--visible');
  toast.classList.add('toast--exit');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}

function getDefaultIcon(type) {
  switch (type) {
    case 'bell': return '🔔';
    case 'success': return '✅';
    default: return 'ℹ️';
  }
}
