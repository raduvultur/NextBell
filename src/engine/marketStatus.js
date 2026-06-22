/**
 * Market status engine.
 * Pure functions to compute the current state of any market.
 */

/**
 * Convert a "HH:MM" string to minutes since midnight.
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Get current time in a specific timezone as { hours, minutes, seconds, dayOfWeek, dateStr }.
 */
export function getNowInTimezone(timezone, now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = {};
  formatter.formatToParts(now).forEach(({ type, value }) => {
    parts[type] = value;
  });

  const hours = parseInt(parts.hour, 10);
  const minutes = parseInt(parts.minute, 10);
  const seconds = parseInt(parts.second, 10);
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[parts.weekday];
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;

  return { hours, minutes, seconds, dayOfWeek, dateStr, totalMinutes: hours * 60 + minutes };
}

/**
 * Determine the current status of a market.
 * Returns an object with status, session info, next event, countdown, and progress.
 */
export function getMarketStatus(market, now = new Date()) {
  const tz = getNowInTimezone(market.timezone, now);
  const currentMinutes = tz.totalMinutes;

  // Check if today is a holiday
  if (market.holidays.includes(tz.dateStr)) {
    return {
      status: 'holiday',
      label: 'Holiday',
      currentSession: null,
      nextEvent: getNextTradingEvent(market, now),
      progress: 0,
    };
  }

  // Check if today is a trading day
  if (!market.tradingDays.includes(tz.dayOfWeek)) {
    return {
      status: 'weekend',
      label: 'Weekend',
      currentSession: null,
      nextEvent: getNextTradingEvent(market, now),
      progress: 0,
    };
  }

  // Check for early closure
  const earlyClose = market.earlyClosure[tz.dateStr];
  const regularClose = earlyClose || market.sessions.regular.close;

  // Check each session
  const sessions = market.sessions;

  // Pre-market
  if (sessions.preMarket) {
    const preOpen = timeToMinutes(sessions.preMarket.open);
    const preClose = timeToMinutes(sessions.preMarket.close);
    if (currentMinutes >= preOpen && currentMinutes < preClose) {
      const elapsed = currentMinutes - preOpen;
      const total = preClose - preOpen;
      return {
        status: 'pre-market',
        label: 'Pre-Market',
        currentSession: 'preMarket',
        nextEvent: {
          type: 'open',
          label: 'Market opens',
          timeStr: sessions.regular.open,
          countdown: getCountdownMs(tz, sessions.regular.open),
        },
        progress: elapsed / total,
      };
    }
  }

  // Regular session
  const regOpen = timeToMinutes(sessions.regular.open);
  const regClose = timeToMinutes(regularClose);
  if (currentMinutes >= regOpen && currentMinutes < regClose) {
    // Check lunch break
    if (market.lunchBreak) {
      const lunchStart = timeToMinutes(market.lunchBreak.start);
      const lunchEnd = timeToMinutes(market.lunchBreak.end);
      if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
        return {
          status: 'lunch-break',
          label: 'Lunch Break',
          currentSession: 'lunchBreak',
          nextEvent: {
            type: 'resume',
            label: 'Resumes',
            timeStr: market.lunchBreak.end,
            countdown: getCountdownMs(tz, market.lunchBreak.end),
          },
          progress: getSessionProgress(regOpen, regClose, currentMinutes),
        };
      }
    }

    const elapsed = currentMinutes - regOpen;
    const total = regClose - regOpen;
    return {
      status: 'open',
      label: 'Open',
      currentSession: 'regular',
      nextEvent: {
        type: 'close',
        label: 'Closes',
        timeStr: regularClose,
        countdown: getCountdownMs(tz, regularClose),
      },
      progress: elapsed / total,
    };
  }

  // After-hours
  if (sessions.afterHours) {
    const ahOpen = timeToMinutes(sessions.afterHours.open);
    const ahClose = timeToMinutes(sessions.afterHours.close);
    if (currentMinutes >= ahOpen && currentMinutes < ahClose) {
      return {
        status: 'after-hours',
        label: 'After-Hours',
        currentSession: 'afterHours',
        nextEvent: {
          type: 'close',
          label: 'Session ends',
          timeStr: sessions.afterHours.close,
          countdown: getCountdownMs(tz, sessions.afterHours.close),
        },
        progress: (currentMinutes - ahOpen) / (ahClose - ahOpen),
      };
    }
  }

  // Market is closed (before any session or after all sessions)
  return {
    status: 'closed',
    label: 'Closed',
    currentSession: null,
    nextEvent: getNextSessionEvent(market, tz, now),
    progress: 0,
  };
}

