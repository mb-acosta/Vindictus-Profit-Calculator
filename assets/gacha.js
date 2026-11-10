// Gacha — animated roller, per-rarity and per-item odds, coupon guarantees via the Exchange Shop.

const RARITY = [
  { key: "Common", coupons: 1, color: "var(--r-common)" },
  { key: "Uncommon", coupons: 2, color: "var(--r-uncommon)" },
  { key: "Fine", coupons: 4, color: "var(--r-fine)" },
  { key: "Rare", coupons: 40, color: "var(--r-rare)" },
  { key: "Legendary", coupons: 50, color: "var(--r-veryrare)" },
];
const RARITY_ORDER = ["Legendary", "Rare", "Fine", "Uncommon", "Common"];
const BUNDLES = [11, 34, 58, 95];
const rarityInfo = (key) => RARITY.find((r) => r.key === key) ?? RARITY[0];
const couponsOf = (key) => rarityInfo(key).coupons;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const savedGacha = store.read("vpc.gacha", null);
const gachaState = savedGacha && savedGacha.version === GACHA_BOX.version
  ? savedGacha
  : { version: GACHA_BOX.version, target: 0, items: structuredClone(GACHA_BOX.items) };
const persistGacha = () => store.write("vpc.gacha", gachaState);
const exchangeCostOf = (name) => GACHA_BOX.exchange.find((e) => e.name === name)?.cost ?? null;

const session = { opened: 0, byRarity: {}, log: [] };

const reel = document.getElementById("reel");
const reelViewport = document.querySelector(".reel-viewport");
const rollResult = document.getElementById("roll-result");
const rarityOddsEl = document.getElementById("rarity-odds");
const targetSelect = document.getElementById("target-select");
const targetOddsEl = document.getElementById("target-odds");
const sessionStatsEl = document.getElementById("session-stats");
const gachaBody = document.getElementById("gacha-body");
const probTotal = document.getElementById("prob-total");
const gachaAssumption = document.getElementById("gacha-assumption");
const bundleGroup = document.getElementById("bundle-group");
document.getElementById("box-name-roller").textContent = GACHA_BOX.name;
document.getElementById("box-name-contents").textContent = GACHA_BOX.name;

const pct = (x) => (x * 100).toFixed(x >= 0.1 ? 1 : 2) + "%";
const probTotalValue = () => gachaState.items.reduce((s, it) => s + (Number(it.prob) || 0), 0);

function rollOnce() {
  const total = probTotalValue();
  let r = Math.random() * total;
  for (const it of gachaState.items) { r -= Number(it.prob) || 0; if (r <= 0) return it; }
  return gachaState.items[gachaState.items.length - 1];
}

function reelCard(item, win) {
  const info = rarityInfo(item.rarity);
  const div = document.createElement("div");
  div.className = "reel-card" + (win ? " win" : "");
  div.style.setProperty("--rc", info.color);
  div.innerHTML = `<div class="rc-name">${escapeHtml(item.name)}</div><div class="rc-rarity">${item.rarity}</div>`;
  return div;
}

function fillReel() {
  reel.style.transition = "none";
  reel.style.transform = "translateX(0)";
  reel.replaceChildren();
  for (let i = 0; i < 24; i++) reel.append(reelCard(rollOnce(), false));
}

let rolling = false;
const openButtons = () => Array.from(document.querySelectorAll(".open-btn"));
const setButtons = (disabled) => openButtons().forEach((b) => (b.disabled = disabled));

function recordPull(item) {
  session.opened++;
  session.byRarity[item.rarity] = (session.byRarity[item.rarity] || 0) + 1;
  if (item.rarity === "Rare" || item.rarity === "Legendary") session.log.unshift(item);
}

function animateReel(winner, onDone) {
  const stride = 104, cardW = 96, count = 48, winIndex = 40;
  const vp = reelViewport.clientWidth;
  const cards = [];
  reel.replaceChildren();
  for (let i = 0; i < count; i++) {
    const it = i === winIndex ? winner : rollOnce();
    const c = reelCard(it, false);
    reel.append(c); cards.push(c);
  }
  const jitter = (Math.random() - 0.5) * cardW * 0.6;
  const targetX = -(winIndex * stride + cardW / 2 - vp / 2 + jitter);

  reel.style.transition = "none";
  reel.style.transform = "translateX(0)";
  void reel.offsetWidth;

  if (reduceMotion) { cards[winIndex].classList.add("win"); reel.style.transform = `translateX(${targetX}px)`; onDone(); return; }
  reel.style.transition = "transform 4.8s cubic-bezier(.08,.72,.2,1)";
  reel.style.transform = `translateX(${targetX}px)`;
  reel.addEventListener("transitionend", () => { cards[winIndex].classList.add("win"); onDone(); }, { once: true });
}

