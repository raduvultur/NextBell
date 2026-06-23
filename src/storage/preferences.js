/**
 * LocalStorage preferences manager.
 * Stores and retrieves user customization data.
 */

const STORAGE_KEY = 'nextbell_prefs';

const DEFAULT_PREFS = {
  cardOrder: null, // null = use default order from markets.js
  hiddenCards: [],
  bellAlerts: {},  // { [marketId]: true/false }
  groupBy: 'region', // 'region' | 'none'
  searchQuery: '',
  regionFilter: 'all',
  analogClockMode: false,
  headerCollapsed: false,
};

/**
 * Load preferences from localStorage, merging with defaults.
 */
export function loadPrefs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/**
 * Save preferences to localStorage.
 */
export function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('nextbell:prefsChanged', { detail: prefs }));
  } catch (e) {
    console.warn('Failed to save preferences:', e);
  }
}

/**
 * Update a single preference key.
 */
export function updatePref(key, value) {
  const prefs = loadPrefs();
  prefs[key] = value;
  savePrefs(prefs);
  return prefs;
}

/**
 * Toggle bell alert for a specific market.
 */
export function toggleBellAlert(marketId) {
  const prefs = loadPrefs();
  prefs.bellAlerts[marketId] = !prefs.bellAlerts[marketId];
  savePrefs(prefs);
  return prefs.bellAlerts[marketId];
}

/**
 * Toggle card visibility.
 */
export function toggleCardVisibility(marketId) {
  const prefs = loadPrefs();
  const idx = prefs.hiddenCards.indexOf(marketId);
  if (idx === -1) {
    prefs.hiddenCards.push(marketId);
  } else {
    prefs.hiddenCards.splice(idx, 1);
  }
  savePrefs(prefs);
  return prefs;
}

/**
 * Save card order after drag-and-drop reorder.
 */
export function saveCardOrder(orderArray) {
  return updatePref('cardOrder', orderArray);
}

/**
 * Toggle analog clock mode.
 */
export function toggleAnalogClockMode() {
  const prefs = loadPrefs();
  prefs.analogClockMode = !prefs.analogClockMode;
  savePrefs(prefs);
  return prefs.analogClockMode;
}

/**
 * Toggle header collapsed mode.
 */
export function toggleHeaderCollapsed() {
  const prefs = loadPrefs();
  prefs.headerCollapsed = !prefs.headerCollapsed;
  savePrefs(prefs);
  return prefs.headerCollapsed;
}
