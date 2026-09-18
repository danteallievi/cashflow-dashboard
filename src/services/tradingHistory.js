import { round, toNumber } from '../utils/numbers.js';

const USD_ASSETS = new Set(['USD', 'USDT', 'USDC', 'FDUSD']);

function eventKey(event) {
  const tradeId = String(event.tradeId || '').trim();
  if (tradeId && tradeId !== '0') {
    return `${event.exchange}:${event.marketType}:${event.symbol}:${tradeId}`;
  }

  return [
    event.exchange,
    event.marketType,
    event.symbol,
    event.transactionId,
    event.timestamp,
  ].join(':');
}

function usdValue(amount, asset, btcPriceUsd) {
  if (USD_ASSETS.has(asset)) return amount;
  if (asset === 'BTC' && btcPriceUsd) return amount * btcPriceUsd;
  return null;
}

export function buildTradingHistory(events, btcPriceUsd, metadata = {}) {
  const groups = new Map();

  for (const event of events || []) {
    const incomeType = String(event.incomeType || '').toUpperCase();
    if (!['REALIZED_PNL', 'COMMISSION', 'TRADING_FEE'].includes(incomeType)) continue;

    const key = eventKey(event);
    const current = groups.get(key) || {
      id: key,
      exchange: event.exchange,
      marketType: event.marketType,
      symbol: event.symbol,
      timestamp: 0,
      tradeId: String(event.tradeId || event.transactionId || ''),
      asset: String(event.asset || '').toUpperCase(),
      realizedPnl: 0,
      fee: 0,
      hasRealizedPnl: false,
    };

    current.timestamp = Math.max(current.timestamp, toNumber(event.timestamp));
    current.symbol ||= event.symbol;
    current.asset ||= String(event.asset || '').toUpperCase();

    if (incomeType === 'REALIZED_PNL') {
      current.realizedPnl += toNumber(event.amount);
      current.hasRealizedPnl = true;
    } else {
      current.fee += Math.abs(toNumber(event.amount));
    }

    groups.set(key, current);
  }

  const trades = [...groups.values()]
    .filter((trade) => trade.hasRealizedPnl)
    .map((trade) => {
      const netPnl = trade.realizedPnl - trade.fee;
      return {
        ...trade,
        realizedPnl: round(trade.realizedPnl, 12),
        fee: round(trade.fee, 12),
        netPnl: round(netPnl, 12),
        realizedPnlUsd: round(usdValue(trade.realizedPnl, trade.asset, btcPriceUsd), 2),
        feeUsd: round(usdValue(trade.fee, trade.asset, btcPriceUsd), 2),
        netPnlUsd: round(usdValue(netPnl, trade.asset, btcPriceUsd), 2),
        usdEstimated: trade.asset === 'BTC',
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp || b.id.localeCompare(a.id));

  const pricedTrades = trades.filter((trade) => trade.netPnlUsd != null);
  const winningTrades = pricedTrades.filter((trade) => trade.netPnlUsd > 0).length;
  const losingTrades = pricedTrades.filter((trade) => trade.netPnlUsd < 0).length;
  const decidedTrades = winningTrades + losingTrades;
  const unpricedAssets = [...new Set(
    trades.filter((trade) => trade.netPnlUsd == null).map((trade) => trade.asset),
  )].filter(Boolean);

  return {
    period: {
      days: metadata.days ?? 90,
      startAt: metadata.startAt ?? null,
      endAt: metadata.endAt ?? null,
      complete: metadata.complete ?? true,
    },
    summary: {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      breakevenTrades: pricedTrades.length - decidedTrades,
      winRatePercent: decidedTrades ? round((winningTrades / decidedTrades) * 100, 2) : null,
      grossProfitUsd: round(
        pricedTrades.reduce((sum, trade) => sum + Math.max(0, trade.netPnlUsd), 0),
        2,
      ),
      grossLossUsd: round(
        pricedTrades.reduce((sum, trade) => sum + Math.min(0, trade.netPnlUsd), 0),
        2,
      ),
      feesUsd: round(
        trades.reduce((sum, trade) => sum + (trade.feeUsd ?? 0), 0),
        2,
      ),
      netPnlUsd: round(
        pricedTrades.reduce((sum, trade) => sum + trade.netPnlUsd, 0),
        2,
      ),
      unpricedTrades: trades.length - pricedTrades.length,
      unpricedAssets,
    },
    trades,
  };
}
