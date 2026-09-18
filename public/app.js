const elements = {
  primaryTabs: [...document.querySelectorAll('[data-view]')],
  dashboardView: document.querySelector('#dashboard-view'),
  spotHistoryView: document.querySelector('#spot-history-view'),
  tradingHistoryView: document.querySelector('#trading-history-view'),
  button: document.querySelector('#update-button'),
  updatedAt: document.querySelector('#updated-at'),
  autoUpdateStatus: document.querySelector('#auto-update-status'),
  heroStatus: document.querySelector('#hero-status'),
  btcPrice: document.querySelector('#btc-price'),
  totalBtc: document.querySelector('#total-btc'),
  totalUsd: document.querySelector('#total-usd'),
  spotBtc: document.querySelector('#spot-btc'),
  averagePrice: document.querySelector('#average-price'),
  estimatedCost: document.querySelector('#estimated-cost'),
  spotCurrentValue: document.querySelector('#spot-current-value'),
  spotPnlCard: document.querySelector('#spot-pnl-card'),
  spotPnl: document.querySelector('#spot-pnl'),
  spotPnlPercent: document.querySelector('#spot-pnl-percent'),
  overviewNetCard: document.querySelector('#overview-net-card'),
  overviewCurrentBtc: document.querySelector('#overview-current-btc'),
  overviewCurrentUsd: document.querySelector('#overview-current-usd'),
  overviewNetBtc: document.querySelector('#overview-net-btc'),
  overviewNetUsd: document.querySelector('#overview-net-usd'),
  overviewImpact: document.querySelector('#overview-impact'),
  overviewOpenPnlBtc: document.querySelector('#overview-open-pnl-btc'),
  overviewOpenPnlUsd: document.querySelector('#overview-open-pnl-usd'),
  overviewSpotBtc: document.querySelector('#overview-spot-btc'),
  overviewSpotUsd: document.querySelector('#overview-spot-usd'),
  overviewCollateralBtc: document.querySelector('#overview-collateral-btc'),
  overviewCollateralUsd: document.querySelector('#overview-collateral-usd'),
  overviewCoinMPnl: document.querySelector('#overview-coinm-pnl'),
  overviewUsdMPnl: document.querySelector('#overview-usdm-pnl'),
  spotAssetCount: document.querySelector('#spot-asset-count'),
  spotAssetsBody: document.querySelector('#spot-assets-body'),
  spotTabs: [...document.querySelectorAll('[data-spot-filter]')],
  spotAssetFilter: document.querySelector('#spot-asset-filter'),
  purchaseHistoryTitle: document.querySelector('#purchase-history-title'),
  purchaseHistoryContext: document.querySelector('#purchase-history-context'),
  purchaseAverageCard: document.querySelector('#purchase-average-card'),
  purchaseAveragePrice: document.querySelector('#purchase-average-price'),
  purchaseAverageContext: document.querySelector('#purchase-average-context'),
  spotAverageAsset: document.querySelector('#spot-average-asset'),
  spotAverageCoverage: document.querySelector('#spot-average-coverage'),
  spotAverageNote: document.querySelector('#spot-average-note'),
  purchaseHistoryCount: document.querySelector('#purchase-history-count'),
  purchaseHistoryBody: document.querySelector('#purchase-history-body'),
  positionCount: document.querySelector('#position-count'),
  positionsBody: document.querySelector('#positions-body'),
  positionsTotalCard: document.querySelector('#positions-total-card'),
  positionsTotalUsd: document.querySelector('#positions-total-usd'),
  positionsTotalBtc: document.querySelector('#positions-total-btc'),
  positionsPositiveUsd: document.querySelector('#positions-positive-usd'),
  positionsNegativeUsd: document.querySelector('#positions-negative-usd'),
  positionsTotalNote: document.querySelector('#positions-total-note'),
  tradingNetCard: document.querySelector('#trading-net-card'),
  tradingNetPnl: document.querySelector('#trading-net-pnl'),
  tradingNetContext: document.querySelector('#trading-net-context'),
  tradingGrossProfit: document.querySelector('#trading-gross-profit'),
  tradingGrossLoss: document.querySelector('#trading-gross-loss'),
  tradingFees: document.querySelector('#trading-fees'),
  tradingWinRate: document.querySelector('#trading-win-rate'),
  tradingWinContext: document.querySelector('#trading-win-context'),
  tradingTabs: [...document.querySelectorAll('[data-trading-filter]')],
  tradingPeriodFilter: document.querySelector('#trading-period-filter'),
  tradingTradeCount: document.querySelector('#trading-trade-count'),
  tradingCoverage: document.querySelector('#trading-coverage'),
  tradingHistoryNote: document.querySelector('#trading-history-note'),
  tradingHistoryBody: document.querySelector('#trading-history-body'),
  toast: document.querySelector('#toast'),
};

