# Vindictus Profit Calculator

A tertiary toolbox companion for Vindictus. It compares the real-money value of
purchases and (soon) simulates gacha box odds. It does not replace the existing
community sites — it sits beside them.

Open `index.html` in a browser; everything runs client-side and your entered
values are saved in that browser.

## Buy Calculator

Everything resolves to **million-gold per USD (M/$)** — higher is better value.

- **Cash-shop item:** buy for NX, sell in-game for gold.
  `M/$ = (sell gold / 1,000,000) / (NX cost / 1000)`
- **Airgead benchmark:** buy airgead, buy gold with it. `1 airgead = 1 NX`, so
  `M/$ = 1000 / (airgead per 1M gold)`.

Each item's **vs airgead** figure shows how much better or worse its M/$ is than
buying airgead. Tick two or more items to rank them against each other and the
airgead baseline.

NX prices are fixed in the catalog; the current sell price and the airgead rate
are the fluctuating values you enter.

## Stat Compare

A grade/stat table that highlights the best value per stat column. A starting
point pending the real grade/stat model.

## Data

- **Catalog** (`CATALOG` in the page) — item names and NX prices. Destined for
  `data/items.json` once the full list is in. Seeded with example rows for now.
- **Fluctuating values** — sell prices and the airgead rate live in the browser's
  `localStorage`, not in the repo.

## Editing

`index.html` is generated from the Artifact source; edit there and regenerate
rather than hand-editing the built file.
