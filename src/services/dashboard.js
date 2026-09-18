import { getBinanceBtcPrice, getBinanceSnapshot } from '../exchanges/binance.js';
import { getBingxSnapshot } from '../exchanges/bingx.js';
import { calculateAssetAverageCost, calculateAverageCost } from './costBasis.js';
import { buildPurchaseHistory } from './purchases.js';
import { calculateBtcOverview } from './btcOverview.js';
import { buildTradingHistory } from './tradingHistory.js';
import { nearlyEqual, round } from '../utils/numbers.js';
import { safeError } from '../utils/errors.js';

const cache = {
  market: null,
  binance: null,
  bingx: null,
};

function sourceResult(name, result, now) {
  if (result.status === 'fulfilled') {
    cache[name] = result.value;
    return {
      snapshot: result.value,
      status: { ok: true, stale: false, updatedAt: result.value.updatedAt || now, error: null },
    };
  }

  const previous = cache[name];
  return {
    snapshot: previous,
    status: {
      ok: false,
      stale: Boolean(previous),
      updatedAt: previous?.updatedAt || null,
      error: safeError(result.reason),
    },
  };
}

function calculateSpot(spotBtc, trades, btcPriceUsd, warnings) {
  const basis = calculateAverageCost(trades);
  warnings.push(...basis.warnings);

  if (!nearlyEqual(spotBtc, basis.trackedBtc, 0.0000001)) {
    warnings.push(
      'El balance Spot real no coincide con el historial de trades disponible. El precio promedio es estimado.',
    );
  }

  if (!basis.averagePriceUsd || !btcPriceUsd) {
    return {
      btc: round(spotBtc, 8),
      trackedBtc: basis.trackedBtc,
      averageBuyPriceUsd: basis.averagePriceUsd,
      estimatedCostUsd: null,
      currentValueUsd: btcPriceUsd ? round(spotBtc * btcPriceUsd, 2) : null,
      estimatedPnlUsd: null,
      estimatedPnlPercent: null,
    };
  }

  const estimatedCostUsd = spotBtc * basis.averagePriceUsd;
  const currentValueUsd = spotBtc * btcPriceUsd;
  return {
    btc: round(spotBtc, 8),
    trackedBtc: basis.trackedBtc,
    averageBuyPriceUsd: basis.averagePriceUsd,
    estimatedCostUsd: round(estimatedCostUsd, 2),
    currentValueUsd: round(currentValueUsd, 2),
    estimatedPnlUsd: round(currentValueUsd - estimatedCostUsd, 2),
    estimatedPnlPercent: round((currentValueUsd / estimatedCostUsd - 1) * 100, 2),
  };
}

function calculateSpotAsset(rawAsset, warnings) {
  const basis = calculateAssetAverageCost(rawAsset.trades, rawAsset.asset);
  warnings.push(...basis.warnings);

  if (!nearlyEqual(rawAsset.quantity, basis.trackedQuantity, 0.0000001)) {
    warnings.push(
      `${rawAsset.exchange} ${rawAsset.asset}: el balance Spot no coincide con el historial disponible.`,
    );
  }

  const quantity = round(rawAsset.quantity, 12);
  const currentPriceUsd = rawAsset.currentPriceUsd
    ? round(rawAsset.currentPriceUsd, 8)
    : null;
  const averageBuyPriceUsd = basis.averagePriceUsd;
  const estimatedCostUsd = averageBuyPriceUsd ? quantity * averageBuyPriceUsd : null;
  const currentValueUsd = currentPriceUsd ? quantity * currentPriceUsd : null;
  const estimatedPnlUsd = estimatedCostUsd && currentValueUsd != null
    ? currentValueUsd - estimatedCostUsd
    : null;

  return {
    exchange: rawAsset.exchange,
    asset: rawAsset.asset,
    quantity,
    quoteAsset: rawAsset.quoteAsset,
    trackedQuantity: basis.trackedQuantity,
    averageBuyPriceUsd,
    currentPriceUsd,
    estimatedCostUsd: estimatedCostUsd == null ? null : round(estimatedCostUsd, 2),
    currentValueUsd: currentValueUsd == null ? null : round(currentValueUsd, 2),
    estimatedPnlUsd: estimatedPnlUsd == null ? null : round(estimatedPnlUsd, 2),
    estimatedPnlPercent: estimatedPnlUsd == null || !estimatedCostUsd
      ? null
      : round((currentValueUsd / estimatedCostUsd - 1) * 100, 2),
    historyComplete: rawAsset.historyComplete,
    purchases: buildPurchaseHistory(rawAsset.trades),
  };
}

