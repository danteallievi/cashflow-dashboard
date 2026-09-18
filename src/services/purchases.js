import { round, toNumber } from '../utils/numbers.js';

export function buildPurchaseHistory(trades) {
  const orders = new Map();

  for (const trade of trades || []) {
    if (String(trade.side || '').toUpperCase() !== 'BUY') continue;

    const quantity = Math.max(0, toNumber(trade.quantity ?? trade.btcQty));
    const priceUsd = Math.max(0, toNumber(trade.priceUsd));
    if (!quantity || !priceUsd) continue;

    const quoteQuantity = Math.max(0, toNumber(trade.quoteQuantity)) || quantity * priceUsd;
    const orderId = String(trade.orderId ?? trade.id);
    const key = `${trade.exchange || 'unknown'}:${trade.symbol || 'unknown'}:${orderId}`;
    const current = orders.get(key) || {
      id: orderId,
      exchange: trade.exchange,
      symbol: trade.symbol,
      asset: trade.asset,
      quoteAsset: trade.quoteAsset,
      timestamp: 0,
      quantity: 0,
      quoteQuantity: 0,
      fills: 0,
    };

    current.timestamp = Math.max(current.timestamp, toNumber(trade.timestamp));
    current.quantity += quantity;
    current.quoteQuantity += quoteQuantity;
    current.fills += 1;
    orders.set(key, current);
  }

  return [...orders.values()]
    .map((order) => ({
      ...order,
      quantity: round(order.quantity, 12),
      quoteQuantity: round(order.quoteQuantity, 8),
      averagePriceUsd: order.quantity > 0
        ? round(order.quoteQuantity / order.quantity, 8)
        : null,
    }))
    .sort((a, b) => b.timestamp - a.timestamp || b.id.localeCompare(a.id));
}
