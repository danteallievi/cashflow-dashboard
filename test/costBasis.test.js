import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAssetAverageCost, calculateAverageCost } from '../src/services/costBasis.js';

function trade(id, timestamp, side, btcQty, priceUsd, extra = {}) {
  return { id, exchange: 'binance', timestamp, side, btcQty, priceUsd, ...extra };
}

test('calculates quantity-weighted average cost', () => {
  const result = calculateAverageCost([
    trade('1', 1, 'BUY', 0.01, 60_000),
    trade('2', 2, 'BUY', 0.02, 75_000),
  ]);
  assert.equal(result.trackedBtc, 0.03);
  assert.equal(result.averagePriceUsd, 70_000);
  assert.equal(result.totalCostUsd, 2_100);
});

test('partial sell removes BTC at the current average cost', () => {
  const result = calculateAverageCost([
    trade('1', 1, 'BUY', 0.01, 60_000),
    trade('2', 2, 'BUY', 0.02, 75_000),
    trade('3', 3, 'SELL', 0.01, 80_000),
  ]);
  assert.equal(result.trackedBtc, 0.02);
  assert.equal(result.averagePriceUsd, 70_000);
  assert.equal(result.totalCostUsd, 1_400);
});

test('full sell resets the cost basis', () => {
  const result = calculateAverageCost([
    trade('1', 1, 'BUY', 0.01, 60_000),
    trade('2', 2, 'SELL', 0.01, 61_000),
  ]);
  assert.equal(result.trackedBtc, 0);
  assert.equal(result.averagePriceUsd, null);
  assert.equal(result.totalCostUsd, 0);
});

test('buy after full sell starts a new cost basis', () => {
  const result = calculateAverageCost([
    trade('1', 1, 'BUY', 0.01, 60_000),
    trade('2', 2, 'SELL', 0.01, 61_000),
    trade('3', 3, 'BUY', 0.02, 75_000),
  ]);
  assert.equal(result.trackedBtc, 0.02);
  assert.equal(result.averagePriceUsd, 75_000);
  assert.equal(result.totalCostUsd, 1_500);
});

test('sorts trades chronologically and deduplicates exchange trade IDs', () => {
  const result = calculateAverageCost([
    trade('2', 2, 'BUY', 0.02, 75_000),
    trade('1', 1, 'BUY', 0.01, 60_000),
    trade('1', 1, 'BUY', 0.01, 60_000),
  ]);
  assert.equal(result.trackedBtc, 0.03);
  assert.equal(result.averagePriceUsd, 70_000);
});

test('includes simple BTC and quote-currency fees', () => {
  const result = calculateAverageCost([
    trade('1', 1, 'BUY', 0.01, 60_000, { fee: 0.00001, feeAsset: 'BTC' }),
    trade('2', 2, 'BUY', 0.01, 70_000, { fee: 0.7, feeAsset: 'USDT' }),
  ]);
  assert.equal(result.trackedBtc, 0.01999);
  assert.equal(result.totalCostUsd, 1300.7);
});

test('calculates average cost for a non-BTC Spot asset', () => {
  const result = calculateAssetAverageCost([
    { id: 'sol-1', exchange: 'bingx', timestamp: 1, side: 'BUY', asset: 'SOL', quantity: 10, priceUsd: 90 },
    { id: 'sol-2', exchange: 'bingx', timestamp: 2, side: 'BUY', asset: 'SOL', quantity: 5, priceUsd: 120 },
  ], 'SOL');

  assert.equal(result.trackedQuantity, 15);
  assert.equal(result.averagePriceUsd, 100);
  assert.equal(result.totalCostUsd, 1500);
});

test('subtracts fees paid in the purchased Spot asset', () => {
  const result = calculateAssetAverageCost([
    { id: 'eth-1', exchange: 'binance', timestamp: 1, side: 'BUY', asset: 'ETH', quantity: 1, priceUsd: 2500, fee: 0.001, feeAsset: 'ETH' },
  ], 'ETH');

  assert.equal(result.trackedQuantity, 0.999);
  assert.equal(result.totalCostUsd, 2500);
  assert.equal(result.averagePriceUsd, 2502.5025025);
});

test('keeps equal trade IDs when they belong to different Spot symbols', () => {
  const result = calculateAssetAverageCost([
    { id: '10', symbol: 'SOLUSDT', exchange: 'binance', timestamp: 1, side: 'BUY', asset: 'SOL', quantity: 1, priceUsd: 100 },
    { id: '10', symbol: 'SOLUSDC', exchange: 'binance', timestamp: 2, side: 'BUY', asset: 'SOL', quantity: 1, priceUsd: 120 },
  ], 'SOL');

  assert.equal(result.trackedQuantity, 2);
  assert.equal(result.averagePriceUsd, 110);
});
