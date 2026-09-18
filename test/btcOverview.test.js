import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBtcOverview } from '../src/services/btcOverview.js';

test('calculates BTC equity at mark from Spot, COIN-M collateral and open PnL', () => {
  const overview = calculateBtcOverview({
    spotBtc: 0.1065934,
    collateralBtc: 0.18306332,
    btcPriceUsd: 78_800,
    positions: [
      { marketType: 'coin-m', unrealizedPnlBtc: -0.01743173, unrealizedPnlUsd: -1373.62 },
      { marketType: 'perpetual', unrealizedPnlUsd: -18.04 },
      { marketType: 'perpetual', unrealizedPnlUsd: -24.36 },
    ],
  });

  assert.equal(overview.spotBtc, 0.1065934);
  assert.equal(overview.collateralBtc, 0.18306332);
  assert.equal(overview.currentBtc, 0.28965672);
  assert.equal(overview.currentUsd, 22_824.95);
  assert.equal(overview.coinMPnlBtc, -0.01743173);
  assert.equal(overview.usdMPnlUsd, -42.4);
  assert.equal(overview.usdMPnlBtc, -0.00053807);
  assert.equal(overview.openPnlUsd, -1416.02);
  assert.equal(overview.openPnlBtc, -0.0179698);
  assert.equal(overview.netBtcIfClosed, 0.27168692);
});

test('does not invent a BTC conversion when the BTC price is unavailable', () => {
  const overview = calculateBtcOverview({
    spotBtc: 0.1,
    collateralBtc: 0.2,
    btcPriceUsd: null,
    positions: [{ unrealizedPnlUsd: 100 }],
  });

  assert.equal(overview.usdMPnlBtc, null);
  assert.equal(overview.openPnlBtc, null);
  assert.equal(overview.netBtcIfClosed, null);
});