function openOne() {
  if (rolling) return;
  rolling = true; setButtons(true);
  const winner = rollOnce();
  animateReel(winner, () => {
    recordPull(winner);
    showResult([winner]);
    renderSession();
    rolling = false; setButtons(false);
  });
}

function openMany(n) {
  if (rolling) return;
  const results = [];
  for (let i = 0; i < n; i++) { const it = rollOnce(); results.push(it); recordPull(it); }
  fillReel();
  showResult(results);
  renderSession();
}

function showResult(pulls) {
  rollResult.replaceChildren();
  if (pulls.length === 1) {
    const it = pulls[0], info = rarityInfo(it.rarity);
    const el = document.createElement("div");
    el.className = "result-single"; el.style.setProperty("--rc", info.color);
    el.innerHTML = `<div class="rs-rarity">${it.rarity}</div><div class="rs-name">${escapeHtml(it.name)}</div>`;
    rollResult.append(el);
    return;
  }
  const best = pulls.reduce((a, b) => (couponsOf(b.rarity) > couponsOf(a.rarity) ? b : a));
  const summary = document.createElement("div");
  summary.className = "result-summary";
  summary.innerHTML = `Opened ${pulls.length} · ${pulls.length} coupons · best: <b style="color:${rarityInfo(best.rarity).color}">${escapeHtml(best.name)}</b> (${best.rarity})`;
  rollResult.append(summary);

  const notable = pulls.filter((it) => it.rarity === "Rare" || it.rarity === "Legendary");
  const show = pulls.length <= 40 ? pulls : notable;
  if (show.length) {
    const grid = document.createElement("div");
    grid.className = "result-grid";
    for (const it of show) {
      const chip = document.createElement("div");
      chip.className = "result-chip"; chip.style.setProperty("--rc", rarityInfo(it.rarity).color);
      chip.textContent = it.name; chip.title = it.rarity;
      grid.append(chip);
    }
    rollResult.append(grid);
  } else {
    const none = document.createElement("div");
    none.className = "usd-sub"; none.textContent = "No Rare+ in this batch.";
    rollResult.append(none);
  }
}

function renderRarityOdds() {
  const total = probTotalValue() || 1;
  rarityOddsEl.replaceChildren();
  for (const key of RARITY_ORDER) {
    const sum = gachaState.items.filter((it) => it.rarity === key).reduce((s, it) => s + (Number(it.prob) || 0), 0);
    const frac = sum / total;
    const info = rarityInfo(key);
    const row = document.createElement("div");
    row.className = "odds-row";
    row.innerHTML =
      `<span class="odds-label" style="color:${info.color}">${key}</span>` +
      `<span class="odds-bar"><span class="odds-fill" style="width:${Math.min(100, frac * 100).toFixed(2)}%;background:${info.color}"></span></span>` +
      `<span class="odds-val">${pct(frac)}</span>`;
    rarityOddsEl.append(row);
  }
}

function populateTargetSelect() {
  targetSelect.replaceChildren();
  for (const key of RARITY_ORDER) {
    const group = gachaState.items.map((it, i) => ({ it, i })).filter((x) => x.it.rarity === key);
    if (!group.length) continue;
    const og = document.createElement("optgroup"); og.label = key;
    for (const { it, i } of group) { const o = document.createElement("option"); o.value = i; o.textContent = it.name; og.append(o); }
    targetSelect.append(og);
  }
  if (gachaState.target >= gachaState.items.length) gachaState.target = 0;
  targetSelect.value = String(gachaState.target);
}

