// Stat Compare — define stat columns, add items by grade, highlight the best value per column.

const statState = store.read("vpc.stat", {
  columns: ["ATT", "Crit"],
  rows: [
    { name: "Accessory A", grade: "Gold", values: { ATT: 42, Crit: 8 } },
    { name: "Accessory B", grade: "Blue", values: { ATT: 30, Crit: 12 } },
  ],
});
const statHead = document.getElementById("stat-head");
const statBody = document.getElementById("stat-body");
const persistStat = () => store.write("vpc.stat", statState);

function th(text, className) { const el = document.createElement("th"); if (className) el.className = className; el.textContent = text; return el; }

function renderStat() {
  const headRow = document.createElement("tr");
  headRow.append(th("Item"), th("Grade"));
  for (const col of statState.columns) headRow.append(th(col, "num"));
  headRow.append(th(""));
  statHead.replaceChildren(headRow);

  const bestPerCol = {};
  for (const col of statState.columns) bestPerCol[col] = Math.max(...statState.rows.map((r) => Number(r.values[col]) || -Infinity));

  statBody.replaceChildren();
  statState.rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.append(editCell(r.name, (v) => { r.name = v; persistStat(); }), editCell(r.grade, (v) => { r.grade = v; persistStat(); }));
    for (const col of statState.columns) {
      const td = document.createElement("td"); td.className = "num";
      const input = document.createElement("input"); input.className = "num-in"; input.inputMode = "decimal"; input.value = r.values[col] ?? "";
      input.addEventListener("blur", () => { r.values[col] = input.value === "" ? "" : Number(input.value); persistStat(); renderStat(); });
      if ((Number(r.values[col]) || -Infinity) === bestPerCol[col] && statState.rows.length > 1) td.classList.add("stat-best");
      td.append(input); tr.append(td);
    }
    const del = document.createElement("td");
    const btn = document.createElement("button"); btn.className = "btn-icon"; btn.textContent = "✕"; btn.title = "Remove";
    btn.addEventListener("click", () => { statState.rows.splice(i, 1); persistStat(); renderStat(); });
    del.append(btn); tr.append(del);
    statBody.append(tr);
  });
}

document.getElementById("add-stat-row").addEventListener("click", () => { statState.rows.push({ name: "New item", grade: "", values: {} }); persistStat(); renderStat(); });
document.getElementById("add-stat-col").addEventListener("click", () => {
  const input = document.getElementById("new-stat"); const name = input.value.trim();
  if (name && !statState.columns.includes(name)) { statState.columns.push(name); input.value = ""; persistStat(); renderStat(); }
});

renderStat();
