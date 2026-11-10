# Gear data — scraping notes

Gear data is pulled from the **Smary Vindi Database** (public, player-maintained
from in-game values; no API). We mirror it into `data/gear/*.json` and refresh
when it updates. Base: `https://smaryita.github.io/SmaryVindiDataBase/`.

## Pages

Navigation is `location.href = '<file>.html'` on `.nav-button` elements.

| Category | Page |
| --- | --- |
| Uaithne Gear | `index.html` |
| Eriu Gear | `EriuGearTable.html` |
| Raids | `RaidsTable.html` |
| Redeemers | `RedeemersTable.html` |
| SpaceTime | `SpaceTimeTable.html` |
| Rhod's / Bracelets | `RhodsBracelets.html` |
| Enchant Scrolls | `Scrolls.html` |
| Accessories | `AccessoryTable.html` |

Each gear page has one `.gear-section` per slot (Weapon, Helm, Mail, Greaves,
Gauntlets, Boots). Within a section, two more layers live on **separate pages**,
linked from per-slot buttons:

- **Tuning** → `<Slot>Tuning.html` (e.g. `WeaponTuning.html`)
- **Destruction** → `<Slot>Surplus.html` (e.g. `WeaponSurplus.html`)

So the full surface is ~8 category pages plus the tuning/surplus sub-pages per
slot — roughly 30+ static pages.

## Page structure (gear tables)

- `.gear-section` → one slot.
- `.gear-card` → one grade of that slot. Header text is `"<Set> <Slot> (<Grade>)"`.
  Grades, low→high: **Regular, Beginner, Fine, Superior, Rare, Legendary**.
- `.stat-item` inside a card → `.stat-label` + `.stat-value` (e.g. `Attack: +500`,
  or `-` for none).
- Materials: each card is paired with a `#items-<set>-<slot>-<n>` accordion whose
  rows carry `.item-details` + `.item-quantity` (e.g. `x4 Sreng's Essence`).

Stat keys seen so far: Attack, Balance, Critical, Additional Damage (weapon);
Defence, Critical Resistance, Additional Damage (armor).

## Schema (`data/gear/<set>.json`)

```json
{
  "set": "Uaithne",
  "source": "<page url>",
  "scrapedLayers": ["base", "tuning", "destruction", "materials"],
  "slots": ["Weapon", "Helm", "Mail", "Greaves", "Gauntlets", "Boots"],
  "grades": ["Regular", "Beginner", "Fine", "Superior", "Rare", "Legendary"],
  "pieces": [
    {
      "slot": "Weapon", "grade": "Legendary",
      "base": { "Attack": 500, "Additional Damage": 100 },
      "tuning": { },
      "destruction": { },
      "materials": [ { "item": "Sreng's Essence", "qty": 4 } ]
    }
  ]
}
```

Only non-null stats are stored. `null`/`-` values are omitted.

## How to refresh

The pages are JS-navigated but statically rendered, so a headless browser reads
them cleanly. Extractor for the **base** layer (run in the page via the browser
tool, then reshape to the schema above):

```js
() => {
  const parseVal = (v) => { if (!v || v === "-") return null; const n = Number(String(v).replace(/[+,%\s]/g, "")); return Number.isFinite(n) ? n : v; };
  const pieces = [];
  for (const sec of document.querySelectorAll(".gear-section")) {
    for (const card of sec.querySelectorAll(".gear-card")) {
      const m = (card.querySelector(".card-header")?.innerText.trim().replace(/\s+/g, " ") || "").match(/^(\w+)\s+(\w+)\s+\((.+)\)$/);
      const stats = {};
      for (const s of card.querySelectorAll(".stat-item")) {
        const label = s.querySelector(".stat-label")?.innerText.trim().replace(/:$/, "");
        const value = parseVal(s.querySelector(".stat-value")?.innerText.trim());
        if (label && value != null) stats[label] = value;
      }
      pieces.push({ set: m?.[1], slot: m?.[2], grade: m?.[3], stats });
    }
  }
  return pieces;
}
```

## Status

- [x] `data/gear/uaithne.json` — base layer.
- [ ] Uaithne tuning / destruction / materials.
- [ ] Eriu, Raids, Redeemers, SpaceTime (same gear-table structure).
- [ ] Rhod's/Bracelets, Enchant Scrolls, Accessories (different shapes — inspect each).
