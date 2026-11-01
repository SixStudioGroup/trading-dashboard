// scripts/test_core.mjs: tests for sq-core.js and tools/asx-bars.mjs.
// Run: node scripts/test_core.mjs   (exit 0 = pass, non-zero = fail)
import { createRequire } from 'node:module';
import { dailyBarsFromYahoo, barMetrics, sessionDateOf } from '../tools/asx-bars.mjs';

const require = createRequire(import.meta.url);
const SQ = require('../sq-core.js');

let passed = 0;
const failures = [];
const ok = (name, cond, detail = '') => { if (cond) passed += 1; else failures.push(`${name} ${detail}`); };
const near = (a, b, tol = 0.005) => Math.abs(a - b) <= tol;

// --- Yahoo duplicate session bar: real shape captured on 1 Nov 2026 (BHP.AX) ---
{
  const t = s => Date.parse(s) / 1000;
  const result = {
    timestamp: [t('2026-10-27T23:00:00Z'), t('2026-10-28T23:00:00Z'), t('2026-10-29T23:00:00Z'), t('2026-10-30T05:20:58Z')],
    indicators: { quote: [{ open: [58, 57.9, 57.5, 57.5], high: [58.5, 58, 58, 57.7], low: [57.5, 57, 57, 57.2], close: [58.04, 57.52, 57.56, 57.56], volume: [7406358, 7359006, 8803951, 8247234] }] }
  };
  const bars = dailyBarsFromYahoo(result);
  ok('dedupe: one bar per Sydney session', bars.length === 3, `got ${bars.length}`);
  ok('dedupe: last session is 30 Oct', bars.at(-1).date === '2026-10-30', bars.at(-1).date);
  ok('dedupe: keeps larger volume', bars.at(-1).volume === 8803951);
  const m = barMetrics(bars);
  ok('dedupe: change1d is the real move, not zero', near(m.change1d, ((57.56 - 57.52) / 57.52) * 100), String(m.change1d));
  ok('metrics: last bar date', m.lastBarDate === '2026-10-30');
}
{
  const bars = Array.from({ length: 260 }, (_, i) => ({ date: `D${String(i).padStart(3, '0')}`, open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 1000 }));
  const m = barMetrics(bars);
  ok('metrics: ma20', near(m.ma20, 349.5));
  ok('metrics: ma50', near(m.ma50, 334.5));
  ok('metrics: ma200', near(m.ma200, 259.5));
  ok('metrics: atr14 is 2 on this ramp', near(m.atr14, 2));
  ok('metrics: uptrend', m.trend === 'Up');
  ok('metrics: full 5D window', m.change5dPartial === false);
  ok('metrics: relVol 1 on flat volume', near(m.relativeVolume, 1));
  ok('metrics: high20 excludes today', m.high20 === 101 + 258);
  ok('session date is the majority', sessionDateOf([{ lastBarDate: '2026-10-30' }, { lastBarDate: '2026-10-30' }, { lastBarDate: '2026-10-29' }]) === '2026-10-30');
}

// --- Data trust ---------------------------------------------------------------
{
  const feed = (lastSessionDate, extra = {}) => ({ mode: 'delayed', assets: [{}], lastSessionDate, asxHolidays: ['2026-12-25', '2026-12-28'], ...extra });
  const at = s => new Date(s);
  // Sunday 1 Nov 2026, Sydney: Friday's close is current. No weekend false alarm.
  let f = SQ.asxFreshness(feed('2026-10-30'), at('2026-11-01T06:00:00Z'));
  ok('weekend: Friday close is current', f.state === 'current' && !f.blocks, f.state);
  // Monday 2 Nov 09:00 Sydney, before the open: still current.
  f = SQ.asxFreshness(feed('2026-10-30'), at('2026-11-01T22:00:00Z'));
  ok('Monday pre-open: Friday close is current', f.state === 'current', f.state);
  // Monday 18:00 Sydney with no Monday bar: one behind, does not block.
  f = SQ.asxFreshness(feed('2026-10-30'), at('2026-11-02T07:00:00Z'));
  ok('Monday evening without bar: behind', f.state === 'behind' && !f.blocks, f.state);
  // Wednesday evening with Friday's bar: stale and blocking.
  f = SQ.asxFreshness(feed('2026-10-30'), at('2026-11-04T07:00:00Z'));
  ok('three sessions behind: stale and blocks', f.state === 'stale' && f.blocks, f.state);
  // Monday 13:00 Sydney with Monday's partial bar: provisional.
  f = SQ.asxFreshness(feed('2026-11-02'), at('2026-11-02T02:00:00Z'));
  ok('part-session is flagged', f.state === 'current' && f.intraday === true);
  // Holidays are not counted: Christmas plus Boxing Day observed.
  f = SQ.asxFreshness(feed('2026-12-24'), at('2026-12-28T22:00:00Z'));
  ok('holidays do not make data stale', f.state === 'current', f.state);
  f = SQ.asxFreshness({ mode: 'offline', assets: [] }, at('2026-11-01T06:00:00Z'));
  ok('offline blocks', f.state === 'offline' && f.blocks);
  f = SQ.asxFreshness({ mode: 'delayed', assets: [{}] }, at('2026-11-01T06:00:00Z'));
  ok('feed without a session date blocks', f.blocks);

  const c = h => SQ.cryptoFreshness(new Date(Date.parse('2026-11-01T00:00:00Z') - h * 36e5).toISOString(), at('2026-11-01T00:00:00Z'));
  ok('crypto 3h current', c(3).state === 'current');
  ok('crypto 18h behind', c(18).state === 'behind' && !c(18).blocks);
  ok('crypto 132 days stale and blocks', c(132 * 24).state === 'stale' && c(132 * 24).blocks);
  ok('crypto stale label says stale', /STALE/.test(c(132 * 24).label));
  ok('crypto missing timestamp blocks', SQ.cryptoFreshness(null).blocks);
}

