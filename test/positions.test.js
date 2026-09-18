import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBinanceCoinMPosition,
  normalizeBinanceUsdtMPosition,
  normalizeBingxPosition,
} from '../src/services/positions.js';

function position(overrides = {}) {
  return {
    positionId: 'position-1',
    symbol: 'BTC-USDT',
    positionSide: 'LONG',
    positionAmt: '0.0386',
    avgPrice: '79226',
    initialMargin: '608.9880',
    unrealizedProfit: '-92.0687',
    liquidationPrice: '63544.4',
    leverage: 5,
    positionValue: '2967.26',
    currency: 'USDT',
    ...overrides,
  };
}

test('normalizes BTC and non-BTC BingX positions with their base-asset unit', () => {
  const btc = normalizeBingxPosition(position(), 76840.9);
  const sol = normalizeBingxPosition(position({
    positionId: 'position-2',
    symbol: 'SOL-USDT',
    positionAmt: '25.83',
    avgPrice: '104.108',
    positionValue: '2561.04',
  }), 99.189);

  assert.equal(btc.sizeUnit, 'BTC');
  assert.equal(btc.markPrice, 76840.9);
  assert.equal(sol.size, 25.83);
  assert.equal(sol.sizeUnit, 'SOL');
  assert.equal(sol.markPrice, 99.189);
});

test('ignores closed BingX positions with zero size', () => {
  assert.equal(normalizeBingxPosition(position({ positionAmt: '0' }), 100), null);
});

test('normalizes non-BTC Binance USD-M positions for the complete PnL overview', () => {
  const sol = normalizeBinanceUsdtMPosition({
    symbol: 'SOLUSDT',
    positionSide: 'LONG',
    positionAmt: '12.5',
    entryPrice: '104.1',
    markPrice: '99.2',
    leverage: '5',
    notional: '1240',
    unRealizedProfit: '-61.25',
    positionInitialMargin: '248',
  });

  assert.equal(sol.symbol, 'SOLUSDT');
  assert.equal(sol.sizeUnit, 'SOL');
  assert.equal(sol.unrealizedPnlUsd, -61.25);
});

test('calculates Binance COIN-M PnL percentage for position alerts', () => {
  const btc = normalizeBinanceCoinMPosition({
    symbol: 'BTCUSD_PERP',
    positionSide: 'LONG',
    positionAmt: '10',
    entryPrice: '50000',
    markPrice: '55000',
    leverage: '5',
    unRealizedProfit: '0.002',
    positionInitialMargin: '0.004',
  }, new Map([['BTCUSD_PERP', 100]]));

  assert.equal(btc.unrealizedPnlPercent, 50);
});