export async function buildDashboard() {
  console.info('[dashboard] update started');
  const now = new Date().toISOString();
  const [priceResult, binanceResult, bingxResult] = await Promise.allSettled([
    getBinanceBtcPrice(),
    getBinanceSnapshot(),
    getBingxSnapshot(),
  ]);

  if (priceResult.status === 'fulfilled') cache.market = priceResult.value;
  const btcPriceUsd = priceResult.status === 'fulfilled' ? priceResult.value : cache.market;
  const binance = sourceResult('binance', binanceResult, now);
  const bingx = sourceResult('bingx', bingxResult, now);
  const snapshots = [binance.snapshot, bingx.snapshot].filter(Boolean);

  const warnings = snapshots.flatMap((snapshot) => snapshot.warnings || []);
  if (priceResult.status === 'rejected') {
    warnings.push(
      cache.market
        ? `Precio BTC sin actualizar: ${safeError(priceResult.reason)}`
        : `No se pudo obtener el precio BTC: ${safeError(priceResult.reason)}`,
    );
  }

  for (const snapshot of snapshots) {
    if (!snapshot.tradesComplete) {
      warnings.push(
        `${snapshot === binance.snapshot ? 'Binance' : 'BingX'}: el historial de trades puede estar incompleto.`,
      );
    }
  }

  const holdings = snapshots
    .flatMap((snapshot) => snapshot.holdings || [])
    .map((holding) => ({
      ...holding,
      btc: round(holding.btc, 8),
      usdValue: btcPriceUsd ? round(holding.btc * btcPriceUsd, 2) : null,
    }));
  const totalBtc = holdings.reduce((sum, holding) => sum + holding.btc, 0);
  const spotBtc = holdings
    .filter((holding) => holding.accountType === 'spot')
    .reduce((sum, holding) => sum + holding.btc, 0);
  const trades = snapshots.flatMap((snapshot) => snapshot.trades || []);
  const positions = snapshots.flatMap((snapshot) => snapshot.positions || []);
  const spot = calculateSpot(spotBtc, trades, btcPriceUsd, warnings);
  const collateralBtc = holdings
    .filter((holding) => holding.accountType === 'coin-m')
    .reduce((sum, holding) => sum + holding.btc, 0);
  const btcOverview = calculateBtcOverview({
    spotBtc,
    collateralBtc,
    positions,
    btcPriceUsd,
  });
  const spotAssets = snapshots
    .flatMap((snapshot) => snapshot.spotAssets || [])
    .map((asset) => calculateSpotAsset(asset, warnings))
    .sort((a, b) => (
      (b.currentValueUsd ?? -1) - (a.currentValueUsd ?? -1)
      || a.asset.localeCompare(b.asset)
    ));
  const rawTradingHistories = snapshots
    .map((snapshot) => snapshot.tradingHistory)
    .filter(Boolean);
  const tradingHistory = buildTradingHistory(
    rawTradingHistories.flatMap((history) => history.records || []),
    btcPriceUsd,
    {
      days: Math.max(90, ...rawTradingHistories.map((history) => history.days || 0)),
      startAt: rawTradingHistories
        .map((history) => history.startAt)
        .filter(Boolean)
        .sort()[0] || null,
      endAt: rawTradingHistories
        .map((history) => history.endAt)
        .filter(Boolean)
        .sort()
        .at(-1) || null,
      complete: snapshots.length === 2
        && rawTradingHistories.length === 2
        && rawTradingHistories.every((history) => history.complete),
    },
  );
  if (!tradingHistory.period.complete) {
    warnings.push('Trading History: una o más fuentes no pudieron confirmar el historial completo de 90 días.');
  }
  if (tradingHistory.summary.unpricedTrades) {
    warnings.push(
      `Trading History: ${tradingHistory.summary.unpricedTrades} cierres no pudieron convertirse a USD (${tradingHistory.summary.unpricedAssets.join(', ')}).`,
    );
  }

  console.info('[dashboard] update completed');
  return {
    updatedAt: now,
    market: { btcPriceUsd: btcPriceUsd ? round(btcPriceUsd, 2) : null },
    portfolio: {
      totalBtc: round(totalBtc, 8),
      totalUsd: btcPriceUsd ? round(totalBtc * btcPriceUsd, 2) : null,
      spotBtc: round(spotBtc, 8),
      spotUsd: btcPriceUsd ? round(spotBtc * btcPriceUsd, 2) : null,
    },
    holdings,
    spot,
    btcOverview,
    spotAssets,
    positions,
    tradingHistory,
    sources: {
      binance: binance.status,
      bingx: bingx.status,
    },
    warnings: [...new Set(warnings)],
  };
}