// --- Sizing ---------------------------------------------------------------------
{
  const base = { account: 50000, riskPercent: 1, entry: 40, stop: 38, target: 46, brokerageFee: 5, feePercent: 0, spreadPercent: 0.1, maxPositionPct: 100 };
  let s = SQ.sizePosition(base);
  // Budget 500, less 10 brokerage = 490; per share 2 + 0.04 = 2.04 -> 240 shares.
  ok('fee-aware units', s.units === 240, String(s.units));
  ok('position', near(s.position, 9600));
  ok('round trip cost', near(s.roundTripCost, 10 + 9.6));
  ok('worst case fits the budget', s.worstCaseLoss <= s.riskBudget, String(s.worstCaseLoss));
  ok('net reward', near(s.netReward, 240 * 6 - 19.6));
  ok('reward:risk net', near(s.rewardRisk, (1440 - 19.6) / (480 + 19.6)));
  ok('breakeven', near(s.breakeven, 40 + 19.6 / 240));
  s = SQ.sizePosition({ ...base, maxPositionPct: 8 });
  ok('position cap cuts size', s.units === 100 && s.cappedByPosition, String(s.units));
  ok('capped trade risks less than budget', s.worstCaseLoss < s.riskBudget);
  ok('stop above entry sizes to zero', SQ.sizePosition({ ...base, stop: 41 }).units === 0);
  ok('no stop sizes to zero', SQ.sizePosition({ ...base, stop: 0 }).units === 0);
  ok('fees bigger than budget size to zero', SQ.sizePosition({ ...base, account: 500 }).units === 0);
  ok('bad numbers are safe', SQ.sizePosition({ account: 'x', entry: null }).units === 0);
}

// --- Lifecycle --------------------------------------------------------------------
{
  const legacy = SQ.normalizeStockTrade({ id: 'STOCK-OLD', symbol: 'bhp', referencePrice: 40, positionSize: 1000, customField: 'keep' });
  ok('legacy plan loads as planned', legacy.status === 'planned');
  ok('legacy plan defaults to paper', legacy.mode === 'paper');
  ok('normalise keeps unknown fields', legacy.customField === 'keep');
  ok('normalise uppercases symbol', legacy.symbol === 'BHP');
  ok('ids are unique', SQ.tradeId() !== SQ.tradeId());

  const plan = SQ.normalizeStockTrade({ symbol: 'BHP', referencePrice: 40, invalidationPrice: 38, targetPrice: 46, units: 100, status: 'planned', brokerageFee: 5, feePercent: 0, spreadPercent: 0.1 });
  ok('enter requires a price', Boolean(SQ.markEntered(plan, {}).error));
  const open = SQ.markEntered(plan, { fillPrice: 40.5, units: 100 }).trade;
  ok('entered is open at fill', open.status === 'open' && open.fillPrice === 40.5 && open.positionSize === 4050);
  ok('close needs open status', Boolean(SQ.closeTrade(plan, { exitPrice: 45 }).error));
  ok('close needs a price', Boolean(SQ.closeTrade(open, {}).error));
  const win = SQ.closeTrade(open, { exitPrice: 45, feesPaid: 15, ruleFollowed: true }).trade;
  ok('net result after fees', near(win.resultAud, 450 - 15));
  ok('gross result', near(win.grossAud, 450));
  ok('R uses fill and stop', near(win.rMultiple, 435 / 250));
  const est = SQ.closeTrade(open, { exitPrice: 38 }).trade;
  ok('blank fees are estimated', near(est.feesPaid, 10 + 4050 * 0.001));
  ok('a stop-out is worse than -1R after fees', est.rMultiple < -1);
  ok('zero fees entered stay zero', SQ.closeTrade(open, { exitPrice: 45, feesPaid: 0 }).trade.feesPaid === 0);

  ok('status: stop', SQ.positionStatus(open, 37.9).state === 'stop');
  ok('status: target', SQ.positionStatus(open, 46.5).state === 'target');
  ok('status: in plan', SQ.positionStatus(open, 41).state === 'ok');
  ok('status: near stop', SQ.positionStatus(open, 38.2).state === 'near');
  ok('status: open R', near(SQ.positionStatus(open, 43).openR, 1));
  ok('status: no price', SQ.positionStatus(open, 0).state === 'unknown');
  const exp = SQ.openExposure([open, plan, win]);
  ok('exposure counts open and planned only', exp.count === 2);
  ok('exposure capital', near(exp.capital, 4050 + 4000));
  ok('exposure risk', near(exp.risk, 250 + 200));
}

