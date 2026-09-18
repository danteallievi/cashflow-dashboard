import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPurchaseHistory } from '../src/services/purchases.js';

test('groups partial fills into one purchase order with a weighted price', () => {
  const purchases = buildPurchaseHistory([
    { id: '1', orderId: '42', exchange: 'binance', symbol: 'BTCUSDT', asset: 'BTC', quoteAsset: 'USDT', timestamp: 100, side: 'BUY', quantity: 0.01, priceUsd: 80_000, quoteQuantity: 800 },
    { id: '2', orderId: '42', exchange: 'binance', symbol: 'BTCUSDT', asset: 'BTC', quoteAsset: 'USDT', timestamp: 101, side: 'BUY', quantity: 0.02, priceUsd: 81_000, quoteQuantity: 1_620 },
    { id: '3', orderId: '43', exchange: 'binance', symbol: 'BTCUSDT', asset: 'BTC', quoteAsset: 'USDT', timestamp: 102, side: 'SELL', quantity: 0.01, priceUsd: 82_000, quoteQuantity: 820 },
  ]);

  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].id, '42');
  assert.equal(purchases[0].fills, 2);
  assert.equal(purchases[0].quantity, 0.03);
  assert.equal(purchases[0].quoteQuantity, 2420);
  assert.equal(purchases[0].averagePriceUsd, 80666.66666667);
  assert.equal(purchases[0].timestamp, 101);
});
