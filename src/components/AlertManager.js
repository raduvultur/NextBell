/**
 * Alert Manager — handles bell sounds and browser notifications
 * when a market transitions to "open" status.
 * Uses the service worker registration for enhanced notifications
 * with actions, icons, and vibration.
 */
import { showToast } from './Toast.js';
import { loadPrefs } from '../storage/preferences.js';

class AlertManager {
  constructor() {
    this.audioContext = null;
    this.previousStatuses = {};
    this.hasInteracted = false;
    this.swRegistration = null;

    // Listen for user interaction to unlock audio
    const unlock = () => {
      this.hasInteracted = true;
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
  }

  /**
   * Set the service worker registration for notification use.
   */
  setRegistration(registration) {
    this.swRegistration = registration;
  }

  /**
   * Initialize the Web Audio context (must be called after user interaction).
   */
  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play a stock exchange bell sound using Web Audio API.
   * Synthesizes a bell-like tone with harmonics and decay.
   */
  playBellSound() {
    if (!this.hasInteracted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Create a bell-like sound with multiple harmonics
      const frequencies = [830, 1245, 1660, 2075]; // Bell harmonics
      const gains = [0.4, 0.25, 0.15, 0.1];
      const decays = [2.0, 1.5, 1.0, 0.8];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.connect(ctx.destination);

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gains[i], now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decays[i]);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decays[i]);
      });

      // Add a second strike after 0.4s
      setTimeout(() => {
        const now2 = ctx.currentTime;
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now2);

          gain.gain.setValueAtTime(gains[i] * 0.7, now2);
          gain.gain.exponentialRampToValueAtTime(0.001, now2 + decays[i] * 0.8);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now2);
          osc.stop(now2 + decays[i] * 0.8);
        });
      }, 400);

    } catch (e) {
      console.warn('Failed to play bell sound:', e);
    }
  }

  /**
   * Check for market status transitions and fire alerts.
   * Called every tick (1 second).
   * @param {Array} marketStatuses - Array of { market, status } objects
   */
  checkAlerts(marketStatuses) {
    const prefs = loadPrefs();

    marketStatuses.forEach(({ market, status }) => {
      const prevStatus = this.previousStatuses[market.id];
      const currentStatus = status.status;

      // Detect transition to "open"
      if (
        prevStatus &&
        prevStatus !== 'open' &&
        currentStatus === 'open' &&
        prefs.bellAlerts[market.id]
      ) {
        this.fireAlert(market);
      }

      this.previousStatuses[market.id] = currentStatus;
    });
  }

  /**
   * Fire alert for a market that just opened.
   */
  fireAlert(market) {
    // Play bell sound
    this.playBellSound();

    // Show toast
    showToast(`${market.shortName} is now open!`, {
      type: 'bell',
      icon: '🔔',
      duration: 8000,
    });

    // System notification via SW registration (enhanced) or fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      const notifOptions = {
        body: `${market.name} (${market.shortName}) is now open for trading!`,
        icon: '/icons/icon-192x192.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        tag: `market-open-${market.id}`,
        renotify: true,
        data: { url: '/' },
      };

      if (this.swRegistration) {
        // Use SW registration for enhanced notification with actions
        this.swRegistration.showNotification('🔔 Market Open', {
          ...notifOptions,
          actions: [
            { action: 'view', title: 'View Dashboard' },
          ],
        }).catch(() => {
          // Fallback to basic notification
          new Notification('🔔 Market Open', notifOptions);
        });
      } else {
        new Notification('🔔 Market Open', notifOptions);
      }
    }
  }

  /**
   * Request browser notification permission.
   */
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export default new AlertManager();
