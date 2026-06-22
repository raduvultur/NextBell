/**
 * Countdown formatting utilities.
 */

/**
 * Format milliseconds into a human-readable countdown string.
 * @param {number} ms - Milliseconds remaining
 * @returns {{ display: string, days: number, hours: number, minutes: number, seconds: number }}
 */
export function formatCountdown(ms) {
  if (ms <= 0) {
    return { display: '00:00:00', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  let display;
  if (days > 0) {
    display = `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return { display, days, hours, minutes, seconds };
}

/**
 * Format a time string (HH:MM) in exchange timezone to user's local time.
 * @param {string} timeStr - Time in "HH:MM" format
 * @param {string} exchangeTimezone - IANA timezone of the exchange
 * @returns {string} Time in user's local timezone "HH:MM" format
 */
export function exchangeTimeToLocal(timeStr, exchangeTimezone) {
  // Create a date in the exchange timezone
  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Build a date string for today in the exchange timezone
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: exchangeTimezone });
  const dateTimeStr = `${dateStr}T${timeStr}:00`;

  // Parse assuming exchange timezone
  const exchangeDate = new Date(dateTimeStr);

  // Calculate offset
  const exchangeOffset = getTimezoneOffsetMinutes(exchangeTimezone, exchangeDate);
  const localOffset = now.getTimezoneOffset();

  // Adjust: exchangeDate was parsed as local, so we need to correct
  const utcMs = exchangeDate.getTime() + localOffset * 60000;
  const adjustedMs = utcMs - exchangeOffset * 60000 + localOffset * 60000;

  // Simpler approach: use Intl to format directly
  const targetDate = new Date();
  targetDate.setHours(hours, minutes, 0, 0);

  // Get the exchange time's offset and local offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: exchangeTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Instead of complex math, create a reference point
  const refDate = new Date(`${dateStr}T${timeStr}:00`);

  try {
    // Use a simpler reliable method
    const localFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Get timezone offset difference
    const exchangeOffsetMs = getOffsetMs(exchangeTimezone);
    const localOffsetMs = -now.getTimezoneOffset() * 60000;
    const diffMs = localOffsetMs - exchangeOffsetMs;

    const localMinutes = hours * 60 + minutes + diffMs / 60000;
    const adjMinutes = ((localMinutes % 1440) + 1440) % 1440;
    const localH = Math.floor(adjMinutes / 60);
    const localM = Math.round(adjMinutes % 60);

    return `${String(localH).padStart(2, '0')}:${String(localM).padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
}

/**
 * Get the UTC offset in milliseconds for a timezone.
 */
function getOffsetMs(timezone) {
  const now = new Date();
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = now.toLocaleString('en-US', { timeZone: timezone });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  return tzDate.getTime() - utcDate.getTime();
}

/**
 * Get timezone offset in minutes (negative = ahead of UTC).
 */
function getTimezoneOffsetMinutes(timezone, date = new Date()) {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = date.toLocaleString('en-US', { timeZone: timezone });
  return (new Date(tzStr) - new Date(utcStr)) / 60000;
}
