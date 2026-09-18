import { safeError } from '../utils/errors.js';
import { fetchJson } from '../utils/http.js';
import { signBinanceParams } from '../utils/signing.js';
import { toNumber } from '../utils/numbers.js';
import {
  normalizeBinanceCoinMPosition,
  normalizeBinanceUsdtMPosition,
} from '../services/positions.js';
import { includeTrackedBtc } from '../services/spotPortfolio.js';

const SPOT_BASE = 'https://api.binance.com';
const COIN_M_BASE = 'https://dapi.binance.com';
const USDT_M_BASE = 'https://fapi.binance.com';
const PAGE_SIZE = 1000;
const MAX_PAGES = 100;
const STABLE_ASSETS = new Set(['USD', 'USDT', 'USDC', 'FDUSD']);
const USD_QUOTES = ['USDT', 'USDC', 'FDUSD'];
const lastGoodComponents = new Map();
const HISTORY_LOOKBACK_DAYS = 90;
const HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HISTORY_PAGES = 100;

function credentials() {
  const apiKey = process.env.BINANCE_API_KEY?.trim();
  const secret = process.env.BINANCE_API_SECRET?.trim();
  if (!apiKey || !secret) throw new Error('Binance read-only API credentials are not configured.');
  return { apiKey, secret };
}

async function signedRequest(baseUrl, path, params = {}) {
  const { apiKey, secret } = credentials();
  const query = signBinanceParams(
    { ...params, recvWindow: 5000, timestamp: Date.now() },
    secret,
  );
  return fetchJson(`${baseUrl}${path}?${query}`, {
    exchange: 'Binance',
    headers: { 'X-MBX-APIKEY': apiKey },
  });
}

export async function getBinanceBtcPrice() {
  const payload = await fetchJson(`${SPOT_BASE}/api/v3/ticker/price?symbol=BTCUSDT`, {
    exchange: 'Binance',
  });
  const price = toNumber(payload.price);
  if (!price) throw new Error('Binance returned an invalid BTC price.');
  return price;
}

export async function getBinanceSpotBalances() {
  const payload = await signedRequest(SPOT_BASE, '/api/v3/account', { omitZeroBalances: true });
  return (payload.balances || [])
    .map((balance) => ({
      asset: String(balance.asset || '').toUpperCase(),
      quantity: toNumber(balance.free) + toNumber(balance.locked),
    }))
    .filter((balance) => balance.asset && balance.quantity > 0);
}

export async function getBinanceSpotPrices() {
  const payload = await fetchJson(`${SPOT_BASE}/api/v3/ticker/price`, {
    exchange: 'Binance',
  });
  if (!Array.isArray(payload)) throw new Error('Binance returned an invalid Spot price list.');
  return new Map(payload.map((ticker) => [ticker.symbol, toNumber(ticker.price)]));
}

function usdPairs(asset, prices) {
  return USD_QUOTES
    .map((quote) => ({ symbol: `${asset}${quote}`, quote }))
    .filter(({ symbol }) => prices.get(symbol) > 0);
}

export async function getBinanceSpotTrades(symbol, asset) {
  const trades = [];
  let fromId = 0;
  let complete = false;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const payload = await signedRequest(SPOT_BASE, '/api/v3/myTrades', {
      symbol,
      fromId,
      limit: PAGE_SIZE,
    });
    if (!Array.isArray(payload)) throw new Error('Binance returned an invalid Spot trade list.');

    trades.push(...payload);
    if (payload.length < PAGE_SIZE) {
      complete = true;
      break;
    }
    fromId = Math.max(...payload.map((trade) => Number(trade.id))) + 1;
  }

  const normalized = trades.map((trade) => ({
    id: String(trade.id),
    exchange: 'binance',
    timestamp: Number(trade.time),
    side: trade.isBuyer ? 'BUY' : 'SELL',
    asset,
    quantity: toNumber(trade.qty),
    priceUsd: toNumber(trade.price),
    fee: toNumber(trade.commission),
    feeAsset: trade.commissionAsset,
  }));

  console.info(`[binance] ${normalized.length} ${asset} spot trades loaded`);
  return { trades: normalized, complete };
}

