import { round, toNumber } from '../utils/numbers.js';

const QUOTE_ASSETS = new Set(['USD', 'USDT', 'USDC', 'FDUSD']);

function normalizedTrade(trade) {
  return {
    ...trade,
    timestamp: toNumber(trade.timestamp),
    quantity: Math.max(0, toNumber(trade.quantity ?? trade.btcQty)),
    priceUsd: Math.max(0, toNumber(trade.priceUsd)),
    fee: Math.max(0, toNumber(trade.fee)),
    feeAsset: String(trade.feeAsset || '').toUpperCase(),
    side: String(trade.side || '').toUpperCase(),
  };
}

export function calculateAssetAverageCost(trades, asset) {
  const normalizedAsset = String(asset || '').toUpperCase();
  const unique = new Map();
  for (const rawTrade of trades || []) {
    const trade = normalizedTrade(rawTrade);
    const key = `${trade.exchange || 'unknown'}:${trade.symbol || 'unknown'}:${trade.id}`;
    if (!unique.has(key)) unique.set(key, trade);
  }

  const ordered = [...unique.values()].sort(
    (a, b) => a.timestamp - b.timestamp || String(a.id).localeCompare(String(b.id)),
  );

  let quantity = 0;
  let totalCostUsd = 0;
  const warnings = [];

  for (const trade of ordered) {
    if (!trade.quantity || !trade.priceUsd || !['BUY', 'SELL'].includes(trade.side)) continue;

    if (trade.side === 'BUY') {
      const feeInAsset = trade.feeAsset === normalizedAsset ? trade.fee : 0;
      const feeInQuote = QUOTE_ASSETS.has(trade.feeAsset) ? trade.fee : 0;
      const acquiredQuantity = Math.max(0, trade.quantity - feeInAsset);
      quantity += acquiredQuantity;
      totalCostUsd += trade.quantity * trade.priceUsd + feeInQuote;
      continue;
    }

    const feeInAsset = trade.feeAsset === normalizedAsset ? trade.fee : 0;
    const disposedQuantity = trade.quantity + feeInAsset;
    if (quantity <= 1e-12) {
      warnings.push(`Sell ${trade.id} precedes the available tracked ${normalizedAsset} history.`);
      continue;
    }

    const averageCost = totalCostUsd / quantity;
    const qtyRemoved = Math.min(disposedQuantity, quantity);
    totalCostUsd -= qtyRemoved * averageCost;
    quantity -= qtyRemoved;

    if (disposedQuantity - qtyRemoved > 1e-8) {
      warnings.push(`Sell ${trade.id} exceeds the tracked ${normalizedAsset} quantity.`);
    }

    if (quantity <= 1e-12) {
      quantity = 0;
      totalCostUsd = 0;
    }
  }

  return {
    trackedQuantity: round(quantity, 12),
    averagePriceUsd: quantity > 0 ? round(totalCostUsd / quantity, 8) : null,
    totalCostUsd: round(totalCostUsd, 8),
    warnings,
  };
}

export function calculateAverageCost(trades) {
  const result = calculateAssetAverageCost(trades, 'BTC');
  return {
    trackedBtc: result.trackedQuantity,
    averagePriceUsd: result.averagePriceUsd,
    totalCostUsd: result.totalCostUsd,
    warnings: result.warnings,
  };
}
