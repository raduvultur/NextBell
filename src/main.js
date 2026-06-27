/**
 * NextBell — Main Application Entry Point
 * Orchestrates all components, the tick loop, SortableJS, and PWA features.
 */
import './styles/index.css';
import './styles/animations.css';
import markets from './data/markets.js';
import { createHeader, updateClocks, updateFreshness } from './components/Header.js';
import { createMarketCard, updateMarketCard } from './components/MarketCard.js';
import { loadPrefs, saveCardOrder } from './storage/preferences.js';
import alertManager from './components/AlertManager.js';
import { createOfflineBanner } from './components/OfflineBanner.js';
import { initInstallPrompt } from './components/InstallPrompt.js';
import { showUpdateToast } from './components/UpdateToast.js';

// ─── State ──────────────────────────────────────────────
let cardElements = new Map(); // marketId → DOM element
let sortableInstance = null;
let Sortable = null; // Lazy-loaded
let liveQuotes = {}; // Cache for index quotes
let lastQuoteTimestamp = null;

// ─── Initialize ─────────────────────────────────────────
function init() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Set initial clock and header mode classes on body
  const prefs = loadPrefs();
  document.body.classList.toggle('mode--analog-clock', !!prefs.analogClockMode);
  document.body.classList.toggle('mode--header-collapsed', !!prefs.headerCollapsed);

  // Create header
  const header = createHeader(renderCards);
  app.appendChild(header);

  // Create grid container
  const grid = document.createElement('div');
  grid.className = 'market-grid';
  grid.id = 'market-grid';
  app.appendChild(grid);

  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  app.appendChild(toastContainer);

  // Initial render
  renderCards();

  // Initialize SortableJS (lazy)
  initSortable();

  // Start tick loop
  tick();
  setInterval(tick, 1000);

  // Request notification permission after a delay
  setTimeout(() => {
    alertManager.requestNotificationPermission();
  }, 5000);

  // PWA features
  createOfflineBanner();
  initInstallPrompt();
  registerServiceWorker();

  // Connect to WebSocket
  connectWebSocket();

  // Prevent screen sleep
  requestWakeLock();
}

// ─── Wake Lock ──────────────────────────────────────────
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    let wakeLock = await navigator.wakeLock.request('screen');
    console.log('[WakeLock] Screen Wake Lock acquired.');
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('[WakeLock] Screen Wake Lock re-acquired.');
      }
    });
  } catch (err) {
    console.warn('[WakeLock] Wake Lock not available:', err);
  }
}

// ─── Render Cards ───────────────────────────────────────
function renderCards() {
  const grid = document.getElementById('market-grid');
  const prefs = loadPrefs();

  // Determine visible markets
  let visibleMarkets = markets.filter((m) => !prefs.hiddenCards.includes(m.id));

  // Apply search filter
  if (prefs.searchQuery) {
    const q = prefs.searchQuery.toLowerCase();
    visibleMarkets = visibleMarkets.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.shortName.toLowerCase().includes(q) ||
        m.country.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q)
    );
  }

  // Apply region filter
  if (prefs.regionFilter && prefs.regionFilter !== 'all') {
    visibleMarkets = visibleMarkets.filter((m) => m.region === prefs.regionFilter);
  }

  // Apply saved card order
  if (prefs.cardOrder && prefs.cardOrder.length > 0) {
    const orderMap = new Map(prefs.cardOrder.map((id, idx) => [id, idx]));
    visibleMarkets.sort((a, b) => {
      const aIdx = orderMap.has(a.id) ? orderMap.get(a.id) : 999;
      const bIdx = orderMap.has(b.id) ? orderMap.get(b.id) : 999;
      return aIdx - bIdx;
    });
  }

  // Clear grid
  grid.innerHTML = '';
  cardElements.clear();

  if (visibleMarkets.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <p class="empty-state__text">No markets match your filters</p>
      </div>
    `;
    return;
  }

  // Create and append cards
  visibleMarkets.forEach((market) => {
    const card = createMarketCard(market);
    grid.appendChild(card);
    cardElements.set(market.id, { el: card, market });
  });

  // Re-init sortable after render
  initSortable();

  // Immediate update
  updateAllCards();
}

// ─── Initialize SortableJS (Lazy Loaded) ────────────────
async function initSortable() {
  const grid = document.getElementById('market-grid');
  if (!grid) return;

  // Lazy-load SortableJS on first call
  if (!Sortable) {
    try {
      const module = await import('sortablejs');
      Sortable = module.default;
    } catch (e) {
      console.warn('Failed to load SortableJS:', e);
      return;
    }
  }

  if (sortableInstance) {
    sortableInstance.destroy();
  }

  sortableInstance = new Sortable(grid, {
    animation: 200,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    handle: '.card__drag-handle',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    delay: 50,
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    onEnd: (evt) => {
      // Read new order from DOM
      const cards = grid.querySelectorAll('.market-card');
      const newOrder = Array.from(cards).map((c) => c.dataset.marketId);
      saveCardOrder(newOrder);
    },
  });
}

// ─── Tick Loop ──────────────────────────────────────────
function tick() {
  updateClocks();
  const statuses = updateAllCards();
  alertManager.checkAlerts(statuses);

  // Update data freshness indicator
  if (lastQuoteTimestamp) {
    const secondsAgo = Math.floor((Date.now() - lastQuoteTimestamp) / 1000);
    updateFreshness(secondsAgo);
  }
}

// ─── Update All Cards ───────────────────────────────────
function updateAllCards() {
  const statuses = [];

  cardElements.forEach(({ el, market }) => {
    const status = updateMarketCard(el, market, liveQuotes);
    statuses.push({ market, status });
  });

  return statuses;
}

// ─── Service Worker Registration ────────────────────────
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const { registerSW } = await import('virtual:pwa-register');

      const updateSW = registerSW({
        onNeedRefresh() {
          // A new version is available — show update toast
          navigator.serviceWorker.ready.then((registration) => {
            showUpdateToast(registration);
          });
        },
        onOfflineReady() {
          console.log('NextBell is ready to work offline');
        },
        onRegisteredSW(swUrl, registration) {
          if (registration) {
            alertManager.setRegistration(registration);
          }
        },
      });
    } catch (e) {
      console.warn('PWA registration failed:', e);
    }
  }
}

// ─── WebSocket Connection ──────────────────────────────
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  console.log(`[WS] Connecting to ${wsUrl}...`);
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('[WS] Connected successfully.');
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'init' || message.type === 'update') {
        liveQuotes = { ...liveQuotes, ...message.data };
        lastQuoteTimestamp = Date.now();
        updateAllCards();
      }
    } catch (err) {
      console.error('[WS] Error parsing message:', err);
    }
  };
  
  ws.onclose = (event) => {
    console.warn(`[WS] Connection closed (code: ${event.code}). Reconnecting in 5s...`);
    lastQuoteTimestamp = null;
    const freshnessEl = document.getElementById('data-freshness');
    if (freshnessEl) {
      const dot = freshnessEl.querySelector('.freshness__dot');
      const text = freshnessEl.querySelector('.freshness__text');
      if (dot && text) {
        dot.style.background = 'var(--color-holiday)';
        dot.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.4)';
        text.textContent = 'Reconnecting…';
      }
    }
    setTimeout(connectWebSocket, 5000);
  };
  
  ws.onerror = (err) => {
    console.error('[WS] WebSocket error:', err);
  };
}

// ─── Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
