/**
 * InstallPrompt — captures the beforeinstallprompt event and shows a
 * sleek, non-intrusive install banner. Dismissed state is persisted
 * in localStorage so it does not reappear.
 */

const DISMISSED_KEY = 'nextbell_install_dismissed';

let deferredPrompt = null;

export function initInstallPrompt() {
  // Don't show if already dismissed
  if (localStorage.getItem(DISMISSED_KEY)) return;

  // Don't show if already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPrompt();
  });
}

function showPrompt() {
  const prompt = document.createElement('div');
  prompt.className = 'install-prompt';
  prompt.id = 'install-prompt';
  prompt.innerHTML = `
    <span class="install-prompt__icon">🔔</span>
    <div class="install-prompt__content">
      <div class="install-prompt__title">Install NextBell</div>
      <div class="install-prompt__desc">Get instant access to market countdowns from your home screen</div>
    </div>
    <div class="install-prompt__actions">
      <button class="install-prompt__btn install-prompt__btn--primary" id="install-btn">Install</button>
      <button class="install-prompt__btn install-prompt__btn--dismiss" id="install-dismiss">Later</button>
    </div>
  `;

  document.body.appendChild(prompt);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      prompt.classList.add('install-prompt--visible');
    });
  });

  // Install button
  prompt.querySelector('#install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    hidePrompt(prompt);
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
  });

  // Dismiss button
  prompt.querySelector('#install-dismiss').addEventListener('click', () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    hidePrompt(prompt);
  });
}

function hidePrompt(el) {
  el.classList.remove('install-prompt--visible');
  setTimeout(() => el.remove(), 500);
}
