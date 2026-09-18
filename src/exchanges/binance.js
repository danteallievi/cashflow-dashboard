:root {
  --ink: #f1eee5;
  --muted: #96998e;
  --dim: #60645c;
  --bg: #0a0b09;
  --panel: rgba(20, 22, 18, 0.88);
  --panel-solid: #141612;
  --line: rgba(241, 238, 229, 0.11);
  --line-strong: rgba(241, 238, 229, 0.2);
  --orange: #f7931a;
  --orange-soft: #ffb75c;
  --acid: #c9ff58;
  --green: #70dc94;
  --red: #ff766f;
  --amber: #e9b963;
  --serif: "Iowan Old Style", "Baskerville", "Times New Roman", serif;
  --sans: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
  --mono: "SFMono-Regular", "Cascadia Mono", "Liberation Mono", monospace;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

html { background: var(--bg); scroll-behavior: smooth; }

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  color: var(--ink);
  background:
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.014) 1px, transparent 1px),
    var(--bg);
  background-size: 56px 56px;
  font-family: var(--sans);
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.06;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
}

button, a { -webkit-tap-highlight-color: transparent; }

.ambient {
  position: fixed;
  z-index: -2;
  width: 42rem;
  height: 42rem;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.07;
  pointer-events: none;
}

.ambient-one { top: -20rem; right: -10rem; background: var(--orange); }
.ambient-two { top: 45%; left: -25rem; background: var(--acid); opacity: 0.035; }

.shell { width: min(1760px, calc(100% - 64px)); margin: 0 auto; padding: 28px 0 48px; }

.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}

.brand { display: inline-flex; gap: 14px; align-items: center; color: inherit; text-decoration: none; }

.coin-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(247, 147, 26, 0.5);
  border-radius: 50%;
  color: var(--orange);
  background: rgba(247, 147, 26, 0.08);
  box-shadow: inset 0 0 0 5px rgba(247, 147, 26, 0.035);
  font: 600 23px/1 var(--serif);
}

