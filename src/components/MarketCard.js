/**
 * MarketCard component — renders a single market tile with
 * countdown, progress bar, session info, and bell toggle.
 */
import { getMarketStatus } from '../engine/marketStatus.js';
import { formatCountdown, exchangeTimeToLocal } from '../engine/countdown.js';
import { loadPrefs, toggleBellAlert } from '../storage/preferences.js';

/**
 * Status configuration — colors, labels, icons.
 */
const STATUS_CONFIG = {
  open: {
    class: 'status--open',
    badgeClass: 'badge--open',
    progressClass: 'progress--open',
    borderClass: 'card--open',
  },
  'pre-market': {
    class: 'status--pre-market',
    badgeClass: 'badge--pre-market',
    progressClass: 'progress--pre-market',
    borderClass: 'card--pre-market',
  },
  'after-hours': {
    class: 'status--after-hours',
    badgeClass: 'badge--after-hours',
    progressClass: 'progress--after-hours',
    borderClass: 'card--after-hours',
  },
  'lunch-break': {
    class: 'status--lunch-break',
    badgeClass: 'badge--lunch-break',
    progressClass: 'progress--lunch-break',
    borderClass: 'card--lunch-break',
  },
  closed: {
    class: 'status--closed',
    badgeClass: 'badge--closed',
    progressClass: 'progress--closed',
    borderClass: 'card--closed',
  },
  holiday: {
    class: 'status--holiday',
    badgeClass: 'badge--holiday',
    progressClass: 'progress--closed',
    borderClass: 'card--holiday',
  },
  weekend: {
    class: 'status--weekend',
    badgeClass: 'badge--weekend',
    progressClass: 'progress--closed',
    borderClass: 'card--weekend',
  },
};

/**
 * Create a market card DOM element.
 */
