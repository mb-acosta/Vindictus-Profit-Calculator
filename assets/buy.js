// Buy Calculator — cash-shop items and airgead compared in million-gold per USD.

const MILLION = 1_000_000;
const NX_PER_USD = 1000;       // $1 USD = 1000 NX
const AIRGEAD_PER_USD = 1000;  // 1 airgead = 1 NX, so $1 USD = 1000 airgead
const EXAMPLE_AG = { market: 300 };

const state = {
  sell: store.read("vpc.sell", structuredClone(EXAMPLE_SELL)),
  compare: new Set(store.read("vpc.compare", [])),
  ag: store.read("vpc.ag", structuredClone(EXAMPLE_AG)),
};

const items = () => CATALOG;
const nxOf = (item) => item.nx ?? 0;
const sellOf = (id) => state.sell[id] ?? 0;

const mpdFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const usdOf = (nx) => nx / NX_PER_USD;
const itemMPD = (item) => { const usd = usdOf(nxOf(item)); return usd > 0 ? (sellOf(item.id) / MILLION) / usd : null; };
const airgeadMPD = () => (state.ag.market > 0 ? AIRGEAD_PER_USD / state.ag.market : null);

function persist() {
  store.write("vpc.sell", state.sell);
  store.write("vpc.compare", [...state.compare]);
  store.write("vpc.ag", state.ag);
}

const marketBody = document.getElementById("market-body");
const compareEl = document.getElementById("compare");
const benchmarkEl = document.getElementById("benchmark");

function renderBenchmark() {
  const mpd = airgeadMPD();
  if (mpd === null) {
    benchmarkEl.innerHTML = `<span class="break">Enter the airgead rate to see the baseline.</span>`;
  } else {
    benchmarkEl.innerHTML =
      `<span class="big">${mpdFmt.format(mpd)}</span><span class="unit">M&nbsp;gold / $1 USD</span>` +
      `<span class="break">${gold.format(AIRGEAD_PER_USD)} airgead per $1 ÷ ${gold.format(state.ag.market)} airgead per 1M gold</span>`;
  }
  renderMarket();
}

function renderMarket() {
  const baseline = airgeadMPD();
  marketBody.replaceChildren();
  for (const item of items()) {
    const nx = nxOf(item);
    const mpd = itemMPD(item);
    const row = document.createElement("tr");

    const pick = document.createElement("input");
    pick.type = "checkbox";
    pick.checked = state.compare.has(item.id);
    pick.setAttribute("aria-label", "Compare " + item.name);
    pick.addEventListener("change", () => { pick.checked ? state.compare.add(item.id) : state.compare.delete(item.id); persist(); renderCompare(); });

    const sellInput = numInput(sellOf(item.id), (n) => { state.sell[item.id] = n; persist(); renderBenchmark(); });

    const nxCell = textCell(gold.format(nx), "num");
    nxCell.append(subLine(usdFmt.format(usdOf(nx))));

    row.append(
      cell(pick),
      nameCell(item),
      nxCell,
      cell(sellInput, "num"),
      textCell(mpd === null ? "—" : mpdFmt.format(mpd), "num mpd"),
      cell(deltaChip(mpd, baseline), "num"),
      cell(item.example ? exampleTag() : document.createElement("span")),
    );
    marketBody.append(row);
  }
  renderCompare();
}

function deltaChip(mpd, baseline) {
  if (mpd === null || baseline === null) return span("delta flat", "—");
  const diff = mpd - baseline;
  const cls = diff > 0.004 ? "up" : diff < -0.004 ? "down" : "flat";
  const sign = diff > 0 ? "+" : "";
  return span("delta " + cls, cls === "flat" ? "even" : `${sign}${mpdFmt.format(diff)}`);
}

function renderCompare() {
  const picked = items().filter((it) => state.compare.has(it.id));
  compareEl.replaceChildren();
  if (picked.length < 1) return;

  const baseline = airgeadMPD();
  const contenders = picked.map((it) => ({ name: it.name, mpd: itemMPD(it), item: it }));
  if (baseline !== null) contenders.push({ name: "Buy airgead", mpd: baseline, airgead: true });

  const ranked = contenders.filter((c) => c.mpd !== null).sort((a, b) => b.mpd - a.mpd);
  const bestMpd = ranked.length ? ranked[0].mpd : null;

  for (const c of ranked) {
    const card = document.createElement("div");
    card.className = "cc" + (c.mpd === bestMpd ? " best" : "") + (c.airgead ? " airgead" : "");
    const detail = c.airgead
      ? `<dl><dt>Airgead / 1M gold</dt><dd>${gold.format(state.ag.market)}</dd><dt>Airgead / $1</dt><dd>${gold.format(AIRGEAD_PER_USD)}</dd></dl>`
      : `<dl><dt>NX cost</dt><dd>${gold.format(nxOf(c.item))}</dd><dt>USD</dt><dd>${usdFmt.format(usdOf(nxOf(c.item)))}</dd><dt>Sells for</dt><dd>${gold.format(sellOf(c.item.id))}</dd></dl>`;
    card.innerHTML =
      `<h3>${escapeHtml(c.name)}</h3>` +
      (c.mpd === bestMpd ? '<span class="chip">Best value</span>' : "") +
      `<div class="lead" style="color:${c.airgead ? "var(--silver)" : "var(--gold)"}">${mpdFmt.format(c.mpd)} <span style="font-size:.75rem;color:var(--muted);font-family:var(--font-body)">M/$</span></div>` +
      detail;
    compareEl.append(card);
  }
}

function nameCell(item) { const td = document.createElement("td"); td.innerHTML = `<div class="item-name">${escapeHtml(item.name)}</div><div class="item-cat">${escapeHtml(item.category || "")}</div>`; return td; }
function exampleTag() { return span("chip example", "example"); }

const agMarket = document.getElementById("ag-market");
agMarket.value = gold.format(state.ag.market);
agMarket.addEventListener("blur", () => { state.ag.market = parseNum(agMarket.value) ?? 0; agMarket.value = gold.format(state.ag.market); persist(); renderBenchmark(); });

renderBenchmark();
