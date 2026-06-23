/**
 * Header component — top bar with branding, clock, search, and filters.
 */
import { loadPrefs, updatePref, toggleCardVisibility, toggleAnalogClockMode } from '../storage/preferences.js';
import markets from '../data/markets.js';

/**
 * Create the header element.
 */
export function createHeader(onFilterChange) {
  const prefs = loadPrefs();
  const header = document.createElement('header');
  header.className = 'app-header';
  header.id = 'app-header';

  const regions = [...new Set(markets.map((m) => m.region))].sort();

  header.innerHTML = `
    <div class="header__inner">
      <div class="header__brand">
        <div class="header__logo">
          <svg viewBox="0 0 32 32" class="logo-icon" fill="none">
            <circle cx="16" cy="16" r="14" stroke="url(#logo-gradient)" stroke-width="2.5"/>
            <g class="logo-bell">
              <path d="M16 9a3 3 0 0 1 3 3v3.58a7 7 0 0 0 2 4.92l.85.85a1 1 0 0 1-.71 1.71H10.86a1 1 0 0 1-.71-1.71l.85-.85a7 7 0 0 0 2-4.92V12a3 3 0 0 1 3-3z" stroke="url(#logo-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 23a2 2 0 0 0 4 0" stroke="url(#logo-gradient)" stroke-width="2" stroke-linecap="round"/>
            </g>
            <path d="M10 6l-2-3M22 6l2-3M16 4V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#ef4444"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="header__titles">
          <h1 class="header__app-name">NextBell</h1>
          <p class="header__subtitle">Global Market Hours</p>
        </div>
      </div>

      <div class="header__center">
        <div class="header__clock" id="header-clock">
          <div class="clock__utc">
            <span class="clock__label">UTC</span>
            <span class="clock__time" id="utc-time">--:--:--</span>
          </div>
          <div class="clock__divider"></div>
          <div class="clock__local">
            <span class="clock__label" id="local-tz-label">Local</span>
            <span class="clock__time" id="local-time">--:--:--</span>
          </div>
        </div>
      </div>

      <div class="header__controls">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            id="search-input"
            class="search-input"
            placeholder="Search markets..."
            aria-label="Search markets"
          />
        </div>

        <select id="region-filter" class="region-filter" aria-label="Filter by region">
          <option value="all">All Regions</option>
          ${regions.map((r) => `<option value="${r}">${r}</option>`).join('')}
        </select>

        <button id="clock-toggle-btn" class="clock-toggle-btn ${prefs.analogClockMode ? 'clock-toggle-btn--active' : ''}" title="Toggle analog clock view" aria-label="Toggle analog clock view">
          <svg class="clock-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>

        <button id="manage-btn" class="manage-btn" title="Manage visible markets" aria-label="Manage markets">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Search handler
  const searchInput = header.querySelector('#search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    updatePref('searchQuery', query);
    onFilterChange();
  });

  // Region filter handler
  const regionFilter = header.querySelector('#region-filter');
  regionFilter.addEventListener('change', (e) => {
    updatePref('regionFilter', e.target.value);
    onFilterChange();
  });

  // Clock toggle handler
  const clockToggleBtn = header.querySelector('#clock-toggle-btn');
  clockToggleBtn.addEventListener('click', () => {
    const isClockMode = toggleAnalogClockMode();
    clockToggleBtn.classList.toggle('clock-toggle-btn--active', isClockMode);
    document.body.classList.toggle('mode--analog-clock', isClockMode);
  });

  // Manage button handler
  const manageBtn = header.querySelector('#manage-btn');
  manageBtn.addEventListener('click', () => {
    showManageModal(onFilterChange);
  });

  // Restore saved filter values
  if (prefs.searchQuery) searchInput.value = prefs.searchQuery;
  if (prefs.regionFilter) regionFilter.value = prefs.regionFilter;

  return header;
}

/**
 * Update the clock displays.
 */
export function updateClocks() {
  const now = new Date();

  const utcEl = document.getElementById('utc-time');
  if (utcEl) {
    utcEl.textContent = now.toLocaleTimeString('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  const localEl = document.getElementById('local-time');
  if (localEl) {
    localEl.textContent = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  const tzLabel = document.getElementById('local-tz-label');
  if (tzLabel) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const shortTz = tz.split('/').pop().replace(/_/g, ' ');
    tzLabel.textContent = shortTz;
  }
}

/**
 * Show the manage markets modal.
 */
function showManageModal(onFilterChange) {
  // Remove existing modal if any
  const existing = document.getElementById('manage-modal');
  if (existing) existing.remove();

  const prefs = loadPrefs();
  const regions = [...new Set(markets.map((m) => m.region))].sort();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'manage-modal';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal__header">
      <h2 class="modal__title">Manage Markets</h2>
      <button class="modal__close" aria-label="Close">&times;</button>
    </div>
    <div class="modal__body">
      ${regions
        .map(
          (region) => `
        <div class="modal__region">
          <h3 class="modal__region-title">${region}</h3>
          <div class="modal__market-list">
            ${markets
              .filter((m) => m.region === region)
              .map(
                (m) => `
              <label class="modal__market-item">
                <input
                  type="checkbox"
                  ${!prefs.hiddenCards.includes(m.id) ? 'checked' : ''}
                  data-market-id="${m.id}"
                />
                <img src="https://flagcdn.com/w20/${m.countryCode}.png" alt="" width="20" height="13" />
                <span>${m.shortName}</span>
                <span class="modal__market-name">${m.name}</span>
              </label>
            `
              )
              .join('')}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));

  // Close handlers
  const closeBtn = modal.querySelector('.modal__close');
  const close = () => {
    overlay.classList.remove('modal-overlay--visible');
    setTimeout(() => overlay.remove(), 300);
  };

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Checkbox handlers
  modal.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      toggleCardVisibility(e.target.dataset.marketId);
      onFilterChange();
    });
  });
}
