<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#0a0b09" />
    <title>Satoshi Ledger — Crypto Dashboard Local</title>
    <link rel="icon" href="/favicon.svg?v=1" type="image/svg+xml" sizes="any" />
    <link rel="stylesheet" href="/styles.css?v=1.7.0" />
    <script src="/app.js?v=1.7.0" defer></script>
  </head>
  <body>
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <main class="shell">
      <header class="masthead reveal">
        <a class="brand" href="#" aria-label="Satoshi Ledger, inicio">
          <span class="coin-mark" aria-hidden="true">₿</span>
          <span class="brand-copy">
            <span class="eyebrow">Local / Read only</span>
            <span class="wordmark">Satoshi Ledger</span>
          </span>
        </a>

        <div class="masthead-actions">
          <div class="sync-copy">
            <span class="sync-label">Última actualización</span>
            <time id="updated-at">Todavía no actualizaste</time>
          </div>
          <button id="update-button" class="update-button" type="button">
            <svg class="refresh-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
            </svg>
            <span>Update</span>
          </button>
        </div>
      </header>

      <div class="app-layout">
        <aside class="primary-navigation reveal delay-1" aria-label="Navegación principal">
          <div class="nav-heading">
            <span>MAIN MENU</span>
            <small>3 secciones</small>
          </div>
          <nav class="primary-tabs" role="tablist" aria-label="Secciones principales">
            <button id="dashboard-tab" class="primary-tab is-active" type="button" role="tab" aria-selected="true" aria-controls="dashboard-view" data-view="dashboard">
              <span class="nav-index">01</span>
              <span class="nav-copy"><strong>Dashboard</strong><small>Resumen general</small></span>
              <span class="nav-arrow" aria-hidden="true">→</span>
            </button>
            <button id="spot-history-tab" class="primary-tab" type="button" role="tab" aria-selected="false" aria-controls="spot-history-view" data-view="spot-history">
              <span class="nav-index">02</span>
              <span class="nav-copy"><strong>Spot History</strong><small>Compras y costos</small></span>
              <span class="nav-arrow" aria-hidden="true">→</span>
            </button>
            <button id="trading-history-tab" class="primary-tab" type="button" role="tab" aria-selected="false" aria-controls="trading-history-view" data-view="trading-history">
              <span class="nav-index">03</span>
              <span class="nav-copy"><strong>Trading History</strong><small>Cierres y PnL</small></span>
              <span class="nav-arrow" aria-hidden="true">→</span>
            </button>
          </nav>
          <p class="nav-hint"><span aria-hidden="true">↳</span> Elegí una sección para navegar.</p>
        </aside>

        <div class="app-content">
          <section class="source-strip global-source-strip reveal delay-1" aria-label="Estado de actualización de fuentes" aria-live="polite">
            <div class="source-heading">
              <span class="section-index">LIVE</span>
              <span>Fuentes</span>
            </div>
            <div id="source-binance" class="source-pill is-idle">
              <span class="source-logo binance-logo">B</span>
              <span class="source-name">Binance</span>
              <span class="source-state">En espera</span>
            </div>
            <div id="source-bingx" class="source-pill is-idle">
              <span class="source-logo bingx-logo">X</span>
              <span class="source-name">BingX</span>
              <span class="source-state">En espera</span>
            </div>
            <span class="source-aside">Estado del último Update · visible en todas las secciones</span>
          </section>

      <div id="dashboard-view" class="page-view is-active" role="tabpanel" aria-labelledby="dashboard-tab">
      <section class="hero reveal delay-1" aria-labelledby="portfolio-title">
        <div class="hero-intro">
          <p class="section-kicker">Portfolio snapshot</p>
          <h1 id="portfolio-title">Tu Bitcoin en Spot,<br /><em>sin ruido.</em></h1>
          <p id="hero-status" class="hero-status">Presioná Update para consultar tus cuentas.</p>
        </div>

        <div class="hero-metrics">
          <article class="metric metric-primary">
            <span class="metric-label"><span class="live-dot"></span> BTC / USD</span>
            <strong id="btc-price" class="metric-value">—</strong>
            <span class="metric-note">Precio de referencia</span>
          </article>
          <article class="metric">
            <span class="metric-label">BTC Spot</span>
            <strong id="total-btc" class="metric-value">—</strong>
            <span class="metric-note">Disponible fuera de derivados</span>
          </article>
          <article class="metric">
            <span class="metric-label">Valor Spot</span>
            <strong id="total-usd" class="metric-value">—</strong>
            <span class="metric-note">Estimado al precio actual</span>
          </article>
        </div>
      </section>

      <div class="content-grid">
        <section class="panel spot-panel reveal delay-3" aria-labelledby="spot-title">
          <div class="panel-heading">
            <div>
              <span class="section-index">02 / COST BASIS</span>
              <h2 id="spot-title">BTC Spot</h2>
            </div>
            <span class="panel-chip is-estimate">Estimado</span>
          </div>

          <div class="spot-lead">
            <span>BTC actualmente en Spot</span>
            <strong id="spot-btc">—</strong>
          </div>
          <dl class="data-list">
            <div><dt>Precio promedio</dt><dd id="average-price">—</dd></div>
            <div><dt>Costo estimado</dt><dd id="estimated-cost">—</dd></div>
            <div><dt>Valor actual</dt><dd id="spot-current-value">—</dd></div>
          </dl>
          <div class="pnl-card is-neutral" id="spot-pnl-card">
            <span>PnL Spot estimado</span>
            <div class="pnl-values">
              <strong id="spot-pnl">—</strong>
              <span id="spot-pnl-percent">—</span>
            </div>
            <div class="pnl-line" aria-hidden="true"><span></span></div>
          </div>
          <p class="method-note">Costo promedio móvil sobre el historial disponible. El balance del exchange manda.</p>
        </section>

        <section class="panel overview-panel reveal delay-4" aria-labelledby="overview-title">
          <div class="panel-heading">
            <div>
              <span class="section-index">03 / BTC EQUITY</span>
              <h2 id="overview-title">BTC Overview</h2>
            </div>
            <span class="panel-chip is-estimate">At mark</span>
          </div>

          <div class="overview-comparison">
            <article class="overview-balance overview-balance-current">
              <span>BTC neto actual</span>
              <strong id="overview-current-btc">—</strong>
              <small><span id="overview-current-usd">—</span> · sin PnL abierto</small>
            </article>
            <article id="overview-net-card" class="overview-balance overview-balance-projected is-neutral">
              <span>BTC neto si cerraras ahora</span>
              <strong id="overview-net-btc">—</strong>
              <small id="overview-net-usd">—</small>
            </article>
          </div>
          <div id="overview-impact" class="overview-impact is-neutral">
           