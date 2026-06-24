/**
 * MarketCard component — renders a single market tile with
 * countdown, progress bar, session info, and bell toggle.
 */
import { getMarketStatus, getNowInTimezone } from '../engine/marketStatus.js';
import { formatCountdown, exchangeTimeToLocal } from '../engine/countdown.js';
import { loadPrefs, toggleBellAlert, toggleCardFlipped } from '../storage/preferences.js';

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
 * Helper to generate modern analog clock ticks SVG.
 */
function getClockTicksSVG() {
  let ticksHtml = '';
  for (let i = 0; i < 60; i++) {
    if (i % 15 === 0) continue; // Skip 12, 3, 6, 9 to avoid overlapping text
    const angle = (i * 6 * Math.PI) / 180;
    const isHour = i % 5 === 0;
    const rStart = 85;
    const rEnd = isHour ? 75 : 80;
    const color = isHour ? 'rgba(255, 255, 255, 0.85)' : 'rgba(148, 163, 184, 0.25)';
    const width = isHour ? 2 : 1.2;

    const x1 = (100 + rStart * Math.sin(angle)).toFixed(2);
    const y1 = (100 - rStart * Math.cos(angle)).toFixed(2);
    const x2 = (100 + rEnd * Math.sin(angle)).toFixed(2);
    const y2 = (100 - rEnd * Math.cos(angle)).toFixed(2);

    ticksHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" />`;
  }
  return ticksHtml;
}

/**
 * Helper to calculate SVG circular arc path representing regular market hours.
 */