// --- Checks --------------------------------------------------------------------------
{
  const size = SQ.sizePosition({ account: 50000, riskPercent: 1, entry: 40, stop: 38, target: 46, brokerageFee: 5, spreadPercent: 0.1, maxPositionPct: 8 });
  const plan = { symbol: 'BHP', sector: 'Materials', account: 50000, entry: 40, stop: 38, target: 46, whyNow: 'Pullback to rising 50-day', trigger: 'Close above 41', size };
  const fresh = { state: 'current', blocks: false, label: 'ok' };
  const by = (list, id) => list.find(c => c.id === id);
  let checks = SQ.planChecks(plan, { freshness: fresh, trades: [] });
  ok('checks: clean plan has no fails', !checks.some(c => c.status === 'fail'), JSON.stringify(checks.filter(c => c.status === 'fail')));
  ok('checks: manual items hold it back', !SQ.checksPass(checks, []));
  ok('checks: passes once manual items are done', SQ.checksPass(checks, ['live-price', 'news']));
  checks = SQ.planChecks(plan, { freshness: { state: 'stale', blocks: true, label: 'stale' }, trades: [] });
  ok('checks: stale data fails', by(checks, 'data').status === 'fail' && !SQ.checksPass(checks, ['live-price', 'news']));
  checks = SQ.planChecks({ ...plan, whyNow: '' }, { freshness: fresh, trades: [] });
  ok('checks: empty thesis fails', by(checks, 'thesis').status === 'fail');
  checks = SQ.planChecks({ ...plan, stop: 41 }, { freshness: fresh, trades: [] });
  ok('checks: stop above entry fails', by(checks, 'stop').status === 'fail');
  checks = SQ.planChecks(plan, { freshness: fresh, trades: [{ symbol: 'BHP', status: 'open', units: 1, referencePrice: 1 }] });
  ok('checks: duplicate ticker fails', by(checks, 'duplicate').status === 'fail');
  const heavy = Array.from({ length: 4 }, (_, i) => ({ symbol: `X${i}`, status: 'open', units: 400, referencePrice: 20, invalidationPrice: 18 }));
  checks = SQ.planChecks(plan, { freshness: fresh, trades: heavy });
  ok('checks: open risk limit fails', by(checks, 'heat').status === 'fail', by(checks, 'heat').detail);
  const big = Array.from({ length: 10 }, (_, i) => ({ symbol: `Y${i}`, status: 'open', units: 100, referencePrice: 40 }));
  checks = SQ.planChecks(plan, { freshness: fresh, trades: big });
  ok('checks: cash reserve fails', by(checks, 'reserve').status === 'fail', by(checks, 'reserve').detail);
  checks = SQ.planChecks(plan, { freshness: fresh, trades: [], stock: { price: 30, ma50: 40, signalState: 'Sell Risk' } });
  ok('checks: below 50-day warns, does not block', by(checks, 'trend').status === 'warn');
  ok('checks: Sell Risk warns', by(checks, 'signal').status === 'warn');
}

