import { round, toNumber } from '../utils/numbers.js';

function sideFrom(positionSide, amount) {
  if (positionSide === 'LONG' || positionSide === 'SHORT') return positionSide;
  return amount < 0 ? 'SHORT' : 'LONG';
}

export function normalizeBinanceCoinMPosition(raw, contractsBySymbol = new Map()) {
  const amount = toNumber(raw.positionAmt);
  if (!amount || !String(raw.symbol).startsWith('BTC')) return null;
  const contractSize = toNumber(contractsBySymbol.get(raw.symbol));
  const entryPrice = toNumber(raw.entryPrice);
  const markPrice = toNumber(raw.markPrice);
  const pnlBtc = toNumber(raw.unRealizedProfit ?? raw.unrealizedProfit);
  const leverage = toNumber(raw.leverage);
  const reportedInitialMarginBtc = Math.abs(toNumber(raw.positionInitialMargin ?? raw.initialMargin));
  const estimatedInitialMarginBtc = contractSize && entryPrice && leverage
    ? (Math.abs(amount) * contractSize) / entryPrice / leverage
    : 0;
  const initialMarginBtc = reportedInitialMarginBtc || estimatedInitialMarginBtc;

  return {
    id: `binance-coinm-${raw.symbol}-${raw.positionSide || sideFrom(null, amount)}`,
    exchange: 'binance',
    marketType: 'coin-m',
    symbol: raw.symbol,
    side: sideFrom(raw.positionSide, amount),
    leverage: leverage || undefined,
    entryPrice,
    markPrice,
    size: Math.abs(amount),
    sizeUnit: 'CONT',
    notionalUsd: contractSize ? round(Math.abs(amount) * contractSize, 2) : undefined,
    liquidationPrice: toNumber(raw.liquidationPrice) || undefined,
    unrealizedPnlUsd: markPrice ? round(pnlBtc * markPrice, 2) : undefined,
    unrealizedPnlBtc: round(pnlBtc, 8),
    unrealizedPnlPercent: initialMarginBtc ? round((pnlBtc / initialMarginBtc) * 100, 2) : undefined,
    marginAsset: 'BTC',
  };
}

export function normalizeBinanceUsdtMPosition(raw) {
  const amount = toNumber(raw.positionAmt);
  if (!amount) return null;
  const symbol = String(raw.symbol || '');
  const baseAsset = symbol.replace(/(?:USDT|USDC|BUSD)$/, '') || 'UNIT';
  const notional = Math.abs(toNumber(raw.notional));
  const pnlUsd = toNumber(raw.unRealizedProfit ?? raw.unrealizedProfit);
  const initialMargin = Math.abs(toNumber(raw.positionInitialMargin ?? raw.initialMargin));

  return {
    id: `binance-usdtm-${raw.symbol}-${raw.positionSide || sideFrom(null, amount)}`,
    exchange: 'binance',
    marketType: 'usdt-m',
    symbol,
    side: sideFrom(raw.positionSide, amount),
    leverage: toNumber(raw.leverage) || undefined,
    entryPrice: toNumber(raw.entryPrice),
    markPrice: toNumber(raw.markPrice),
    size: Math.abs(amount),
    sizeUnit: baseAsset,
    notionalUsd: round(notional, 2),
    liquidationPrice: toNumber(raw.liquidationPrice) || undefined,
    unrealizedPnlUsd: round(pnlUsd, 2),
    unrealizedPnlPercent: initialMargin ? round((pnlUsd / initialMargin) * 100, 2) : undefined,
    marginAsset: 'USDT',
  };
}

export function normalizeBingxPosition(raw, fallbackMarkPrice = 0) {
  const amount = toNumber(raw.positionAmt);
  if (!amount) return null;
  const pnlUsd = toNumber(raw.unrealizedProfit);
  const initialMargin = Math.abs(toNumber(raw.initialMargin));
  const baseAsset = String(raw.symbol || '').split('-')[0] || raw.asset || 'UNIT';

  return {
    id: `bingx-perpetual-${raw.positionId || raw.symbol}-${raw.positionSide}`,
    exchange: 'bingx',
    marketType: 'perpetual',
    symbol: raw.symbol,
    side: sideFrom(raw.positionSide, amount),
    leverage: toNumber(raw.leverage) || undefined,
    entryPrice: toNumber(raw.avgPrice),
    markPrice: toNumber(raw.markPrice) || fallbackMarkPrice,
    size: Math.abs(amount),
    sizeUnit: baseAsset,
    notionalUsd: round(Math.abs(toNumber(raw.positionValue)), 2),
    liquidationPrice: toNumber(raw.liquidationPrice) || undefined,
    unrealizedPnlUsd: round(pnlUsd, 2),
    unrealizedPnlPercent: initialMargin ? round((pnlUsd / initialMargin) * 100, 2) : undefined,
    marginAsset: raw.currency || 'USDT',
  };
}
