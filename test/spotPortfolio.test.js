import test from 'node:test';
import assert from 'node:assert/strict';
import { includeTrackedBtc } from '../src/services/spotPortfolio.js';

test('adds BTC as a tracked asset when its current Spot balance is zero', () => {
  assert.deepEqual(includeTrackedBtc([{ asset: 'ETH', quantity: 1 }]), [
    { asset: 'ETH', quantity: 1 },
    { asset: 'BTC', quantity: 0 },
  ]);
});

test('preserves the real BTC balance without duplicating it', () => {
  const balances = [{ asset: 'BTC', quantity: 0.25 }];
  assert.equal(includeTrackedBtc(balances), balances);
});
