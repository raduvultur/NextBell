/**
 * NextBell — Main Application Entry Point
 * Orchestrates all components, the tick loop, and SortableJS.
 */
import './styles/index.css';
import './styles/animations.css';
import Sortable from 'sortablejs';
import markets from './data/markets.js';
import { createHeader, updateClocks } from './components/Header.js';
import { createMarketCard, updateMarketCard } from './components/MarketCard.js';
import { loadPrefs, saveCardOrder } from './storage/preferences.js';
import alertManager from './components/AlertManager.js';

// ─── State ──────────────────────────────────────────────
let cardElements = new Map(); // marketId → DOM element
let sortableInstance = null;

// ─── Initialize ─────────────────────────────────────────
function init() {
  const app = document.getElementById('app');
  app.innerHTML = '';

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

  // Initialize SortableJS
  initSortable();

  // Start tick loop
  tick();
  setInterval(tick, 1000);

  // Request notification permission after a delay
  setTimeout(() => {
    alertManager.requestNotificationPermission();
  }, 5000);
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

// ─── Initialize SortableJS ──────────────────────────────
function initSortable() {
  const grid = document.getElementById('market-grid');
  if (!grid) return;

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
}

// ─── Update All Cards ───────────────────────────────────
function updateAllCards() {
  const statuses = [];

  cardElements.forEach(({ el, market }) => {
    const status = updateMarketCard(el, market);
    statuses.push({ market, status });
  });

  return statuses;
}

// ─── Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
