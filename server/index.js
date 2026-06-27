import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const FETCH_INTERVAL_MS = 30000; // 30 seconds

const SYMBOLS = [
  '^NYA', '^IXIC', '^GSPTSE', '^MXX', '^BVSP', '^FTSE', '^GDAXI',
  '^FCHI', '^AEX', '^IBEX', 'FTSEMIB.MI', '^SSMI', '^N225', '000001.SS',
  '399001.SZ', '^HSI', '^KS11', '^AXJO', '^NSEI', '^STI', '^TWII',
  '^TASI.SR', 'DFMGI.AE', '^TA125.TA', '^XU100', '^J203.JO', '^NGSE'
];

// In-memory cache for the latest quote data
let quoteCache = {};

// Scraping helper to get quote data from Yahoo Finance HTML page
async function getQuoteScraped(symbol) {
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  const html = await res.text();
  
  // Find SvelteKit fetch script tags
  const matches = html.match(/<script type="application\/json"[^>]*data-url="[^"]+"[^>]*>([\s\S]*?)<\/script>/g) || [];
  
  for (const m of matches) {
    if (m.includes('quoteSummary')) {
      const jsonContentMatch = m.match(/>([\s\S]*?)<\/script>/);
      if (jsonContentMatch) {
        const payload = JSON.parse(jsonContentMatch[1]);
        const bodyObj = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
        const price = bodyObj?.quoteSummary?.result?.[0]?.price;
        if (price && price.regularMarketPrice?.raw !== undefined) {
          return {
            symbol,
            price: price.regularMarketPrice.raw,
            change: price.regularMarketChange?.raw || 0,
            changePercent: (price.regularMarketChangePercent?.raw || 0) * 100
          };
        }
      }
    }
  }

  // Fallback scan: look for any JSON payload containing the price object
  for (const m of matches) {
    const jsonContentMatch = m.match(/>([\s\S]*?)<\/script>/);
    if (jsonContentMatch) {
      try {
        const payload = JSON.parse(jsonContentMatch[1]);
        const bodyObj = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
        const price = bodyObj?.price;
        if (price && price.regularMarketPrice?.raw !== undefined) {
          return {
            symbol,
            price: price.regularMarketPrice.raw,
            change: price.regularMarketChange?.raw || 0,
            changePercent: (price.regularMarketChangePercent?.raw || 0) * 100
          };
        }
      } catch (err) {
        // Skip malformed or non-relevant json tags
      }
    }
  }

  throw new Error("Could not extract quoteSummary price fields from HTML");
}

// Fetch all quotes in parallel
async function fetchAllQuotes() {
  console.log(`[${new Date().toISOString()}] Fetching quotes for ${SYMBOLS.length} symbols...`);
  
  const promises = SYMBOLS.map(symbol => getQuoteScraped(symbol));
  const results = await Promise.allSettled(promises);
  
  let successCount = 0;
  const newCache = {};

  results.forEach((res, index) => {
    const symbol = SYMBOLS[index];
    if (res.status === 'fulfilled') {
      newCache[symbol] = {
        price: res.value.price,
        change: res.value.change,
        changePercent: res.value.changePercent
      };
      successCount++;
    } else {
      console.error(`[${new Date().toISOString()}] Failed to fetch ${symbol}:`, res.reason.message);
    }
  });

  if (successCount > 0) {
    quoteCache = { ...quoteCache, ...newCache };
    console.log(`[${new Date().toISOString()}] Successfully updated ${successCount}/${SYMBOLS.length} quotes.`);
    return true;
  }
  
  console.warn(`[${new Date().toISOString()}] Failed to fetch any quotes.`);
  return false;
}

// Start WebSocket server
const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server starting on port ${PORT}...`);

wss.on('connection', (ws) => {
  console.log(`New client connected. Total clients: ${wss.clients.size}`);
  
  // Send cached quotes immediately on connection
  if (Object.keys(quoteCache).length > 0) {
    ws.send(JSON.stringify({ type: 'init', data: quoteCache }));
  }
  
  ws.on('close', () => {
    console.log(`Client disconnected. Total clients: ${wss.clients.size}`);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

// Broadcast helper
function broadcastQuotes() {
  if (Object.keys(quoteCache).length === 0) return;
  
  const message = JSON.stringify({ type: 'update', data: quoteCache });
  let count = 0;
  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
      count++;
    }
  }
  console.log(`[${new Date().toISOString()}] Broadcasted quotes to ${count} clients.`);
}

// Initial fetch and start interval
(async () => {
  await fetchAllQuotes();
  
  setInterval(async () => {
    const updated = await fetchAllQuotes();
    if (updated) {
      broadcastQuotes();
    }
  }, FETCH_INTERVAL_MS);
})();
