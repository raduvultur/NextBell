import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const FETCH_INTERVAL_MS = 60000; // 60 seconds

const SYMBOLS = [
  '^NYA', '^IXIC', '^GSPTSE', '^MXX', '^BVSP', '^FTSE', '^GDAXI',
  '^FCHI', '^AEX', '^IBEX', 'FTSEMIB.MI', '^SSMI', '^N225', '000001.SS',
  '399001.SZ', '^HSI', '^KS11', '^AXJO', '^NSEI', '^STI', '^TWII',
  '^TASI.SR', 'DFMGI.AE', '^TA125.TA', '^XU100', '^J203.JO', '^NGSE'
];

// In-memory cache for the latest quote data
let quoteCache = {};

// Fetch quotes using Yahoo Finance spark API in chunks of 15 to respect size limits
async function fetchAllQuotes() {
  console.log(`[${new Date().toISOString()}] Fetching quotes for ${SYMBOLS.length} symbols using Spark API...`);
  
  const chunkSize = 15;
  const newCache = {};
  let successCount = 0;

  for (let i = 0; i < SYMBOLS.length; i += chunkSize) {
    const chunk = SYMBOLS.slice(i, i + chunkSize);
    const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(chunk.join(','))}&range=1d&interval=1d`;
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!res.ok) {
        console.error(`[${new Date().toISOString()}] Spark API chunk fetch failed: HTTP error ${res.status}`);
        // Add a delay even on failure to avoid spamming
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      const json = await res.json();
      const results = json?.spark?.result || [];

      results.forEach(item => {
        const meta = item.response?.[0]?.meta;
        if (meta && meta.regularMarketPrice !== undefined) {
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || price;
          const change = price - prevClose;
          const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

          newCache[item.symbol] = {
            price,
            change,
            changePercent
          };
          successCount++;
        }
      });

      // Wait 200ms between chunks
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.error(`[${new Date().toISOString()}] Spark API chunk fetch error:`, err.message);
    }
  }

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
