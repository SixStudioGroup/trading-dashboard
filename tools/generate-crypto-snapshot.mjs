import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { snapshotRow } from './crypto-row.mjs';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'crypto-snapshot.json');
const USER_AGENT = 'SixQuant-Terminal-Crypto-Snapshot/1.0';
const API_KEY = process.env.COINGECKO_API_KEY || '';

async function fetchMarkets() {
  const params = new URLSearchParams({
    vs_currency: 'aud',
    order: 'market_cap_desc',
    per_page: '250',
    page: '1',
    sparkline: 'true',
    price_change_percentage: '1h,24h'
  });
  const url = `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`;
  const headers = { 'accept': 'application/json', 'User-Agent': USER_AGENT };
  if (API_KEY) headers['x-cg-demo-api-key'] = API_KEY;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data) || !data.length) throw new Error('Empty or malformed response');
  return data;
}

async function buildSnapshot() {
  const coins = await fetchMarkets();

  const assets = coins.map(snapshotRow);

  const snapshot = {
    schema: 'sixquant.crypto.snapshot.v1',
    source: 'CoinGecko via GitHub Actions',
    lastUpdated: new Date().toISOString(),
    count: assets.length,
    data: assets
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`Crypto snapshot written: ${assets.length} assets`);
}

buildSnapshot().catch(error => {
  console.error('Snapshot generation failed:', error.message);
  process.exit(1);
});