.brand-copy { display: flex; flex-direction: column; gap: 3px; }
.eyebrow, .section-kicker, .section-index, .metric-label, .sync-label {
  color: var(--muted);
  font: 600 12px/1.2 var(--mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.wordmark { font: 600 20px/1 var(--serif); letter-spacing: 0.02em; }

.masthead-actions { display: flex; align-items: center; gap: 24px; }
.sync-copy { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.sync-copy time { color: #c7c9c1; font: 500 13px/1 var(--mono); }

.update-button {
  position: relative;
  display: inline-flex;
  min-width: 142px;
  height: 48px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 3px;
  color: #131009;
  background: var(--orange);
  box-shadow: 0 12px 34px rgba(247, 147, 26, 0.15);
  cursor: pointer;
  font: 800 13px/1 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.update-button::after {
  content: "";
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(40, 26, 7, 0.18);
  pointer-events: none;
}

.update-button:hover:not(:disabled) { transform: translateY(-2px); background: #ffa632; box-shadow: 0 16px 40px rgba(247, 147, 26, 0.23); }
.update-button:active:not(:disabled) { transform: translateY(0); }
.update-button:focus-visible { outline: 2px solid var(--acid); outline-offset: 4px; }
.update-button:disabled { cursor: wait; opacity: 0.76; }
.refresh-icon { width: 17px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.is-loading .refresh-icon { animation: spin 850ms linear infinite; }

.app-layout { display: grid; grid-template-columns: 240px minmax(0, 1440px); gap: 28px; justify-content: center; }
.app-content { min-width: 0; }
.primary-navigation { position: sticky; top: 24px; align-self: start; margin-top: 32px; padding: 14px; border: 1px solid var(--line); background: rgba(14,16,12,.86); box-shadow: 0 24px 70px rgba(0,0,0,.2); backdrop-filter: blur(20px); }
.nav-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 5px 5px 14px; border-bottom: 1px solid var(--line); }
.nav-heading span { color: var(--orange-soft); font: 700 10px/1 var(--mono); letter-spacing: .14em; }
.nav-heading small { color: var(--dim); font: 600 9px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; }
.primary-tabs { display: flex; flex-direction: column; gap: 8px; padding-top: 12px; }
.primary-tab { position: relative; display: grid; min-width: 0; min-height: 72px; grid-template-columns: 34px minmax(0,1fr) 18px; gap: 10px; align-items: center; padding: 13px 12px; border: 1px solid var(--line); border-radius: 2px; color: var(--muted); background: rgba(255,255,255,.012); cursor: pointer; text-align: left; transition: color 160ms ease, border-color 160ms ease, background 160ms ease, transform 160ms ease; }
.primary-tab::before { content: ""; position: absolute; top: 10px; bottom: 10px; left: -1px; width: 2px; background: transparent; transition: background 160ms ease; }
.nav-index { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid var(--line); border-radius: 50%; color: var(--dim); font: 700 9px/1 var(--mono); transition: color 160ms ease, border-color 160ms ease, background 160ms ease; }
.nav-copy { display: flex; min-width: 0; flex-direction: column; gap: 7px; }
.nav-copy strong { color: currentColor; font: 700 10.5px/1.2 var(--mono); letter-spacing: .02em; text-transform: uppercase; }
.nav-copy small { color: var(--dim); font: 500 9px/1 var(--mono); letter-spacing: .02em; white-space: nowrap; }
.nav-arrow { color: var(--dim); font: 500 16px/1 var(--mono); transition: color 160ms ease, transform 160ms ease; }
.primary-tab:hover { color: var(--ink); border-color: rgba(247,147,26,.34); background: rgba(247,147,26,.045); transform: translateX(2px); }
.primary-tab:hover .nav-arrow { color: var(--orange-soft); transform: translateX(2px); }
.primary-tab:focus-visible { outline: 2px solid var(--acid); outline-offset: 3px; }
.primary-tab.is-active { color: var(--ink); border-color: rgba(247,147,26,.46); background: linear-gradient(90deg, rgba(247,147,26,.12), rgba(247,147,26,.025)); }
.primary-tab.is-active::before { background: var(--orange); }
.primary-tab.is-active .nav-index { border-color: rgba(247,147,26,.55); color: var(--orange); background: rgba(247,147,26,.09); }
.primary-tab.is-active .nav-arrow { color: var(--orange); transform: translateX(2px); }
.nav-hint { margin: 14px 5px 2px; color: var(--dim); font: 500 9px/1.55 var(--mono); }
.nav-hint span { color: var(--orange); }
.page-view[hidden] { display: none; }
.page-view.is-active { animation: view-in 360ms both cubic-bezier(.22,1,.36,1); }

.spot-page-intro { display: grid; grid-template-columns: 1fr minmax(320px, .72fr); gap: 80px; align-items: end; padding: 60px 28px 44px; }
.spot-page-intro h1 { margin: 0; font: 500 clamp(44px, 5vw, 70px)/.96 var(--serif); letter-spacing: -.045em; }
.spot-page-intro h1 em { color: var(--muted); font-weight: 400; }
.spot-page-intro > p { max-width: 540px; margin: 0 0 4px; color: var(--muted); font-size: 16px; line-height: 1.6; }
.trading-page-intro h1 em { color: var(--orange-soft); }

.trading-scoreboard {
  display: grid;
  grid-template-columns: minmax(320px, .8fr) 1.45fr;
  border: 1px solid var(--line-strong);
  background: rgba(12, 14, 11, .72);
  box-shadow: 0 30px 90px rgba(0, 0, 0, .18);
}
.trading-net-card { position: relative; display: flex; min-height: 260px; flex-direction: column; justify-content: center; padding: 34px 38px; overflow: hidden; border-right: 1px solid var(--line-strong); }
.trading-net-card::before { content: ""; position: absolute; inset: 0; opacity: .6; pointer-events: none; background: radial-gradient(circle at 0 0, rgba(247,147,26,.13), transparent 62%); }
.trading-net-card > * { position: relative; }
.trading-net-card strong { margin: 25px 0 13px; font: 600 clamp(36px, 4.2vw, 62px)/.92 var(--mono); letter-spacing: -.07em; }
.trading-net-card p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
.trading-net-card.is-positive strong { color: var(--green); }
.trading-net-card.is-negative strong { color: var(--red); }
.result-rule { height: 3px; margin-top: 30px; overflow: hidden; background: var(--line); }
.result-rule span { display: block; width: 0; height: 100%; background: var(--muted); transition: width 700ms cubic-bezier(.22,1,.36,1); }
.trading-net-card.is-positive .result-rule span { background: var(--green); }
.trading-net-card.is-negative .result-rule span { background: var(--red); }
.trading-stat-grid { display: grid; grid-template-columns: 1fr 1fr; }
.trading-stat { position: relative; display: flex; min-width: 0; flex-direction: column; justify-content: center; padding: 28px 30px; border-left: 1px solid var(--line); border-top: 1px solid var(--line); }
.trading-stat:nth-child(-n + 2) { border-top: 0; }
.trading-stat:nth-child(odd) { border-left: 0; }
.trading-stat > span { color: var(--muted); font: 700 10px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.trading-stat strong { overflow: hidden; margin: 13px 0 8px; font: 600 clamp(20px, 2vw, 29px)/1 var(--mono); letter-spacing: -.045em; text-overflow: ellipsis; white-space: nowrap; }
.trading-stat:nth-child(1) strong { color: var(--green); }
.trading-stat:nth-child(2) strong { color: var(--red); }
.trading-stat small { color: var(--dim); font-size: 11px; }
.trading-history-panel { margin-top: 18px; }
.trading-history-heading { align-items: flex-end; gap: 24px; }
.trading-filters { display: flex; align-items: flex-end; gap: 12px; }
.trading-history-summary span:last-child { color: var(--muted); }
.trading-history-table td:last-child { background: rgba(255, 255, 255, .012); }
.trading-history-table .order-id { color: var(--orange-soft); }
.trading-method-note { margin: 0; padding: 17px 28px 20px; border-top: 1px solid var(--line); color: var(--dim); font-size: 12px; line-height: 1.55; }

.hero {
  display: grid;
  grid-template-columns: 0.8fr 1.65fr;
  gap: 70px;
  align-items: end;
  padding: 66px 0 58px;
}

.section-kicker { margin: 0 0 18px; color: var(--orange-soft); }
.hero h1 {
  max-width: 580px;
  margin: 0;
  font: 500 clamp(42px, 4.6vw, 72px)/0.97 var(--serif);
  letter-spacing: -0.045em;
}
.hero h1 em { color: var(--muted);