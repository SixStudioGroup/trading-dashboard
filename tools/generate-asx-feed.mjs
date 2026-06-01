import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'asx-feed.json');
const USER_AGENT = 'SixSignal-Terminal-ASX-Feed/2.0';

const ASX_UNIVERSE = [
  ['BHP', 'BHP Group', 'Materials'],
  ['CBA', 'Commonwealth Bank of Australia', 'Financials'],
  ['CSL', 'CSL', 'Health Care'],
  ['NAB', 'National Australia Bank', 'Financials'],
  ['WBC', 'Westpac Banking Corporation', 'Financials'],
  ['ANZ', 'ANZ Group Holdings', 'Financials'],
  ['MQG', 'Macquarie Group', 'Financials'],
  ['WES', 'Wesfarmers', 'Consumer Discretionary'],
  ['WOW', 'Woolworths Group', 'Consumer Staples'],
  ['TLS', 'Telstra Group', 'Communication Services'],
  ['RIO', 'Rio Tinto', 'Materials'],
  ['FMG', 'Fortescue', 'Materials'],
  ['GMG', 'Goodman Group', 'Real Estate'],
  ['TCL', 'Transurban Group', 'Industrials'],
  ['ALL', 'Aristocrat Leisure', 'Consumer Discretionary'],
  ['QBE', 'QBE Insurance Group', 'Financials'],
  ['COL', 'Coles Group', 'Consumer Staples'],
  ['STO', 'Santos', 'Energy'],
  ['WDS', 'Woodside Energy Group', 'Energy'],
  ['XRO', 'Xero', 'Information Technology'],
  ['REA', 'REA Group', 'Communication Services'],
  ['RMD', 'ResMed', 'Health Care'],
  ['SUN', 'Suncorp Group', 'Financials'],
  ['IAG', 'Insurance Australia Group', 'Financials'],
  ['BXB', 'Brambles', 'Industrials'],
  ['CPU', 'Computershare', 'Industrials'],
  ['COH', 'Cochlear', 'Health Care'],
  ['SHL', 'Sonic Healthcare', 'Health Care'],
  ['NST', 'Northern Star Resources', 'Materials'],
  ['EVN', 'Evolution Mining', 'Materials'],
  ['ORG', 'Origin Energy', 'Utilities'],
  ['APA', 'APA Group', 'Utilities'],
  ['DMP', 'Domino’s Pizza Enterprises', 'Consumer Discretionary'],
  ['JBH', 'JB Hi-Fi', 'Consumer Discretionary'],
  ['CAR', 'CAR Group', 'Communication Services'],
  ['SEK', 'SEEK', 'Communication Services'],
  ['MIN', 'Mineral Resources', 'Materials'],
  ['S32', 'South32', 'Materials'],
  ['QAN', 'Qantas Airways', 'Industrials'],
  ['A2M', 'The a2 Milk Company', 'Consumer Staples']
];

function pctChange(now, before) {
  if (!Number.isFinite(now) || !Number.isFinite(before) || before <= 0) return 0;
  return ((now - before) / before) * 100;
}

function marketRegime(change5d) {
  if (change5d >= 1.5) return 'Constructive';
  if (change5d <= -1.5) return 'Defensive';
  return 'Mixed';
}

function signalState(change1d, change5d, relativeVolume) {
  if (change1d <= -2.5 || change5d <= -5) return 'Sell Risk';
  if (relativeVolume >= 1.5 && change1d > 0) return 'Volume Spike';
  if (change1d > 0.75 && change5d > 1.5) return 'Breakout';
  if (Math.abs(change1d) <= 1.5 || change5d > 0) return 'Watch';
  return 'No Action';
}

function riskState(change1d, change5d, relativeVolume) {
  if (Math.abs(change1d) >= 3.5 || change5d <= -5) return 'Elevated';
  if (relativeVolume >= 1.8 || Math.abs(change5d) >= 3) return 'Review';
  if (change5d >= 1 && change1d >= 0) return 'Controlled';
  return 'Normal';
}

async function fetchYahooChart(symbol) {
  const yahooSymbol = `${symbol}.AX`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=10d&interval=1d`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${symbol}: provider HTTP ${response.status}`);
  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const closes = (quote?.close || []).filter(Number.isFinite);
  const volumes = (quote?.volume || []).filter(Number.isFinite);
  if (closes.length < 2) throw new Error(`${symbol}: insufficient provider history`);
  const price = closes.at(-1);
  const prior = closes.at(-2);
  const fivePrior = closes.length >= 6 ? closes.at(-6) : closes[0];
  const avgVolume = volumes.length > 1 ? volumes.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, volumes.length - 1) : 0;
  const latestVolume = volumes.at(-1) || 0;
  const relativeVolume = avgVolume > 0 ? latestVolume / avgVolume : 1;
  return { price, change1d: pctChange(price, prior), change5d: pctChange(price, fivePrior), relativeVolume };
}

async function buildFeed() {
  const assets = [];
  const fetchErrors = [];
  for (const [symbol, name, sector] of ASX_UNIVERSE) {
    try {
      const data = await fetchYahooChart(symbol);
      const change1d = Number(data.change1d.toFixed(2));
      const change5d = Number(data.change5d.toFixed(2));
      const relativeVolume = Number(data.relativeVolume.toFixed(2));
      assets.push({
        symbol,
        name,
        exchange: 'ASX',
        sector,
        price: Number(data.price.toFixed(3)),
        change1d,
        change5d,
        relativeVolume,
        marketRegime: marketRegime(change5d),
        region: 'Australia',
        currency: 'AUD',
        signalState: signalState(change1d, change5d, relativeVolume),
        riskState: riskState(change1d, change5d, relativeVolume)
      });
    } catch (error) {
      fetchErrors.push({ symbol, message: error.message });
    }
  }

  const feed = {
    schema: 'sixsignal.asx.feed.v2',
    source: 'Yahoo Finance chart endpoint via GitHub Action',
    mode: assets.length ? 'delayed' : 'offline',
    lastUpdated: new Date().toISOString(),
    symbols: ASX_UNIVERSE.map(([symbol]) => symbol),
    fetchErrors,
    marketRegimes: {
      Constructive: assets.filter(asset => asset.marketRegime === 'Constructive').length,
      Mixed: assets.filter(asset => asset.marketRegime === 'Mixed').length,
      Defensive: assets.filter(asset => asset.marketRegime === 'Defensive').length
    },
    assets
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
  console.log(`ASX feed generated: ${assets.length} assets, ${fetchErrors.length} errors`);
  if (!assets.length) process.exitCode = 1;
}

buildFeed().catch(error => {
  console.error(error);
  process.exit(1);
});
