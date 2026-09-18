import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTradingHistory } from '../src/services/tradingHistory.js';

test('merges realized PnL and fees by closing fill and calculates the net result', () => {
  const history = buildTradingHistory([
    { exchange: 'binance', marketType: 'USD-M', symbol: 'BTCUSDT', tradeId: '10', transactionId: 'a', timestamp: 100, incomeType: 'REALIZED_PNL', amount: '25', asset: 'USDT' },
    { exchange: 'binance', marketType: 'USD-M', symbol: 'BTCUSDT', tradeId: '10', transactionId: 'b', timestamp: 100, incomeType: 'COMMISSION', amount: '-1.5', asset: 'USDT' },
    { exchange: 'binance', marketType: 'USD-M', symbol: 'ETHUSDT', tradeId: '11', transactionId: 'c', timestamp: 200, incomeType: 'REALIZED_PNL', amount: '-8', asset: 'USDT' },
    { exchange: 'binance', marketType: 'USD-M', symbol: 'ETHUSDT', tradeId: '11', transactionId: 'd', timestamp: 200, incomeType: 'COMMISSION', amount: '-0.5', asset: 'USDT' },
    { exchange: 'binance', marketType: 'USD-M', symbol: 'ETHUSDT', tradeId: '12', transactionId: 'e', timestamp: 300, incomeType: 'FUNDING_FEE', amount: '-2', asset: 'USDT' },
  ], 80_000);

  assert.equal(history.trades.length, 2);
  assert.equal(history.trades[0].netPnl, -8.5);
  assert.equal(history.trades[1].netPnl, 23.5);
  assert.equal(history.summary.netPnlUsd, 15);
  assert.equal(history.summary.grossProfitUsd, 23.5);
  assert.equal(history.summary.grossLossUsd, -8.5);
  assert.equal(history.summary.feesUsd, 2);
  assert.equal(history.summary.winRatePercent, 50);
});

test('keeps break-even closures and converts COIN-M BTC results at the reference price', () => {
  const history = buildTradingHistory([
    { exchange: 'binance', marketType: 'COIN-M', symbol: 'BTCUSD_PERP', tradeId: '20', timestamp: 100, incomeType: 'REALIZED_PNL', amount: '0.001', asset: 'BTC' },
    { exchange: 'binance', marketType: 'COIN-M', symbol: 'BTCUSD_PERP', tradeId: '20', timestamp: 100, incomeType: 'COMMISSION', amount: '-0.0001', asset: 'BTC' },
    { exchange: 'bingx', marketType: 'PERPETUAL', symbol: 'SOL-USDT', tradeId: '21', timestamp: 200, incomeType: 'REALIZED_PNL', amount: '0', asset: 'USDT' },
  ], 100_000);

  assert.equal(history.trades.length, 2);
  assert.equal(history.trades[1].netPnl, 0.0009);
  assert.equal(history.trades[1].netPnlUsd, 90);
  assert.equal(history.trades[1].usdEstimated, true);
  assert.equal(history.summary.breakevenTrades, 1);
  assert.equal(history.summary.netPnlUsd, 90);
});

test('reports native results that cannot be priced without corrupting the USD total', () => {
  const history = buildTradingHistory([
    { exchange: 'binance', marketType: 'USD-M', symbol: 'BNBUSDT', tradeId: '30', timestamp: 100, incomeType: 'REALIZED_PNL', amount: '2', asset: 'BNB' },
  ], 90_000);

  assert.equal(history.trades[0].netPnlUsd, null);
  assert.equal(history.summary.netPnlUsd, 0);
  assert.equal(history.summary.unpricedTrades, 1);
  assert.deepEqual(history.summary.unpricedAssets, ['BNB']);
});
