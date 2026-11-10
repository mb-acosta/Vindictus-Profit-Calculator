# Vindictus Profit Calculator

A tertiary toolbox companion for Vindictus — three static pages, no build step,
no backend. It sits beside the existing community sites rather than replacing them.

Open `index.html` in a browser (or host the folder on GitHub Pages). Everything
runs client-side; the values you enter are saved in your browser.

## Pages

- **[index.html](index.html) — Buy Calculator.** Compares cash-shop items and
  airgead in **million-gold per USD (M/$)**.
  - Cash-shop item: `M/$ = (sell gold / 1,000,000) / (NX cost / 1000)`
  - Airgead (`1 airgead = 1 NX`): `M/$ = 1000 / (airgead per 1M gold)`
- **[stats.html](stats.html) — Stat Compare.** A grade/stat table that highlights
  the best value per column. A starting point pending the real grade/stat model.
- **[gacha.html](gacha.html) — Gacha.** An animated roller, per-rarity and
  per-item odds, and coupon guarantees via the Exchange Shop. Rarity drives the
  convert value (Common 1 · Uncommon 2 · Fine 4 · Rare 40 · Legendary 50); the
  Exchange Shop lists the separate coupon cost to buy an item outright.

## Structure

```text
index.html / stats.html / gacha.html   pages (shared header + nav)
assets/
  styles.css   all styles, light + dark
  data.js      catalog + current gacha box + exchange shop (edit here)
  common.js    storage, formatters, DOM helpers, theme toggle, nav
  buy.js        Buy Calculator logic
  stats.js      Stat Compare logic
  gacha.js      Gacha roller + odds logic
```

Each page loads `data.js`, then `common.js`, then its own page script.

## Updating data

- **Cash-shop catalog** and the **current gacha box** (drop table + exchange shop)
  live in [assets/data.js](assets/data.js). When a new gacha goes live, replace
  the box's items/exchange from the official probability page and bump its
  `version` so everyone's saved copy refreshes.
- Fluctuating values — sell prices, the airgead rate, the roller session — live in
  the browser's `localStorage`, not in the repo.

## Hosting on GitHub Pages

Enable Pages for the repo (serve from the branch root). The site is plain static
files, so it works as-is at `https://<user>.github.io/Vindictus-Profit-Calculator/`.