export function createMarketCard(market) {
  const card = document.createElement('div');
  card.className = 'market-card';
  card.dataset.marketId = market.id;
  card.id = `card-${market.id}`;

  // Build session time display
  const sessions = market.sessions;
  const regularOpen = sessions.regular.open;
  const regularClose = sessions.regular.close;
  const localOpen = exchangeTimeToLocal(regularOpen, market.timezone);
  const localClose = exchangeTimeToLocal(regularClose, market.timezone);

  // Pre-market / after-hours info
  let extendedInfo = '';
  if (sessions.preMarket) {
    const pmLocalOpen = exchangeTimeToLocal(sessions.preMarket.open, market.timezone);
    const pmLocalClose = exchangeTimeToLocal(sessions.preMarket.close, market.timezone);
    extendedInfo += `
      <div class="session-row session-row--extended">
        <span class="session-label">Pre-Market</span>
        <span class="session-times">
          <span class="time-exchange">${sessions.preMarket.open} – ${sessions.preMarket.close}</span>
          <span class="time-local">${pmLocalOpen} – ${pmLocalClose} local</span>
        </span>
      </div>`;
  }
  if (sessions.afterHours) {
    const ahLocalOpen = exchangeTimeToLocal(sessions.afterHours.open, market.timezone);
    const ahLocalClose = exchangeTimeToLocal(sessions.afterHours.close, market.timezone);
    extendedInfo += `
      <div class="session-row session-row--extended">
        <span class="session-label">After-Hours</span>
        <span class="session-times">
          <span class="time-exchange">${sessions.afterHours.open} – ${sessions.afterHours.close}</span>
          <span class="time-local">${ahLocalOpen} – ${ahLocalClose} local</span>
        </span>
      </div>`;
  }

  const prefs = loadPrefs();
  const bellActive = prefs.bellAlerts[market.id] || false;

  card.innerHTML = `
    <div class="card__drag-handle" title="Drag to reorder">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="4" cy="3" r="1.5"/>
        <circle cx="12" cy="3" r="1.5"/>
        <circle cx="4" cy="8" r="1.5"/>
        <circle cx="12" cy="8" r="1.5"/>
        <circle cx="4" cy="13" r="1.5"/>
        <circle cx="12" cy="13" r="1.5"/>
      </svg>
    </div>

    <div class="card__header">
      <div class="card__identity">
        <img
          src="https://flagcdn.com/w40/${market.countryCode}.png"
          alt="${market.country}"
          class="card__flag"
          loading="lazy"
          width="32"
          height="20"
          onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\\'card__flag-fallback\\'>${market.countryCode.toUpperCase()}</div>')"
        />
        <div class="card__names">
          <h3 class="card__name">${market.shortName} - ${market.name}</h3>
          <span class="card__country">${market.country}</span>
        </div>
      </div>
      <div class="card__actions">
        <button
          class="bell-btn ${bellActive ? 'bell-btn--active' : ''}"
          data-market-id="${market.id}"
          title="${bellActive ? 'Disable open alert' : 'Enable open alert'}"
          aria-label="Toggle bell alert for ${market.shortName}"
        >
          <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          ${bellActive ? '<span class="bell-active-dot"></span>' : ''}
        </button>
        <span class="card__badge" data-status-badge>—</span>
      </div>
    </div>

    <div class="card__countdown-section">
      <div class="card__countdown-label" data-countdown-label>—</div>
      <div class="card__countdown" data-countdown>00:00:00</div>
    </div>

    <div class="card__progress-container">
      <div class="card__progress-track">
        <div class="card__progress-fill" data-progress-fill style="width: 0%"></div>
        <div class="card__progress-dot" data-progress-dot style="left: 0%"></div>
      </div>
    </div>

    <div class="card__sessions">
      <div class="session-row session-row--regular">
        <span class="session-label">Regular</span>
        <span class="session-times">
          <span class="time-exchange">${regularOpen} – ${regularClose}</span>
          <span class="time-local">${localOpen} – ${localClose} local</span>
        </span>
      </div>
      ${extendedInfo}
    </div>
  `;

  // Bell button handler
  const bellBtn = card.querySelector('.bell-btn');
  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = toggleBellAlert(market.id);
    bellBtn.classList.toggle('bell-btn--active', isActive);
    bellBtn.title = isActive ? 'Disable open alert' : 'Enable open alert';

    // Update active dot
    const existingDot = bellBtn.querySelector('.bell-active-dot');
    if (isActive && !existingDot) {
      const dot = document.createElement('span');
      dot.className = 'bell-active-dot';
      bellBtn.appendChild(dot);
    } else if (!isActive && existingDot) {
      existingDot.remove();
    }

    // Request notification permission on first bell activation
    if (isActive && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  });

  return card;
}

/**
 * Update a market card's dynamic content (countdown, status, progress).
 * Called every tick.
 */
export function updateMarketCard(card, market) {
  const status = getMarketStatus(market);
  const config = STATUS_CONFIG[status.status] || STATUS_CONFIG.closed;
  const countdown = formatCountdown(status.nextEvent?.countdown || 0);

  // Update card border/glow class
  card.className = `market-card ${config.borderClass}`;
  card.dataset.marketId = market.id;

  // Update badge
  const badge = card.querySelector('[data-status-badge]');
  if (badge) {
    badge.textContent = status.label;
    badge.className = `card__badge ${config.badgeClass}`;
  }

  // Update countdown
  const countdownEl = card.querySelector('[data-countdown]');
  if (countdownEl) {
    countdownEl.textContent = countdown.display;
  }

  // Update countdown label
  const labelEl = card.querySelector('[data-countdown-label]');
  if (labelEl) {
    labelEl.textContent = status.nextEvent?.label || '';
  }

  // Update progress
  const progressFill = card.querySelector('[data-progress-fill]');
  const progressDot = card.querySelector('[data-progress-dot]');
  const pct = Math.round(status.progress * 100);

  if (progressFill) {
    progressFill.style.width = `${pct}%`;
    progressFill.className = `card__progress-fill ${config.progressClass}`;
  }
  if (progressDot) {
    progressDot.style.left = `${pct}%`;
    progressDot.className = `card__progress-dot ${status.progress > 0 ? 'card__progress-dot--visible' : ''}`;
    if (status.status === 'open') {
      progressDot.classList.add('card__progress-dot--active');
    }
  }

  return status;
}