function renderTargetOdds() {
  const it = gachaState.items[gachaState.target];
  targetOddsEl.replaceChildren();
  if (!it) return;

  const total = probTotalValue() || 1;
  const frac = (Number(it.prob) || 0) / total;
  const rarityFrac = (Number(it.prob) || 0) / (gachaState.items.filter((x) => x.rarity === it.rarity).reduce((s, x) => s + (Number(x.prob) || 0), 0) || 1);
  const exCost = exchangeCostOf(it.name);
  const convPerBox = gachaState.items
    .filter((x) => x.rarity !== "Rare" && x.rarity !== "Legendary")
    .reduce((s, x) => s + ((Number(x.prob) || 0) / total) * couponsOf(x.rarity), 0);
  const boxesWithConv = exCost != null ? Math.ceil(exCost / (1 + convPerBox)) : null;

  const tiles = document.createElement("div");
  tiles.className = "tiles";
  for (const n of [1, ...BUNDLES]) {
    const chance = frac > 0 ? 1 - Math.pow(1 - frac, n) : 0;
    const tile = document.createElement("div"); tile.className = "tile";
    tile.innerHTML = `<div class="k">x${n} bundle</div><div class="v">${pct(chance)}</div>`;
    tiles.append(tile);
  }
  targetOddsEl.append(tiles);

  const conf = (c) => (frac > 0 ? Math.ceil(Math.log(1 - c) / Math.log(1 - frac)) : "∞");
  const couponLine = exCost != null
    ? `<div class="line"><span class="label">Exchange Shop</span>costs <b>${exCost}</b> coupons &middot; guaranteed in <b>${exCost}</b> boxes at 1/box &middot; ~<b>${boxesWithConv}</b> if you convert commons–fines</div>`
    : `<div class="line"><span class="label">Exchange Shop</span>not sold here — no coupon guarantee, direct pulls only</div>`;
  const lines = document.createElement("div");
  lines.className = "gacha-lines";
  lines.innerHTML =
    `<div class="line"><span class="label">Single roll</span><b>${pct(frac)}</b> &middot; ${pct(rarityFrac)} of its rarity</div>` +
    `<div class="line"><span class="label">Boxes by luck</span>50% at <b>${conf(0.5)}</b> &middot; 90% at <b>${conf(0.9)}</b> &middot; 99% at <b>${conf(0.99)}</b></div>` +
    couponLine;
  targetOddsEl.append(lines);
}

function renderSession() {
  sessionStatsEl.replaceChildren();
  const guaranteed = session.opened;
  const convertible = (session.byRarity.Common || 0) * 1 + (session.byRarity.Uncommon || 0) * 2 + (session.byRarity.Fine || 0) * 4;

  const nums = document.createElement("div");
  nums.className = "session-nums";
  nums.innerHTML =
    `<div class="session-big"><div class="sb-num">${session.opened}</div><div class="sb-lbl">boxes opened</div></div>` +
    `<div class="session-big"><div class="sb-num">${guaranteed}</div><div class="sb-lbl">coupons (1/box)</div></div>`;

  const pills = document.createElement("div");
  pills.className = "stat-pills";
  for (const key of RARITY_ORDER) {
    const n = session.byRarity[key] || 0;
    const info = rarityInfo(key);
    const pill = document.createElement("span");
    pill.className = "stat-pill";
    pill.innerHTML = `<b style="color:${info.color}">${n}</b> ${key}`;
    pills.append(pill);
  }
  sessionStatsEl.append(nums, pills);

  const coup = document.createElement("div");
  coup.className = "session-coupons";
  coup.innerHTML = `<b>${guaranteed}</b> coupons guaranteed &middot; <b>+${convertible}</b> more if you convert commons–fines (Rare/Legendary kept)`;
  sessionStatsEl.append(coup);

  if (session.log.length) {
    const log = document.createElement("div");
    log.className = "session-log";
    log.innerHTML = `<span class="sl-h">Rare+ pulls</span>` +
      session.log.slice(0, 12).map((it) => `<span class="sl-row" style="--rc:${rarityInfo(it.rarity).color}">${escapeHtml(it.name)}</span>`).join("");
    sessionStatsEl.append(log);
  }
}