let spotAssets = [];
let activeSpotFilter = 'all';
let activeAssetFilter = 'all';
let hasInitializedSpotAssetFilter = false;
let tradingHistory = { trades: [], period: { days: 90, complete: false } };
let activeTradingFilter = 'all';
let activeTradingPeriod = 90;
const AUTO_UPDATE_INTERVAL_MS = 60_000;
let autoUpdateTimer = null;
let nextAutoUpdateAt = null;
let updateInFlight = false;

function setActiveView(view, updateHash = true) {
  const views = ['dashboard', 'spot-history', 'trading-history'];
  const activeView = views.includes(view) ? view : 'dashboard';
  const viewElements = {
    dashboard: elements.dashboardView,
    'spot-history': elements.spotHistoryView,
    'trading-history': elements.tradingHistoryView,
  };
  Object.entries(viewElements).forEach(([name, node]) => {
    node.hidden = activeView !== name;
    node.classList.toggle('is-active', activeView === name);
  });
  elements.primaryTabs.forEach((tab) => {
    const isActive = tab.dataset.view === activeView;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  if (updateHash) {
    window.history.replaceState(null, '', `#${activeView}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const price = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const assetPrice = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});
const assetQuantity = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 12,
});
const timestamp = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});
const purchaseTimestamp = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const quoteAmount = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatUsd(value, fallback = '—') {
  return value == null || !Number.isFinite(Number(value)) ? fallback : usd.format(Number(value));
}

function formatBtc(value, withUnit = true) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const number = Number(value).toFixed(8);
  return withUnit ? `${number} BTC` : number;
}

function formatPercent(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const sign = Number(value) > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(2)}%`;
}

function signedUsd(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const sign = Number(value) > 0 ? '+' : '';
  return `${sign}${usd.format(Number(value))}`;
}

function signedBtc(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const sign = Number(value) > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(8)} BTC`;
}

function directionClass(value) {
  if (value == null || !Number.isFinite(Number(value))) return 'neutral';
  return Number(value) > 0 ? 'positive' : Number(value) < 0 ? 'negative' : 'neutral';
}

function formatPositionSize(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
    useGrouping: false,
  }).format(Number(value));
}

function formatAssetQuantity(value, asset) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${assetQuantity.format(Number(value))} ${asset}`;
}

function formatNativeAmount(value, asset, signed = false) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  if (['USD', 'USDT', 'USDC', 'FDUSD'].includes(asset)) {
    return signed ? signedUsd(value) : formatUsd(value);
  }
  const sign = signed && Number(value) > 0 ? '+' : '';
  return `${sign}${assetQuantity.format(Number(value))} ${asset || ''}`.trim();
}

function setLoading(loading) {
  elements.button.disabled = loading;
  elements.button.classList.toggle('is-loading', loading);
  elements.button.querySelector('.update-label').textContent = loading ? 'Updating…' : 'Update';
  if (loading) {
    elements.heroStatus.textContent = 'Consultando Binance y BingX en paralelo…';
    document.querySelectorAll('.source-pill').forEach((item) => {
      item.className = 'source-pill is-loading';
      item.querySelector('.source-state').textContent = 'Consultando…';
    });
  }
}

function clearAutoUpdateTimer() {
  if (autoUpdateTimer != null) window.clearTimeout(autoUpdateTimer);
  autoUpdateTimer = null;
  nextAutoUpdateAt = null;
}

function renderAutoUpdateStatus() {
  elements.autoUpdateStatus.className = 'auto-update-status';
  if (document.hidden) {
    elements.autoUpdateStatus.textContent = 'Auto · pausado';
    elements.autoUpdateStatus.classList.add('is-paused');
    return;
  }
  if (updateInFlight) {
    elements.autoUpdateStatus.textContent = 'Auto · actualizando';
    elements.autoUpdateStatus.classList.add('is-loading');
    return;
  }
  if (nextAutoUpdateAt == null) {
    elements.autoUpdateStatus.textContent = 'Auto · iniciando';
    return;
  }

  const seconds = Math.max(0, Math.ceil((nextAutoUpdateAt - Date.now()) / 1000));
  const minutesPart = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsPart = String(seconds % 60).padStart(2, '0');
  elements.autoUpdateStatus.textContent = `Auto · ${minutesPart}:${secondsPart}`;
}

function scheduleAutoUpdate() {
  clearAutoUpdateTimer();
  if (document.hidden) {
    renderAutoUpdateStatus();
    return;
  }
  nextAutoUpdateAt = Date.now() + AUTO_UPDATE_INTERVAL_MS;
  autoUpdateTimer = window.setTimeout(() => updateDashboard(), AUTO_UPDATE_INTERVAL_MS);
  renderAutoUpdateStatus();
}

function renderSource(name, source) {
  const node = document.querySelector(`#source-${name}`);
  const state = node.querySelector('.source-state');
  const sourceTime = source.updatedAt
    ? new Date(source.updatedAt).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    : null;
  node.className = `source-pill ${source.ok ? 'is-ok' : source.stale ? 'is-stale' : 'is-error'}`;
  if (source.ok) {
    state.textContent = `Actualizado ${sourceTime || '—'}`;
  } else if (source.stale) {
    state.textContent = `Último válido ${sourceTime || '—'}`;
  } else {
    state.textContent = 'No disponible';
  }
  node.title = source.error || '';
}

function renderSpot(spot) {
  elements.spotBtc.textContent = formatBtc(spot.btc);
  elements.averagePrice.textContent = formatUsd(spot.averageBuyPriceUsd);
  elements.estimatedCost.textContent = formatUsd(spot.estimatedCostUsd);
  elements.spotCurrentValue.textContent = formatUsd(spot.currentValueUsd);
  elements.spotPnl.textContent = signedUsd(spot.estimatedPnlUsd);
  elements.spotPnlPercent.textContent = formatPercent(spot.estimatedPnlPercent);

  const direction = spot.estimatedPnlUsd > 0 ? 'positive' : spot.estimatedPnlUsd < 0 ? 'negative' : 'neutral';
  elements.spotPnlCard.className = `pnl-card is-${direction}`;
  const fill = elements.spotPnlCard.querySelector('.pnl-line span');
  fill.style.width = spot.estimatedPnlPercent == null
    ? '0%'
    : `${Math.min(100, Math.max(8, 50 + Number(spot.estimatedPnlPercent)))}%`;
}

function renderBtcOverview(overview) {
  const data = overview || {};
  elements.overviewCurrentBtc.textContent = formatBtc(data.currentBtc);
  elements.overviewCurrentUsd.textContent = formatUsd(data.currentUsd);
  elements.overviewNetBtc.textContent = formatBtc(data.netBtcIfClosed);
  elements.overviewNetUsd.textContent = formatUsd(data.netUsdIfClosed);
  elements.overviewOpenPnlBtc.textContent = signedBtc(data.openPnlBtc);
  elements.overviewOpenPnlUsd.textContent = signedUsd(data.openPnlUsd);
  elements.overviewSpotBtc.textContent = formatBtc(data.spotBtc);
  elements.overviewSpotUsd.textContent = formatUsd(data.spotUsd);
  elements.overviewCollateralBtc.textContent = formatBtc(data.collateralBtc);
  elements.overviewCollateralUsd.textContent = formatUsd(data.collateralUsd);

  const rows = [
    [elements.overviewCoinMPnl, data.coinMPnlBtc, data.coinMPnlUsd],
    [elements.overviewUsdMPnl, data.usdMPnlBtc, data.usdMPnlUsd],
  ];
  rows.forEach(([node, btcValue, usdValue]) => {
    node.className = `overview-pnl is-${directionClass(usdValue ?? btcValue)}`;
    node.querySelector('strong').textContent = signedBtc(btcValue);
    node.querySelector('small').textContent = signedUsd(usdValue);
  });

  const pnlDirection = directionClass(data.openPnlUsd ?? data.openPnlBtc);
  elements.overviewNetCard.className = `overview-balance overview-balance-projected is-${pnlDirection}`;
  elements.overviewImpact.className = `overview-impact is-${pnlDirection}`;
}

function buildBtcOverviewFallback(data) {
  const btcPriceUsd = Number(data.market?.btcPriceUsd) || 0;
  const spotBtc = Number(data.portfolio?.spotBtc ?? data.spot?.btc) || 0;
  const collateralBtc = (data.holdings || [])
    .filter((holding) => holding.accountType === 'coin-m')
    .reduce((sum, holding) => sum + (Number(holding.btc) || 0), 0);
  const coinMPositions = (data.positions || []).filter((position) => position.unrealizedPnlBtc != null);
  const usdMPositions = (data.positions || []).filter((position) => position.unrealizedPnlBtc == null);
  const coinMPnlBtc = coinMPositions.reduce((sum, position) => sum + (Number(position.unrealizedPnlBtc) || 0), 0);
  const coinMPnlUsd = coinMPositions.reduce((sum, position) => sum + (Number(position.unrealizedPnlUsd) || 0), 0);
  const usdMPnlUsd = usdMPositions.reduce((sum, position) => sum + (Number(position.unrealizedPnlUsd) || 0), 0);
  const usdMPnlBtc = btcPriceUsd ? usdMPnlUsd / btcPriceUsd : null;
  const openPnlBtc = usdMPnlBtc == null ? null : coinMPnlBtc + usdMPnlBtc;
  const currentBtc = spotBtc + collateralBtc;
  const netBtcIfClosed = openPnlBtc == null ? null : spotBtc + collateralBtc + openPnlBtc;

  return {
    currentBtc,
    currentUsd: btcPriceUsd ? currentBtc * btcPriceUsd : null,
    spotBtc,
    spotUsd: btcPriceUsd ? spotBtc * btcPriceUsd : null,
    collateralBtc,
    collateralUsd: btcPriceUsd ? collateralBtc * btcPriceUsd : null,
    coinMPnlBtc,
    coinMPnlUsd,
    usdMPnlBtc,
    usdMPnlUsd,
    openPnlBtc,
    openPnlUsd: coinMPnlUsd + usdMPnlUsd,
    netBtcIfClosed,
    netUsdIfClosed: netBtcIfClosed == null || !btcPriceUsd ? null : netBtcIfClosed * btcPriceUsd,
  };
}

function spotAssetPnl(asset) {
  const value = asset.estimatedPnlUsd;
  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  return `<span class="position-pnl is-${direction}">${escapeHtml(signedUsd(value))}<small>${escapeHtml(formatPercent(asset.estimatedPnlPercent))}</small></span>`;
}

function renderPurchaseAverage(filteredAssets) {
  if (activeAssetFilter === 'all') {
    elements.purchaseAveragePrice.textContent = '—';
    elements.purchaseAverageContext.textContent = 'Seleccioná una moneda';
    elements.spotAverageAsset.textContent = '—';
    elements.spotAverageCoverage.textContent = '—';
    elements.spotAverageNote.textContent = 'Sin filtro activo';
    elements.purchaseAverageCard.classList.add('is-empty');
    return;
  }

  const assetsWithCostBasis = filteredAssets
    .map((asset) => ({
      ...asset,
      basisWeight: Number(asset.quantity) > 0
        ? Number(asset.quantity)
        : Number(asset.trackedQuantity),
    }))
    .filter((asset) => asset.basisWeight > 0 && Number(asset.averageBuyPriceUsd) > 0);
  const totalQuantity = assetsWithCostBasis.reduce((sum, asset) => sum + asset.basisWeight, 0);
  const totalCost = assetsWithCostBasis.reduce(
    (sum, asset) => sum + (asset.basisWeight * Number(asset.averageBuyPriceUsd)),
    0,
  );
  const weightedAverage = totalQuantity > 0 ? totalCost / totalQuantity : null;
  const selectedExchangeLabel = activeSpotFilter === 'all'
    ? 'Binance + BingX'
    : activeSpotFilter === 'binance' ? 'Binance' : 'BingX';
  const exchangesWithCostBasis = new Set(assetsWithCostBasis.map((asset) => asset.exchange));
  const averageExchangeLabel = exchangesWithCostBasis.size === 2
    ? 'Binance + BingX'
    : exchangesWithCostBasis.has('binance')
      ? 'Binance'
      : exchangesWithCostBasis.has('bingx') ? 'BingX' : selectedExchangeLabel;
  const hasPartialHistory = filteredAssets.some((asset) => asset.historyComplete === false);
  const purchaseCount = filteredAssets.reduce(
    (sum, asset) => sum + (asset.purchases?.length || 0),
    0,
  );
  const exchangeCount = new Set(filteredAssets.map((asset) => asset.exchange)).size;

  elements.purchaseAveragePrice.textContent = weightedAverage == null
    ? '—'
    : price.format(weightedAverage);
  elements.purchaseAverageContext.textContent = weightedAverage == null
    ? 'Sin historial suficiente'
    : `${activeAssetFilter} · ${averageExchangeLabel}${hasPartialHistory ? ' · historial parcial' : ''}`;
  elements.spotAverageAsset.textContent = activeAssetFilter;
  elements.spotAverageCoverage.textContent = `${exchangesWithCostBasis.size || exchangeCount} ${(exchangesWithCostBasis.size || exchangeCount) === 1 ? 'exchange' : 'exchanges'}`;
  elements.spotAverageNote.textContent = `${purchaseCount} ${purchaseCount === 1 ? 'compra registrada' : 'compras registradas'}`;
  elements.purchaseAverageCard.classList.toggle('is-empty', weightedAverage == null);
}

function renderPurchaseHistory(filteredAssets) {
  renderPurchaseAverage(filteredAssets);

  if (activeAssetFilter === 'all') {
    elements.purchaseHistoryTitle.textContent = 'Historial de compras';
    elements.purchaseHistoryContext.textContent = 'Elegí una moneda o presioná “Ver compras” para consultar sus operaciones.';
    elements.purchaseHistoryCount.textContent = '0 compras';
    elements.purchaseHistoryBody.innerHTML = '<tr class="empty-row"><td colspan="7">Seleccioná una moneda para ver todas sus compras ejecutadas.</td></tr>';
    return;
  }

  const purchases = filteredAssets
    .flatMap((asset) => asset.purchases || [])
    .sort((a, b) => b.timestamp - a.timestamp);
  const exchangeLabel = activeSpotFilter === 'all'
    ? 'todos los exchanges'
    : activeSpotFilter === 'binance' ? 'Binance' : 'BingX';
  elements.purchaseHistoryTitle.textContent = `${activeAssetFilter} en ${exchangeLabel}`;
  elements.purchaseHistoryContext.textContent = 'Compras ejecutadas obtenidas desde la API read-only y agrupadas por orden.';
  elements.purchaseHistoryCount.textContent = `${purchases.length} ${purchases.length === 1 ? 'compra' : 'compras'}`;

  if (!purchases.length) {
    elements.purchaseHistoryBody.innerHTML = '<tr class="empty-row"><td colspan="7">No se encontraron compras ejecutadas para esta combinación.</td></tr>';
    return;
  }

  elements.purchaseHistoryBody.innerHTML = purchases.map((purchase) => {
    const exchangeName = purchase.exchange === 'binance' ? 'Binance' : 'BingX';
    const fillNote = purchase.fills > 1 ? `${purchase.fills} ejecuciones` : '1 ejecución';
    const date = purchase.timestamp ? purchaseTimestamp.format(new Date(purchase.timestamp)) : '—';
    return `
      <tr>
        <td data-label="Fecha"><strong>${escapeHtml(date)}</strong></td>
        <td data-label="Exchange"><div class="table-exchange"><strong>${exchangeName}</strong><span>Spot</span></div></td>
        <td data-label="Par"><strong>${escapeHtml(purchase.symbol || '—')}</strong></td>
        <td data-label="Orden"><span class="order-id">#${escapeHtml(purchase.id)}</span><small>${fillNote}</small></td>
        <td data-label="Cantidad"><strong>${escapeHtml(formatAssetQuantity(purchase.quantity, purchase.asset))}</strong></td>
        <td data-label="Precio medio">${purchase.averagePriceUsd == null ? '—' : assetPrice.format(purchase.averagePriceUsd)}</td>
        <td data-label="Monto"><strong>${quoteAmount.format(purchase.quoteQuantity)} ${escapeHtml(purchase.quoteAsset || 'USD')}</strong></td>
      </tr>
    `;
  }).join('');
}

function syncSpotAssetFilter() {
  const availableAssets = [...new Set(
    spotAssets
      .filter((asset) => activeSpotFilter === 'all' || asset.exchange === activeSpotFilter)
      .map((asset) => asset.asset),
  )].sort((a, b) => a.localeCompare(b));

  if (!hasInitializedSpotAssetFilter && availableAssets.includes('BTC')) {
    activeAssetFilter = 'BTC';
    hasInitializedSpotAssetFilter = true;
  }

  if (activeAssetFilter !== 'all' && !availableAssets.includes(activeAssetFilter)) {
    activeAssetFilter = 'all';
  }

  elements.spotAssetFilter.innerHTML = [
    '<option value="all">Todas las monedas</option>',
    ...availableAssets.map((asset) => `<option value="${escapeHtml(asset)}">${escapeHtml(asset)}</option>`),
  ].join('');
  elements.spotAssetFilter.value = activeAssetFilter;
  elements.spotAssetFilter.disabled = availableAssets.length === 0;
}

function renderSpotAssets() {
  const exchangeFiltered = activeSpotFilter === 'all'
    ? spotAssets
    : spotAssets.filter((asset) => asset.exchange === activeSpotFilter);
  const filtered = activeAssetFilter === 'all'
    ? exchangeFiltered
    : exchangeFiltered.filter((asset) => asset.asset === activeAssetFilter);
  elements.spotAssetCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'moneda' : 'monedas'}`;
  renderPurchaseHistory(filtered);

  if (!filtered.length) {
    elements.spotAssetsBody.innerHTML = '<tr class="empty-row"><td colspan="8"><span class="empty-check">✓</span> No hay monedas Spot para este filtro.</td></tr>';
    return;
  }

  elements.spotAssetsBody.innerHTML = filtered.map((asset) => {
    const exchangeName = asset.exchange === 'binance' ? 'Binance' : 'BingX';
    const averageNote = asset.averageBuyPriceUsd != null
      ? (asset.historyComplete ? 'Historial disponible' : 'Historial parcial')
      : (asset.historyComplete ? 'Sin compras registradas' : 'Historial no disponible');
    return `
      <tr>
        <td data-label="Moneda">
          <div class="asset-identity"><span class="exchange-monogram ${asset.exchange}">${escapeHtml(asset.asset.slice(0, 1))}</span><strong>${escapeHtml(asset.asset)}</strong></div>
        </td>
        <td data-label="Exchange"><div class="table-exchange"><strong>${exchangeName}</strong><span>Spot</span></div></td>
        <td data-label="Cantidad"><strong>${escapeHtml(formatAssetQuantity(asset.quantity, asset.asset))}</strong></td>
        <td data-label="Precio promedio de compra"><strong>${asset.averageBuyPriceUsd == null ? '—' : assetPrice.format(asset.averageBuyPriceUsd)}</strong><small>${averageNote}</small></td>
        <td data-label="Precio actual">${asset.currentPriceUsd == null ? '—' : assetPrice.format(asset.currentPriceUsd)}</td>
        <td data-label="Valor actual"><strong>${formatUsd(asset.currentValueUsd)}</strong></td>
        <td data-label="PnL estimado">${spotAssetPnl(asset)}</td>
        <td data-label="Compras"><button class="history-button" type="button" data-history-exchange="${escapeHtml(asset.exchange)}" data-history-asset="${escapeHtml(asset.asset)}">Ver compras</button></td>
      </tr>
    `;
  }).join('');
}

function positionAlertLevel(position) {
  const pnlPercent = Number(position.unrealizedPnlPercent);
  if (!Number.isFinite(pnlPercent) || pnlPercent < 10) return '';
  if (pnlPercent >= 20) return 'pnl-alert-20';
  if (pnlPercent >= 15) return 'pnl-alert-15';
  return 'pnl-alert-10';
}

function cashAlertIcon(alertLevel) {
  if (alertLevel !== 'pnl-alert-20') return '';
  return `
    <span class="cash-alert" title="PnL de 20% o más: considerar cierre" aria-label="Alerta de cierre: PnL de 20% o más">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.75" y="5.75" width="18.5" height="12.5" rx="1.5"></rect>
        <path d="M6.25 9.25c1.1 0 2-.9 2-2M17.75 9.25c-1.1 0-2-.9-2-2M6.25 14.75c1.1 0 2 .9 2 2M17.75 14.75c-1.1 0-2 .9-2 2"></path>
        <circle cx="12" cy="12" r="2.25"></circle>
      </svg>
      <span>CASH</span>
    </span>`;
}

function positionPnl(position, alertLevel = '') {
  const usdValue = position.unrealizedPnlUsd;
  const btcValue = position.unrealizedPnlBtc;
  const direction = usdValue > 0 || (usdValue == null && btcValue > 0) ? 'positive' : usdValue < 0 || btcValue < 0 ? 'negative' : 'neutral';
  const lines = [];
  if (usdValue != null) lines.push(signedUsd(usdValue));
  if (btcValue != null) lines.push(`${btcValue > 0 ? '+' : ''}${Number(btcValue).toFixed(8)} BTC`);
  if (position.unrealizedPnlPercent != null) lines.push(formatPercent(position.unrealizedPnlPercent));
  const [primary = '—', ...secondary] = lines;
  return `<span class="position-pnl is-${direction}">${escapeHtml(primary)}${secondary.map((line) => `<small>${escapeHtml(line)}</small>`).join('')}${cashAlertIcon(alertLevel)}</span>`;
}

function renderOpenPositionsTotal(positions, overview = {}) {
  const pricedPositions = positions.filter((position) => (
    position.unrealizedPnlUsd != null
      && Number.isFinite(Number(position.unrealizedPnlUsd))
  ));
  const positiveUsd = pricedPositions.reduce((sum, position) => (
    Number(position.unrealizedPnlUsd) > 0 ? sum + Number(position.unrealizedPnlUsd) : sum
  ), 0);
  const negativeUsd = pricedPositions.reduce((sum, position) => (
    Number(position.unrealizedPnlUsd) < 0 ? sum + Number(position.unrealizedPnlUsd) : sum
  ), 0);
  const netUsd = positiveUsd + negativeUsd;
  const direction = directionClass(netUsd);
  const hasCompleteUsdCoverage = pricedPositions.length === positions.length;

  elements.positionsTotalCard.className = `positions-total is-${direction}`;
  elements.positionsTotalUsd.textContent = signedUsd(netUsd);
  elements.positionsTotalBtc.textContent = overview.openPnlBtc == null
    ? 'Equivalente BTC no disponible'
    : `${signedBtc(overview.openPnlBtc)} equivalente`;
  elements.positionsPositiveUsd.textContent = signedUsd(positiveUsd);
  elements.positionsNegativeUsd.textContent = signedUsd(negativeUsd);
  elements.positionsTotalNote.textContent = hasCompleteUsdCoverage
    ? 'COIN-M se convierte a USD al mark price; USD-M se suma directamente.'
    : `Total parcial: ${pricedPositions.length} de ${positions.length} posiciones pudieron convertirse a USD.`;
}

function renderPositions(positions, overview) {
  elements.positionCount.textContent = `${positions.length} ${positions.length === 1 ? 'posición' : 'posiciones'}`;
  renderOpenPositionsTotal(positions, overview);
  if (!positions.length) {
    elements.positionsBody.innerHTML = '<tr class="empty-row"><td colspan="9"><span class="empty-check">✓</span> No hay posiciones abiertas.</td></tr>';
    return;
  }

  elements.positionsBody.innerHTML = positions.map((position) => {
    const alertLevel = positionAlertLevel(position);
    return `
    <tr${alertLevel ? ` class="${alertLevel}"` : ''}>
      <td data-label="Exchange / Market">
        <div class="table-exchange"><strong>${position.exchange === 'binance' ? 'Binance' : 'BingX'}</strong><span>${escapeHtml(position.marketType)}</span></div>
      </td>
      <td data-label="Pair"><strong>${escapeHtml(position.symbol)}</strong><small>${position.leverage ? `${position.leverage}×` : '—'}</small></td>
      <td data-label="Side"><span class="side-badge is-${position.side.toLowerCase()}">${escapeHtml(position.side)}</span></td>
      <td data-label="Entry">${position.entryPrice ? price.format(position.entryPrice) : '—'}</td>
      <td data-label="Mark">${position.markPrice ? price.format(position.markPrice) : '—'}</td>
      <td data-label="Size"><strong>${formatPositionSize(position.size)}</strong><small>${escapeHtml(position.sizeUnit)}</small></td>
      <td data-label="Notional">${formatUsd(position.notionalUsd)}</td>
      <td data-label="PnL">${positionPnl(position, alertLevel)}</td>
      <td data-label="Liq.">${position.liquidationPrice ? price.format(position.liquidationPrice) : '—'}</td>
    </tr>
  `;
  }).join('');
}

function summarizeClosedTrades(trades) {
  const priced = trades.filter((trade) => trade.netPnlUsd != null);
  const wins = priced.filter((trade) => Number(trade.netPnlUsd) > 0).length;
  const losses = priced.filter((trade) => Number(trade.netPnlUsd) < 0).length;
  const decided = wins + losses;
  return {
    wins,
    losses,
    grossProfit: priced.reduce((sum, trade) => sum + Math.max(0, Number(trade.netPnlUsd)), 0),
    grossLoss: priced.reduce((sum, trade) => sum + Math.min(0, Number(trade.netPnlUsd)), 0),
    fees: trades.reduce((sum, trade) => sum + (Number(trade.feeUsd) || 0), 0),
    net: priced.reduce((sum, trade) => sum + Number(trade.netPnlUsd), 0),
    winRate: decided ? (wins / decided) * 100 : null,
    unpriced: trades.length - priced.length,
  };
}

function tradingResult(value, asset, usdValue, estimated = false) {
  const direction = directionClass(usdValue ?? value);
  const primary = usdValue == null
    ? formatNativeAmount(value, asset, true)
    : signedUsd(usdValue);
  const native = asset === 'BTC' ? formatNativeAmount(value, asset, true) : null;
  const detail = [native, estimated ? 'USD estimado' : null].filter(Boolean).join(' · ');
  return `<span class="position-pnl is-${direction}">${escapeHtml(primary)}${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</span>`;
}

function renderTradingHistory() {
  const cutoff = Date.now() - activeTradingPeriod * 24 * 60 * 60 * 1000;
  const filtered = (tradingHistory.trades || []).filter((trade) => (
    (activeTradingFilter === 'all' || trade.exchange === activeTradingFilter)
    && Number(trade.timestamp) >= cutoff
  ));
  const summary = summarizeClosedTrades(filtered);
  const exchangeLabel = activeTradingFilter === 'all'
    ? 'Binance + BingX'
    : activeTradingFilter === 'binance' ? 'Binance' : 'BingX';
  const countLabel = `${filtered.length} ${filtered.length === 1 ? 'cierre' : 'cierres'}`;

  elements.tradingNetPnl.textContent = signedUsd(summary.net);
  elements.tradingNetContext.textContent = `${countLabel} · ${exchangeLabel} · últimos ${activeTradingPeriod} días`;
  elements.tradingGrossProfit.textContent = signedUsd(summary.grossProfit);
  elements.tradingGrossLoss.textContent = signedUsd(summary.grossLoss);
  elements.tradingFees.textContent = formatUsd(summary.fees);
  elements.tradingWinRate.textContent = summary.winRate == null ? '—' : `${summary.winRate.toFixed(1)}%`;
  elements.tradingWinContext.textContent = `${summary.wins} ganadores · ${summary.losses} perdedores`;
  elements.tradingTradeCount.textContent = countLabel;
  elements.tradingNetCard.className = `trading-net-card is-${directionClass(summary.net)}`;
  const totalMovement = summary.grossProfit + Math.abs(summary.grossLoss);
  elements.tradingNetCard.querySelector('.result-rule span').style.width = totalMovement
    ? `${Math.max(4, Math.min(100, (summary.grossProfit / totalMovement) * 100))}%`
    : '0%';

  const period = tradingHistory.period || {};
  elements.tradingCoverage.textContent = period.complete
    ? `Cobertura confirmada · ${period.days || 90} días`
    : 'Cobertura parcial · revisá las alertas';
  elements.tradingHistoryNote.textContent = summary.unpriced
    ? `${summary.unpriced} cierres conservan su moneda nativa porque no fue posible convertirlos a USD.`
    : 'Cada fila corresponde a una ejecución de cierre reportada por el exchange.';

  if (!filtered.length) {
    elements.tradingHistoryBody.innerHTML = '<tr class="empty-row"><td colspan="7"><span class="empty-check">✓</span> No hay cierres para este filtro.</td></tr>';
    return;
  }

  elements.tradingHistoryBody.innerHTML = filtered.map((trade) => {
    const exchangeName = trade.exchange === 'binance' ? 'Binance' : 'BingX';
    const date = trade.timestamp ? purchaseTimestamp.format(new Date(trade.timestamp)) : '—';
    return `
      <tr>
        <td data-label="Fecha"><strong>${escapeHtml(date)}</strong></td>
        <td data-label="Exchange / Market"><div class="table-exchange"><strong>${exchangeName}</strong><span>${escapeHtml(trade.marketType)}</span></div></td>
        <td data-label="Par"><strong>${escapeHtml(trade.symbol || '—')}</strong></td>
        <td data-label="Trade ID"><span class="order-id">#${escapeHtml(trade.tradeId || '—')}</span></td>
        <td data-label="PnL realizado">${tradingResult(trade.realizedPnl, trade.asset, trade.realizedPnlUsd, trade.usdEstimated)}</td>
        <td data-label="Fee"><strong>${escapeHtml(formatNativeAmount(trade.fee, trade.asset))}</strong>${trade.feeUsd != null && trade.asset === 'BTC' ? `<small>${escapeHtml(formatUsd(trade.feeUsd))} est.</small>` : ''}</td>
        <td data-label="Resultado neto">${tradingResult(trade.netPnl, trade.asset, trade.netPnlUsd, trade.usdEstimated)}</td>
      </tr>
    `;
  }).join('');
}

function renderDashboard(data) {
  const spotBtc = data.portfolio.spotBtc ?? data.spot?.btc;
  const spotUsd = data.portfolio.spotUsd ?? data.spot?.currentValueUsd;
  const btcOverview = data.btcOverview || buildBtcOverviewFallback(data);
  elements.updatedAt.textContent = timestamp.format(new Date(data.updatedAt));
  elements.btcPrice.textContent = formatUsd(data.market.btcPriceUsd);
  elements.totalBtc.textContent = formatBtc(spotBtc);
  elements.totalUsd.textContent = formatUsd(spotUsd);
  const activeSources = Object.values(data.sources).filter((source) => source.ok).length;
  elements.heroStatus.textContent = activeSources === 0
    ? 'Precio actualizado. Configurá o revisá las credenciales read-only para ver tus cuentas.'
    : spotBtc > 0
      ? 'Tu BTC Spot es el indicador principal; los futuros se proyectan por separado.'
      : 'Conexión completada. No se encontró BTC disponible en Spot.';

  renderSource('binance', data.sources.binance);
  renderSource('bingx', data.sources.bingx);
  renderSpot(data.spot);
  renderBtcOverview(btcOverview);
  spotAssets = data.spotAssets || [];
  syncSpotAssetFilter();
  renderSpotAssets();
  renderPositions(data.positions, btcOverview);
  tradingHistory = data.tradingHistory || { trades: [], period: { days: 90, complete: false } };
  renderTradingHistory();
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.className = `toast is-visible${isError ? ' is-error' : ''}`;
  window.setTimeout(() => { elements.toast.className = 'toast'; }, 3600);
}

async function updateDashboard({ announce = false } = {}) {
  if (updateInFlight) return;
  clearAutoUpdateTimer();
  updateInFlight = true;
  setLoading(true);
  renderAutoUpdateStatus();
  try {
    const response = await fetch('/api/dashboard', { cache: 'no-store' });
    if (!response.ok) throw new Error('El backend local no pudo completar la actualización.');
    const data = await response.json();
    renderDashboard(data);
    const failed = Object.values(data.sources).filter((source) => !source.ok).length;
    if (announce) {
      showToast(failed ? 'Actualización parcial: revisá el estado de las fuentes.' : 'Snapshot actualizado.');
    }
  } catch (error) {
    elements.heroStatus.textContent = 'No se pudo actualizar. Tus últimos datos visibles no cambiaron.';
    if (announce) showToast(error.message, true);
  } finally {
    updateInFlight = false;
    setLoading(false);
    scheduleAutoUpdate();
  }
}

elements.button.addEventListener('click', () => updateDashboard({ announce: true }));
elements.primaryTabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveView(tab.dataset.view));
});
window.addEventListener('hashchange', () => {
  setActiveView(window.location.hash.slice(1), false);
});
elements.spotTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activeSpotFilter = tab.dataset.spotFilter;
    elements.spotTabs.forEach((candidate) => {
      const isActive = candidate === tab;
      candidate.classList.toggle('is-active', isActive);
      candidate.setAttribute('aria-selected', String(isActive));
    });
    syncSpotAssetFilter();
    renderSpotAssets();
  });
});
elements.spotAssetFilter.addEventListener('change', () => {
  activeAssetFilter = elements.spotAssetFilter.value;
  renderSpotAssets();
});
elements.spotAssetsBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-history-asset]');
  if (!button) return;

  activeSpotFilter = button.dataset.historyExchange;
  activeAssetFilter = button.dataset.historyAsset;
  elements.spotTabs.forEach((tab) => {
    const isActive = tab.dataset.spotFilter === activeSpotFilter;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  syncSpotAssetFilter();
  renderSpotAssets();
  elements.purchaseHistoryTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

elements.tradingTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activeTradingFilter = tab.dataset.tradingFilter;
    elements.tradingTabs.forEach((candidate) => {
      const isActive = candidate === tab;
      candidate.classList.toggle('is-active', isActive);
      candidate.setAttribute('aria-selected', String(isActive));
    });
    renderTradingHistory();
  });
});
elements.tradingPeriodFilter.addEventListener('change', () => {
  activeTradingPeriod = Number(elements.tradingPeriodFilter.value) || 90;
  renderTradingHistory();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearAutoUpdateTimer();
    renderAutoUpdateStatus();
    return;
  }
  updateDashboard();
});

window.setInterval(renderAutoUpdateStatus, 1000);

setActiveView(window.location.hash.slice(1), false);
updateDashboard();
