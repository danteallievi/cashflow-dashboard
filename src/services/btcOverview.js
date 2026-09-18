import { round, toNumber } from '../utils/numbers.js';

export function calculateBtcOverview({ spotBtc, collateralBtc, positions, btcPriceUsd }) {
  const normalizedSpotBtc = Math.max(0, toNumber(spotBtc));
  const normalizedCollateralBtc = Math.max(0, toNumber(collateralBtc));
  const normalizedBtcPrice = Math.max(0, toNumber(btcPriceUsd));
  let coinMPnlBtc = 0;
  let coinMPnlUsd = 0;
  let usdMPnlUsd = 0;

  for (const position of positions || []) {
    if (position.unrealizedPnlBtc != null) {
      coinMPnlBtc += toNumber(position.unrealizedPnlBtc);
      coinMPnlUsd += toNumber(position.unrealizedPnlUsd);
    } else {
      usdMPnlUsd += toNumber(position.unrealizedPnlUsd);
    }
  }

  const usdMPnlBtc = normalizedBtcPrice ? usdMPnlUsd / normalizedBtcPrice : null;
  const canCalculateNet = normalizedBtcPrice > 0 || Math.abs(usdMPnlUsd) < 0.005;
  const openPnlBtc = canCalculateNet ? coinMPnlBtc + (usdMPnlBtc || 0) : null;
  const currentBtc = normalizedSpotBtc + normalizedCollateralBtc;
  const netBtcIfClosed = openPnlBtc == null
    ? null
    : currentBtc + openPnlBtc;

  return {
    currentBtc: round(currentBtc, 8),
    currentUsd: normalizedBtcPrice ? round(currentBtc * normalizedBtcPrice, 2) : null,
    spotBtc: round(normalizedSpotBtc, 8),
    spotUsd: normalizedBtcPrice ? round(normalizedSpotBtc * normalizedBtcPrice, 2) : null,
    collateralBtc: round(normalizedCollateralBtc, 8),
    collateralUsd: normalizedBtcPrice
      ? round(normalizedCollateralBtc * normalizedBtcPrice, 2)
      : null,
    coinMPnlBtc: round(coinMPnlBtc, 8),
    coinMPnlUsd: round(coinMPnlUsd, 2),
    usdMPnlUsd: round(usdMPnlUsd, 2),
    usdMPnlBtc: usdMPnlBtc == null ? null : round(usdMPnlBtc, 8),
    openPnlBtc: openPnlBtc == null ? null : round(openPnlBtc, 8),
    openPnlUsd: round(coinMPnlUsd + usdMPnlUsd, 2),
    netBtcIfClosed: netBtcIfClosed == null ? null : round(netBtcIfClosed, 8),
    netUsdIfClosed: netBtcIfClosed == null || !normalizedBtcPrice
      ? null
      : round(netBtcIfClosed * normalizedBtcPrice, 2),
  };
}