/**
 * Get countdown in milliseconds from current tz time to a target time string.
 */
function getCountdownMs(tz, targetTimeStr) {
  const targetMinutes = timeToMinutes(targetTimeStr);
  let diffMinutes = targetMinutes - tz.totalMinutes;
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  // Subtract current seconds for precision
  return (diffMinutes * 60 - tz.seconds) * 1000;
}

/**
 * Calculate session progress.
 */
function getSessionProgress(openMinutes, closeMinutes, currentMinutes) {
  const total = closeMinutes - openMinutes;
  const elapsed = currentMinutes - openMinutes;
  return Math.max(0, Math.min(1, elapsed / total));
}

/**
 * Get the next event when market is currently closed but today is a trading day.
 */
function getNextSessionEvent(market, tz, now) {
  const currentMinutes = tz.totalMinutes;
  const sessions = market.sessions;

  // Check if pre-market hasn't started yet today
  if (sessions.preMarket) {
    const preOpen = timeToMinutes(sessions.preMarket.open);
    if (currentMinutes < preOpen) {
      return {
        type: 'pre-market',
        label: 'Pre-market opens',
        timeStr: sessions.preMarket.open,
        countdown: getCountdownMs(tz, sessions.preMarket.open),
      };
    }
  }

  // Check if regular session hasn't started yet today (and no pre-market)
  const regOpen = timeToMinutes(sessions.regular.open);
  if (currentMinutes < regOpen) {
    return {
      type: 'open',
      label: 'Market opens',
      timeStr: sessions.regular.open,
      countdown: getCountdownMs(tz, sessions.regular.open),
    };
  }

  // Past all sessions today — next event is tomorrow or next trading day
  return getNextTradingEvent(market, now);
}

/**
 * Find the next trading day event (for weekends, holidays, or after today's sessions).
 */
export function getNextTradingEvent(market, now = new Date()) {
  const maxDays = 10; // search up to 10 days ahead

  for (let d = 1; d <= maxDays; d++) {
    const futureDate = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const tz = getNowInTimezone(market.timezone, futureDate);

    // Check if it's a trading day and not a holiday
    if (market.tradingDays.includes(tz.dayOfWeek) && !market.holidays.includes(tz.dateStr)) {
      // Next event is the first session of that day
      const firstSession = market.sessions.preMarket
        ? { type: 'pre-market', label: 'Pre-market opens', timeStr: market.sessions.preMarket.open }
        : { type: 'open', label: 'Market opens', timeStr: market.sessions.regular.open };

      // Calculate countdown to that event
      const targetTime = timeToMinutes(firstSession.timeStr);
      const nowTz = getNowInTimezone(market.timezone, now);
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysAhead = d;

      // Rough countdown: days * ms/day + time difference
      const targetMs = targetTime * 60 * 1000;
      const nowMs = (nowTz.totalMinutes * 60 + nowTz.seconds) * 1000;
      const countdown = (daysAhead - 1) * msPerDay + (msPerDay - nowMs) + targetMs;

      return {
        ...firstSession,
        countdown: Math.max(0, countdown),
        daysAhead,
      };
    }
  }

  return { type: 'unknown', label: 'Unknown', countdown: 0 };
}