export async function getBinanceSpotPortfolio() {
  const [balances, prices] = await Promise.all([
    getBinanceSpotBalances(),
    getBinanceSpotPrices(),
  ]);
  const assets = [];
  const warnings = [];

  const trackedAssets = includeTrackedBtc(
    balances.filter(({ asset }) => !STABLE_ASSETS.has(asset)),
  );

  for (const balance of trackedAssets) {
    const pairs = usdPairs(balance.asset, prices);
    const pricePair = pairs[0] || null;
    let trades = [];
    let historyComplete = false;

    if (pairs.length) {
      const histories = await Promise.allSettled(
        pairs.map(({ symbol }) => getBinanceSpotTrades(symbol, balance.asset)),
      );
      historyComplete = histories.every(
        (result) => result.status === 'fulfilled' && result.value.complete,
      );
      for (let index = 0; index < histories.length; index += 1) {
        const result = histories[index];
        if (result.status === 'fulfilled') {
          trades.push(...result.value.trades);
        } else {
          warnings.push(`Binance ${pairs[index].symbol} Spot: ${safeError(result.reason)}`);
        }
      }
    } else {
      warnings.push(`Binance ${balance.asset} Spot: no hay un mercado USD compatible para valuarla.`);
    }

    assets.push({
      exchange: 'binance',
      asset: balance.asset,
      quantity: balance.quantity,
      currentPriceUsd: pricePair ? prices.get(pricePair.symbol) : null,
      quoteAsset: pricePair?.quote || null,
      trades,
      historyComplete,
    });
  }

  return { assets, warnings };
}

export async function getBinanceCoinMAccount() {
  const payload = await signedRequest(COIN_M_BASE, '/dapi/v1/balance');
  const btc = payload.find((balance) => balance.asset === 'BTC');
  return toNumber(btc?.balance);
}

export async function getBinanceCoinMPositions() {
  const [positions, exchangeInfo] = await Promise.all([
    signedRequest(COIN_M_BASE, '/dapi/v1/positionRisk'),
    fetchJson(`${COIN_M_BASE}/dapi/v1/exchangeInfo`, { exchange: 'Binance' }),
  ]);
  const contracts = new Map(
    (exchangeInfo.symbols || []).map((symbol) => [symbol.symbol, toNumber(symbol.contractSize)]),
  );
  return positions
    .map((position) => normalizeBinanceCoinMPosition(position, contracts))
    .filter(Boolean);
}

export async function getBinanceUsdtMPositions() {
  const positions = await signedRequest(USDT_M_BASE, '/fapi/v3/positionRisk');
  return positions.map(normalizeBinanceUsdtMPosition).filter(Boolean);
}

function normalizeIncomeRecord(record, marketType) {
  return {
    exchange: 'binance',
    marketType,
    symbol: record.symbol || '—',
    incomeType: record.incomeType,
    amount: record.income,
    asset: record.asset,
    timestamp: Number(record.time),
    transactionId: String(record.tranId ?? ''),
    tradeId: String(record.tradeId ?? ''),
  };
}

async function getBinanceIncomeHistory(baseUrl, path, marketType, startAt, endAt) {
  const records = [];
  let complete = true;

  for (let windowStart = startAt; windowStart <= endAt; windowStart += HISTORY_WINDOW_MS) {
    const windowEnd = Math.min(endAt, windowStart + HISTORY_WINDOW_MS - 1);

    for (let page = 1; page <= MAX_HISTORY_PAGES; page += 1) {
      const payload = await signedRequest(baseUrl, path, {
        startTime: windowStart,
        endTime: windowEnd,
        limit: PAGE_SIZE,
        page,
      });
      if (!Array.isArray(payload)) throw new Error(`Binance returned an invalid ${marketType} income history.`);

      records.push(...payload.map((record) => normalizeIncomeRecord(record, marketType)));
      if (payload.length < PAGE_SIZE) break;
      if (page === MAX_HISTORY_PAGES) complete = false;
    }
  }

  return { records, complete };
}

