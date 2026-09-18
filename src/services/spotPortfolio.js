export function includeTrackedBtc(balances) {
  const normalized = Array.isArray(balances) ? balances : [];
  if (normalized.some(({ asset }) => asset === 'BTC')) return normalized;
  return [...normalized, { asset: 'BTC', quantity: 0 }];
}