// --- Review ---------------------------------------------------------------------------
{
  const t = (r, aud, followed = true, mode = 'paper') => ({ status: 'closed', rMultiple: r, resultAud: aud, feesPaid: 10, ruleFollowed: followed, mode, exitDate: '2026-11-02' });
  const stats = SQ.tradeStats([t(2, 200), t(-1, -100), t(-1, -100), { status: 'open' }]);
  ok('stats: closed only', stats.count === 3);
  ok('stats: win rate', near(stats.winRate, 100 / 3));
  ok('stats: expectancy', near(stats.expectancyR, 0));
  ok('stats: net', near(stats.netAud, 0));
  ok('stats: max drawdown', near(stats.maxDrawdownR, 2));
  ok('stats: unreliable under 30', stats.reliable === false);
  ok('stats: empty is safe', SQ.tradeStats([]).count === 0);
  let g = SQ.graduation([t(1, 100)]);
  ok('graduation: one trade is not enough', !g.met);
  g = SQ.graduation(Array.from({ length: 30 }, () => t(0.5, 50)));
  ok('graduation: 30 positive and followed passes', g.met);
  g = SQ.graduation(Array.from({ length: 30 }, () => t(-0.1, -10)));
  ok('graduation: negative expectancy fails', !g.met);
  g = SQ.graduation(Array.from({ length: 30 }, () => t(0.5, 50, false)));
  ok('graduation: low adherence fails', !g.met);
  g = SQ.graduation(Array.from({ length: 30 }, () => t(0.5, 50, true, 'live')));
  ok('graduation: live trades do not count as paper', !g.met);
}

// --- Chart, backup, CSV -----------------------------------------------------------------
{
  const series = Array.from({ length: 120 }, (_, i) => [`2026-01-${i}`, 100 + Math.sin(i / 5) * 5]);
  const svg = SQ.chartSvg(series, { entry: 104, stop: 96, target: 112 });
  ok('chart: renders an svg with levels', svg.startsWith('<svg') && (svg.match(/sq-level /g) || []).length === 3);
  ok('chart: no NaN coordinates', !svg.includes('NaN'));
  ok('chart: too little data is empty', SQ.chartSvg([[1, 2]]) === '');
  ok('chart: moving average', near(SQ.movingAverage([1, 2, 3, 4], 2)[3], 3.5) && SQ.movingAverage([1, 2], 2)[0] === null);

  const mem = () => {
    const m = new Map();
    return { get length() { return m.size; }, key: i => [...m.keys()][i], getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
  };
  const a = mem();
  a.setItem(SQ.KEYS.stockPlans, JSON.stringify([{ id: 'A' }, { id: 'B' }]));
  a.setItem(SQ.KEYS.githubPat, 'secret-token');
  a.setItem('unrelated.key', 'x');
  const backup = SQ.buildBackup(a);
  ok('backup: holds records', backup.data[SQ.KEYS.stockPlans].includes('"A"'));
  ok('backup: never contains the GitHub token', !JSON.stringify(backup).includes('secret-token'));
  ok('backup: ignores other apps', !('unrelated.key' in backup.data));
  ok('import: rejects junk', Boolean(SQ.parseBackup('nope').error) && Boolean(SQ.parseBackup('{"a":1}').error));
  const parsed = SQ.parseBackup(JSON.stringify({ ...backup, data: { ...backup.data, [SQ.KEYS.githubPat]: 'evil', 'other.key': 'x' } }));
  ok('import: counts trades', parsed.stockTrades === 2);
  ok('import: cannot set the token or foreign keys', parsed.entries.every(([k]) => k !== SQ.KEYS.githubPat && k.startsWith('sixquant.')));
  const b = mem();
  b.setItem(SQ.KEYS.stockPlans, '[{"id":"OLD"}]');
  SQ.restoreBackup(b, parsed.entries);
  ok('restore: replaces records', b.getItem(SQ.KEYS.stockPlans).includes('"A"'));
  ok('restore: keeps the prior state', b.getItem(SQ.KEYS.preImport).includes('OLD'));

  const csv = SQ.tradesToCsv([{ symbol: 'BHP', whyNow: 'a, "b"', resultAud: -12.5, lessonLearned: '=HYPERLINK("x")' }]);
  ok('csv: quotes commas', csv.includes('"a, ""b"""'));
  ok('csv: negative numbers stay numeric', csv.includes(',-12.5,'));
  ok('csv: neutralises spreadsheet formulas', csv.includes("'=HYPERLINK") && !/,=HYPERLINK/.test(csv));
}

console.log(`core tests: ${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach(f => console.log(`  x ${f}`)); process.exit(1); }