export async function getBinanceTradingHistory() {
  const endAt = Date.now();
  const startAt = endAt - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const histories = await Promise.allSettled([
    getBinanceIncomeHistory(USDT_M_BASE, '/fapi/v1/income', 'USD-M', startAt, endAt),
    getBinanceIncomeHistory(COIN_M_BASE, '/dapi/v1/income', 'COIN-M', startAt, endAt),
  ]);
  const labels = ['USD-M', 'COIN-M'];
  const warnings = [];
  const records = [];
  let complete = true;

  histories.forEach((history, index) => {
    if (history.status === 'fulfilled') {
      records.push(...history.value.records);
      complete &&= history.value.complete;
      return;
    }

    complete = false;
    warnings.push(`Binance ${labels[index]} Trading History: ${safeError(history.reason)}`);
  });

  if (histories.every((history) => history.status === 'rejected')) {
    throw new Error('Binance trading history requests failed.');
  }

  console.info(`[binance] ${records.length} derivative income records loaded`);
  return {
    records,
    complete,
    days: HISTORY_LOOKBACK_DAYS,
    startAt: new Date(startAt).toISOString(),
    endAt: new Date(endAt).toISOString(),
    warnings,
  };
}

export async function getBinanceSnapshot() {
  credentials();
  const requests = {
    spotPortfolio: getBinanceSpotPortfolio(),
    coinMBalance: getBinanceCoinMAccount(),
    coinMPositions: getBinanceCoinMPositions(),
    usdtMPositions: getBinanceUsdtMPositions(),
    tradingHistory: getBinanceTradingHistory(),
  };
  const names = Object.keys(requests);
  const results = await Promise.allSettled(Object.values(requests));
  const resolved = Object.fromEntries(names.map((name, index) => [name, results[index]]));
  const successes = results.filter((result) => result.status === 'fulfilled').length;
  if (!successes) throw new Error('All Binance account requests failed.');

  const warnings = [];
  for (const [name, result] of Object.entries(resolved)) {
    if (result.status === 'fulfilled') {
      lastGoodComponents.set(name, result.value);
    } else {
      const suffix = lastGoodComponents.has(name) ? ' Se mantiene el último dato válido.' : '';
      warnings.push(`Binance ${name}: ${safeError(result.reason)}${suffix}`);
    }
  }

  const component = (name, fallback) => (
    resolved[name].status === 'fulfilled' ? resolved[name].value : lastGoodComponents.get(name) ?? fallback
  );
  const spotPortfolio = component('spotPortfolio', { assets: [], warnings: [] });
  const spotBtc = spotPortfolio.assets.find(({ asset }) => asset === 'BTC');
  warnings.push(...spotPortfolio.warnings);
  const tradingHistory = component('tradingHistory', {
    records: [],
    complete: false,
    days: HISTORY_LOOKBACK_DAYS,
    startAt: null,
    endAt: null,
    warnings: [],
  });
  warnings.push(...tradingHistory.warnings);

  console.info('[binance] balances fetched');
  return {
    updatedAt: new Date().toISOString(),
    holdings: [
      {
        exchange: 'binance',
        accountType: 'spot',
        btc: spotBtc?.quantity || 0,
      },
      {
        exchange: 'binance',
        accountType: 'coin-m',
        btc: component('coinMBalance', 0),
      },
    ],
    trades: spotBtc?.trades || [],
    tradesComplete: spotBtc?.historyComplete ?? false,
    spotAssets: spotPortfolio.assets,
    positions: [
      ...component('coinMPositions', []),
      ...component('usdtMPositions', []),
    ],
    tradingHistory,
    warnings,
  };
}