function getMarketOpenArcPath(regularOpen, regularClose) {
  const [hOpen, mOpen] = regularOpen.split(':').map(Number);
  const [hClose, mClose] = regularClose.split(':').map(Number);

  const tOpen = (hOpen % 12) + mOpen / 60;
  const tClose = (hClose % 12) + mClose / 60;

  const thetaStart = (tOpen / 12) * 2 * Math.PI - Math.PI / 2;
  const thetaEnd = (tClose / 12) * 2 * Math.PI - Math.PI / 2;

  const r = 81; // Radius just inside the hour ticks
  const x1 = (100 + r * Math.cos(thetaStart)).toFixed(2);
  const y1 = (100 + r * Math.sin(thetaStart)).toFixed(2);
  const x2 = (100 + r * Math.cos(thetaEnd)).toFixed(2);
  const y2 = (100 + r * Math.sin(thetaEnd)).toFixed(2);

  let delta = (tClose - tOpen) * 30;
  if (delta < 0) delta += 360;

  const largeArcFlag = delta > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

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

  // Set initial flipped class if in preferences
  const isFlipped = prefs.flippedCards && prefs.flippedCards.includes(market.id);
  if (isFlipped) {
    card.classList.add('market-card--flipped');
  }

  // Shared header template used on both faces
  const headerHtml = `
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
  `;

  card.innerHTML = `
    <div class="market-card__inner">
      <!-- Front Face (Info) -->
      <div class="market-card__face market-card__face--front">
        ${headerHtml}

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
      </div>

      <!-- Back Face (Clock) -->
      <div class="market-card__face market-card__face--back">
        ${headerHtml}

        <div class="card__analog-clock-container">
          <div class="card__analog-clock-wrapper">
            <svg class="analog-clock" viewBox="0 0 200 200">
              <rect x="5" y="5" width="190" height="190" rx="46" ry="46" class="clock__face" />
              <path class="clock__open-arc" d="" fill="none" />
              <g class="clock__ticks">
                ${getClockTicksSVG()}
              </g>
              <text x="100" y="38" class="clock__num">12</text>
              <text x="166" y="107" class="clock__num">3</text>
              <text x="100" y="176" class="clock__num">6</text>
              <text x="34" y="107" class="clock__num">9</text>
              
              <!-- Day/Night Complication (above 6) -->
              <g class="clock__day-night" transform="translate(100, 146)"></g>
              
              <g class="clock__date-group">
                <text class="clock__date-day" x="134" y="93">--</text>
                <text class="clock__date-num" x="134" y="113">--</text>
              </g>

              <g class="clock__hand-group clock__hand-group--hour">
                <line class="clock__hand clock__hand--hour" x1="100" y1="100" x2="100" y2="62" stroke-linecap="round" />
              </g>
              <g class="clock__hand-group clock__hand-group--minute">
                <line class="clock__hand clock__hand--minute" x1="100" y1="100" x2="100" y2="44" stroke-linecap="round" />
              </g>
              <g class="clock__hand-group clock__hand-group--second">
                <line class="clock__hand clock__hand--second" x1="100" y1="112" x2="100" y2="30" stroke-linecap="round" />
              </g>
              <circle cx="100" cy="100" r="3.5" class="clock__pin" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bell button handler
  const bellBtns = card.querySelectorAll('.bell-btn');
  bellBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = toggleBellAlert(market.id);
      
      bellBtns.forEach((b) => {
        b.classList.toggle('bell-btn--active', isActive);
        b.title = isActive ? 'Disable open alert' : 'Enable open alert';

        // Update active dot
        const existingDot = b.querySelector('.bell-active-dot');
        if (isActive && !existingDot) {
          const dot = document.createElement('span');
          dot.className = 'bell-active-dot';
          b.appendChild(dot);
        } else if (!isActive && existingDot) {
          existingDot.remove();
        }
      });

      // Request notification permission on first bell activation
      if (isActive && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    });
  });

  // Card click flip handler
  card.addEventListener('click', (e) => {
    // Ignore click if it targets the bell button, drag handle, or anything inside them
    if (e.target.closest('.bell-btn') || e.target.closest('.card__drag-handle')) {
      return;
    }
    const isNowFlipped = toggleCardFlipped(market.id);
    card.classList.toggle('market-card--flipped', isNowFlipped);
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

  // Update card border/glow class safely without overwriting other classes
  const statusClasses = ['card--open', 'card--pre-market', 'card--after-hours', 'card--lunch-break', 'card--closed', 'card--holiday', 'card--weekend'];
  card.classList.remove(...statusClasses);
  card.classList.add(config.borderClass);
  card.dataset.marketId = market.id;

  // Update badge on both faces
  const badges = card.querySelectorAll('[data-status-badge]');
  badges.forEach((badge) => {
    badge.textContent = status.label;
    badge.className = `card__badge ${config.badgeClass}`;
  });

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

  // Update analog clock hands & date in real time
  const clockContainer = card.querySelector('.card__analog-clock-container');
  if (clockContainer) {
    const tz = getNowInTimezone(market.timezone);
    
    const hourDeg = (30 * (tz.hours % 12) + tz.minutes / 2).toFixed(1);
    const minDeg = (6 * tz.minutes + tz.seconds / 10).toFixed(1);
    const secDeg = (6 * tz.seconds).toFixed(1);

    const hourHand = clockContainer.querySelector('.clock__hand-group--hour');
    const minHand = clockContainer.querySelector('.clock__hand-group--minute');
    const secHand = clockContainer.querySelector('.clock__hand-group--second');

    if (hourHand) hourHand.setAttribute('transform', `rotate(${hourDeg} 100 100)`);
    if (minHand) minHand.setAttribute('transform', `rotate(${minDeg} 100 100)`);
    if (secHand) secHand.setAttribute('transform', `rotate(${secDeg} 100 100)`);

    const dateDay = clockContainer.querySelector('.clock__date-day');
    const dateNum = clockContainer.querySelector('.clock__date-num');
    if (dateDay) dateDay.textContent = tz.weekday;
    if (dateNum) dateNum.textContent = tz.day;

    const isDay = tz.hours >= 6 && tz.hours < 18;

    // Update daytime/nighttime complication
    const dayNightEl = clockContainer.querySelector('.clock__day-night');
    if (dayNightEl) {
      const currentMode = dayNightEl.dataset.mode;
      const targetMode = isDay ? 'day' : 'night';
      if (currentMode !== targetMode) {
        dayNightEl.dataset.mode = targetMode;
        if (isDay) {
          dayNightEl.innerHTML = `
            <circle cx="0" cy="0" r="4.2" fill="#f59e0b" />
            <path d="M0 -7v1.8 M0 5.2v1.8 M-7 0h1.8 M5.2 0h1.8 M-4.9 -4.9l1.3 1.3 M3.6 3.6l1.3 1.3 M-4.9 5.2l1.3 -1.3 M3.6 -3.6l1.3 -1.3" stroke="#f59e0b" stroke-width="1.2" stroke-linecap="round" />
          `;
        } else {
          dayNightEl.innerHTML = `
            <path d="M-2 -4 A 4.5 4.5 0 1 0 4 2 A 3.2 3.2 0 1 1 -2 -4 Z" fill="#818cf8" opacity="0.85" />
          `;
        }
      }
    }

    // Update glowing market open hours arc
    const openArc = clockContainer.querySelector('.clock__open-arc');
    if (openArc) {
      if (isDay) {
        const regularOpen = market.sessions.regular.open;
        const regularClose = market.sessions.regular.close;
        const path = getMarketOpenArcPath(regularOpen, regularClose);
        openArc.setAttribute('d', path);
        openArc.classList.add('clock__open-arc--visible');
      } else {
        openArc.setAttribute('d', '');
        openArc.classList.remove('clock__open-arc--visible');
      }
    }
  }
  return status;
}
