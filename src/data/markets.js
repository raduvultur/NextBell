/**
 * Static market data for 25+ global exchanges.
 * Sessions include pre-market, regular, and after-hours where applicable.
 * All times are in local exchange timezone (24h format).
 */
import { holidays2026, earlyClosure2026 } from './holidays.js';

const markets = [
  // ═══════════════════════════════════════════════════════
  //  AMERICAS
  // ═══════════════════════════════════════════════════════
  {
    id: 'nyse',
    name: 'New York Stock Exchange',
    shortName: 'NYSE',
    country: 'United States',
    countryCode: 'us',
    region: 'Americas',
    timezone: 'America/New_York',
    sessions: {
      preMarket:  { open: '04:00', close: '09:30' },
      regular:    { open: '09:30', close: '16:00' },
      afterHours: { open: '16:00', close: '20:00' },
    },
    tradingDays: [1, 2, 3, 4, 5], // Mon-Fri
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    shortName: 'NASDAQ',
    country: 'United States',
    countryCode: 'us',
    region: 'Americas',
    timezone: 'America/New_York',
    sessions: {
      preMarket:  { open: '04:00', close: '09:30' },
      regular:    { open: '09:30', close: '16:00' },
      afterHours: { open: '16:00', close: '20:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'tsx',
    name: 'Toronto Stock Exchange',
    shortName: 'TSX',
    country: 'Canada',
    countryCode: 'ca',
    region: 'Americas',
    timezone: 'America/Toronto',
    sessions: {
      preMarket: { open: '07:00', close: '09:30' },
      regular:   { open: '09:30', close: '16:00' },
      afterHours: { open: '16:00', close: '17:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'bmv',
    name: 'Bolsa Mexicana de Valores',
    shortName: 'BMV',
    country: 'Mexico',
    countryCode: 'mx',
    region: 'Americas',
    timezone: 'America/Mexico_City',
    sessions: {
      regular: { open: '08:30', close: '15:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'b3',
    name: 'B3 São Paulo',
    shortName: 'B3',
    country: 'Brazil',
    countryCode: 'br',
    region: 'Americas',
    timezone: 'America/Sao_Paulo',
    sessions: {
      preMarket: { open: '09:45', close: '10:00' },
      regular:   { open: '10:00', close: '17:30' },
      afterHours: { open: '17:30', close: '18:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },

  // ═══════════════════════════════════════════════════════
  //  EUROPE
  // ═══════════════════════════════════════════════════════
  {
    id: 'lse',
    name: 'London Stock Exchange',
    shortName: 'LSE',
    country: 'United Kingdom',
    countryCode: 'gb',
    region: 'Europe',
    timezone: 'Europe/London',
    sessions: {
      preMarket: { open: '05:05', close: '08:00' },
      regular:   { open: '08:00', close: '16:30' },
      afterHours: { open: '16:40', close: '17:15' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'xetra',
    name: 'Frankfurt Stock Exchange',
    shortName: 'XETRA',
    country: 'Germany',
    countryCode: 'de',
    region: 'Europe',
    timezone: 'Europe/Berlin',
    sessions: {
      preMarket: { open: '07:30', close: '09:00' },
      regular:   { open: '09:00', close: '17:30' },
      afterHours: { open: '17:30', close: '20:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'euronext_paris',
    name: 'Euronext Paris',
    shortName: 'ENX Paris',
    country: 'France',
    countryCode: 'fr',
    region: 'Europe',
    timezone: 'Europe/Paris',
    sessions: {
      preMarket: { open: '07:15', close: '09:00' },
      regular:   { open: '09:00', close: '17:30' },
      afterHours: { open: '17:30', close: '17:40' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'euronext_amsterdam',
    name: 'Euronext Amsterdam',
    shortName: 'ENX Amsterdam',
    country: 'Netherlands',
    countryCode: 'nl',
    region: 'Europe',
    timezone: 'Europe/Amsterdam',
    sessions: {
      preMarket: { open: '07:15', close: '09:00' },
      regular:   { open: '09:00', close: '17:30' },
      afterHours: { open: '17:30', close: '17:40' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'bme_madrid',
    name: 'Bolsa de Madrid',
    shortName: 'BME',
    country: 'Spain',
    countryCode: 'es',
    region: 'Europe',
    timezone: 'Europe/Madrid',
    sessions: {
      preMarket: { open: '08:30', close: '09:00' },
      regular:   { open: '09:00', close: '17:30' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'borsa_italiana',
    name: 'Borsa Italiana',
    shortName: 'BIT',
    country: 'Italy',
    countryCode: 'it',
    region: 'Europe',
    timezone: 'Europe/Rome',
    sessions: {
      preMarket: { open: '08:00', close: '09:00' },
      regular:   { open: '09:00', close: '17:30' },
      afterHours: { open: '18:00', close: '20:30' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'six_swiss',
    name: 'SIX Swiss Exchange',
    shortName: 'SIX',
    country: 'Switzerland',
    countryCode: 'ch',
    region: 'Europe',
    timezone: 'Europe/Zurich',
    sessions: {
      preMarket: { open: '06:00', close: '09:00' },
      regular:   { open: '09:00', close: '17:30' },
      afterHours: { open: '17:30', close: '17:40' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },

  // ═══════════════════════════════════════════════════════
  //  ASIA-PACIFIC
  // ═══════════════════════════════════════════════════════
  {
    id: 'tse',
    name: 'Tokyo Stock Exchange',
    shortName: 'TSE',
    country: 'Japan',
    countryCode: 'jp',
    region: 'Asia-Pacific',
    timezone: 'Asia/Tokyo',
    sessions: {
      regular:   { open: '09:00', close: '15:30' },
    },
    lunchBreak: { start: '11:30', end: '12:30' },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'sse',
    name: 'Shanghai Stock Exchange',
    shortName: 'SSE',
    country: 'China',
    countryCode: 'cn',
    region: 'Asia-Pacific',
    timezone: 'Asia/Shanghai',
    sessions: {
      regular: { open: '09:30', close: '15:00' },
    },
    lunchBreak: { start: '11:30', end: '13:00' },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'szse',
    name: 'Shenzhen Stock Exchange',
    shortName: 'SZSE',
    country: 'China',
    countryCode: 'cn',
    region: 'Asia-Pacific',
    timezone: 'Asia/Shanghai',
    sessions: {
      regular: { open: '09:30', close: '15:00' },
    },
    lunchBreak: { start: '11:30', end: '13:00' },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'hkex',
    name: 'Hong Kong Stock Exchange',
    shortName: 'HKEX',
    country: 'Hong Kong',
    countryCode: 'hk',
    region: 'Asia-Pacific',
    timezone: 'Asia/Hong_Kong',
    sessions: {
      preMarket: { open: '09:00', close: '09:30' },
      regular:   { open: '09:30', close: '16:00' },
    },
    lunchBreak: { start: '12:00', end: '13:00' },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'krx',
    name: 'Korea Exchange',
    shortName: 'KRX',
    country: 'South Korea',
    countryCode: 'kr',
    region: 'Asia-Pacific',
    timezone: 'Asia/Seoul',
    sessions: {
      preMarket: { open: '08:30', close: '09:00' },
      regular:   { open: '09:00', close: '15:30' },
      afterHours: { open: '15:40', close: '16:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'asx',
    name: 'Australian Securities Exchange',
    shortName: 'ASX',
    country: 'Australia',
    countryCode: 'au',
    region: 'Asia-Pacific',
    timezone: 'Australia/Sydney',
    sessions: {
      preMarket: { open: '07:00', close: '10:00' },
      regular:   { open: '10:00', close: '16:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'nse',
    name: 'National Stock Exchange',
    shortName: 'NSE',
    country: 'India',
    countryCode: 'in',
    region: 'Asia-Pacific',
    timezone: 'Asia/Kolkata',
    sessions: {
      preMarket: { open: '09:00', close: '09:15' },
      regular:   { open: '09:15', close: '15:30' },
      afterHours: { open: '15:40', close: '16:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'sgx',
    name: 'Singapore Exchange',
    shortName: 'SGX',
    country: 'Singapore',
    countryCode: 'sg',
    region: 'Asia-Pacific',
    timezone: 'Asia/Singapore',
    sessions: {
      preMarket: { open: '08:30', close: '09:00' },
      regular:   { open: '09:00', close: '17:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'twse',
    name: 'Taiwan Stock Exchange',
    shortName: 'TWSE',
    country: 'Taiwan',
    countryCode: 'tw',
    region: 'Asia-Pacific',
    timezone: 'Asia/Taipei',
    sessions: {
      regular: { open: '09:00', close: '13:30' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },

  // ═══════════════════════════════════════════════════════
  //  MIDDLE EAST
  // ═══════════════════════════════════════════════════════
  {
    id: 'tadawul',
    name: 'Saudi Stock Exchange',
    shortName: 'Tadawul',
    country: 'Saudi Arabia',
    countryCode: 'sa',
    region: 'Middle East',
    timezone: 'Asia/Riyadh',
    sessions: {
      preMarket: { open: '09:30', close: '10:00' },
      regular:   { open: '10:00', close: '15:00' },
    },
    tradingDays: [0, 1, 2, 3, 4], // Sun-Thu
  },
  {
    id: 'dfm',
    name: 'Dubai Financial Market',
    shortName: 'DFM',
    country: 'UAE',
    countryCode: 'ae',
    region: 'Middle East',
    timezone: 'Asia/Dubai',
    sessions: {
      preMarket: { open: '09:30', close: '10:00' },
      regular:   { open: '10:00', close: '14:00' },
    },
    tradingDays: [1, 2, 3, 4, 5], // Mon-Fri
  },
  {
    id: 'tase',
    name: 'Tel Aviv Stock Exchange',
    shortName: 'TASE',
    country: 'Israel',
    countryCode: 'il',
    region: 'Middle East',
    timezone: 'Asia/Jerusalem',
    sessions: {
      preMarket: { open: '09:00', close: '09:59' },
      regular:   { open: '09:59', close: '17:15' },
    },
    tradingDays: [0, 1, 2, 3, 4], // Sun-Thu
  },
  {
    id: 'bist',
    name: 'Borsa Istanbul',
    shortName: 'BIST',
    country: 'Turkey',
    countryCode: 'tr',
    region: 'Middle East',
    timezone: 'Europe/Istanbul',
    sessions: {
      regular:  { open: '10:00', close: '18:00' },
    },
    lunchBreak: { start: '13:00', end: '14:00' },
    tradingDays: [1, 2, 3, 4, 5],
  },

  // ═══════════════════════════════════════════════════════
  //  AFRICA
  // ═══════════════════════════════════════════════════════
  {
    id: 'jse',
    name: 'Johannesburg Stock Exchange',
    shortName: 'JSE',
    country: 'South Africa',
    countryCode: 'za',
    region: 'Africa',
    timezone: 'Africa/Johannesburg',
    sessions: {
      regular: { open: '09:00', close: '17:00' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'ngx',
    name: 'Nigerian Exchange',
    shortName: 'NGX',
    country: 'Nigeria',
    countryCode: 'ng',
    region: 'Africa',
    timezone: 'Africa/Lagos',
    sessions: {
      regular: { open: '10:00', close: '14:30' },
    },
    tradingDays: [1, 2, 3, 4, 5],
  },
];

// Attach holidays and early closures to each market
markets.forEach((market) => {
  market.holidays = holidays2026[market.id] || [];
  market.earlyClosure = earlyClosure2026[market.id] || {};
});

export default markets;
