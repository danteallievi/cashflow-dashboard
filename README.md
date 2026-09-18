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
.primary-navigation { position: sticky; top: 24px; align-self: start; margin-top: 32px; padding: 14px