function renderContents() {
  gachaBody.replaceChildren();
  gachaState.items.forEach((it, i) => {
    const tr = document.createElement("tr");
    const rarity = document.createElement("select");
    for (const r of RARITY) { const o = document.createElement("option"); o.value = r.key; o.textContent = r.key; rarity.append(o); }
    rarity.value = it.rarity;
    rarity.addEventListener("change", () => { it.rarity = rarity.value; persistGacha(); renderGacha(); });

    const probInput = document.createElement("input");
    probInput.className = "num-in"; probInput.inputMode = "decimal"; probInput.value = it.prob;
    probInput.addEventListener("blur", () => { it.prob = parseFloat(probInput.value) || 0; persistGacha(); renderGacha(); });

    const del = document.createElement("button");
    del.className = "btn-icon"; del.textContent = "✕"; del.title = "Remove";
    del.addEventListener("click", () => {
      gachaState.items.splice(i, 1);
      if (gachaState.target >= gachaState.items.length) gachaState.target = 0;
      persistGacha(); renderGacha();
    });

    tr.append(editCell(it.name, (v) => { it.name = v; persistGacha(); }), cell(rarity), textCell(gold.format(couponsOf(it.rarity)), "num"), cell(probInput, "num"), cell(del));
    gachaBody.append(tr);
  });

  const total = probTotalValue();
  probTotal.textContent = `Total: ${total.toFixed(2)}%` + (Math.abs(total - 100) > 0.01 ? " — should be ~100%" : " ✓");
  probTotal.style.color = Math.abs(total - 100) > 0.5 ? "var(--bad)" : "var(--muted)";

  const exBody = document.getElementById("exchange-body");
  exBody.replaceChildren();
  for (const e of GACHA_BOX.exchange) {
    const tr = document.createElement("tr");
    tr.append(textCell(e.name), textCell(e.qty > 1 ? "×" + e.qty : "—", "num"), textCell(gold.format(e.cost), "num"));
    exBody.append(tr);
  }
}

function renderGacha() {
  renderRarityOdds();
  populateTargetSelect();
  renderTargetOdds();
  renderContents();
  renderSession();
  gachaAssumption.innerHTML =
    `<strong>Coupon note:</strong> each box gives 1 guaranteed coupon; you may instead convert a rolled item to its coupon value (Common 1 · Uncommon 2 · Fine 4 · Rare 40 · Legendary 50). ` +
    `Spend coupons in the Exchange Shop to buy a guaranteed item — its price is separate (Rare 400, Legendary 450). ` +
    `This tool assumes you keep Rare/Legendary pulls and convert only Common–Fine.`;
}

// Sub-tabs
const rollerView = document.getElementById("gview-roller");
const contentsView = document.getElementById("gview-contents");
const subRoller = document.getElementById("subtab-roller");
const subContents = document.getElementById("subtab-contents");
function showSub(roller) {
  rollerView.hidden = !roller; contentsView.hidden = roller;
  subRoller.setAttribute("aria-selected", String(roller));
  subContents.setAttribute("aria-selected", String(!roller));
  if (roller) fillReel();
}
subRoller.addEventListener("click", () => showSub(true));
subContents.addEventListener("click", () => showSub(false));

for (const n of BUNDLES) {
  const b = document.createElement("button");
  b.className = "btn open-btn"; b.dataset.n = n; b.textContent = "×" + n;
  bundleGroup.append(b);
}
const customInput = document.getElementById("custom-n");
const clampCustom = (v) => { const n = Math.floor(Number(String(v).replace(/[, ]/g, ""))); return Number.isFinite(n) ? Math.min(100000, Math.max(1, n)) : 0; };
document.querySelector(".roller-controls").addEventListener("click", (e) => {
  const btn = e.target.closest(".open-btn");
  if (!btn) return;
  if (btn.id === "open-custom") { const n = clampCustom(customInput.value); if (n) (n === 1 ? openOne() : openMany(n)); return; }
  const n = Number(btn.dataset.n);
  n === 1 ? openOne() : openMany(n);
});

targetSelect.addEventListener("change", () => { gachaState.target = Number(targetSelect.value); persistGacha(); renderTargetOdds(); });
document.getElementById("reset-session").addEventListener("click", () => {
  session.opened = 0; session.byRarity = {}; session.log = [];
  renderSession();
  rollResult.innerHTML = `<div class="placeholder">Open a box to roll.</div>`;
});

document.getElementById("add-gacha").addEventListener("click", () => {
  gachaState.items.push({ name: "New item", rarity: "Common", prob: 0 });
  persistGacha(); renderGacha();
});
document.getElementById("reset-gacha").addEventListener("click", () => {
  Object.assign(gachaState, { version: GACHA_BOX.version, target: 0, items: structuredClone(GACHA_BOX.items) });
  persistGacha(); renderGacha();
});

renderGacha();
fillReel();
rollResult.innerHTML = `<div class="placeholder">Open a box to roll.</div>`;
