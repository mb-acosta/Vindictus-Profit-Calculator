# Character stat model — reference notes

Reference for the eventual mechanics phase (computing character stats from inputs
+ gear + buffs), captured from the armory (armory.vindi.app) at Lv. 125s.

Wiki (treat as possibly out of date):
<https://vindictus.fandom.com/wiki/Character_Stats>

## How the armory frames it

- **Inputs the user supplies** ("Character Info"):
  - Title totals: `STR`, `AGI`, `INT`, `WIL`, `M.ATT`, `Balance`, `Critical`, `HP`.
  - Redeemers raid completion per raid (`Neamhain`, `Balor`, `Brigid`, `Laura`):
    No Progress → 100% (2 clears). A permanent stat source.
  - Gear (equipped pieces), and toggleable **Buffs** (Town Effects, Items, Skills,
    Battle Effects) — each a stat source.
- **Primary stats** `STR / INT / AGI / WIL` drive **derived stats** `M.ATT`, `DEF`,
  `Critical`, `Critical Damage`, `Max HP`, etc.
- **Battles** panel is per-battle context (enemy/requirement values and **stat
  caps**), not character stats — e.g. Ancient Temple Ruins Lv.125s caps: Balance
  223, Critical 395, Critical Resist 450. These are constant across profiles.

## Three validation data points (same character, Lv. 125s)

| Field | A: bare (no gear, no titles) | B: titles only | C: full build |
| --- | --- | --- | --- |
| **Inputs** | all 0 | STR 631, AGI 546, INT 889, WIL 540, HP 260 | STR 636, AGI 551, INT 896, WIL 545, M.ATT 49, Balance 5, Critical 3, HP 280 |
| Redeemers | none | none | all 100% (2 clears) |
| Buffs/gear | none | none | full gear + Partholon Vanguard + Redeemers 11/15 |
| STR | 505 | 1136 | 3420 |
| AGI | 813 | 1359 | 2483 |
| INT | 994 | 1883 | 4947 |
| WIL | 809 | 1349 | 2568 |
| M.ATT | 2688 | 4466 | 75019 |
| DEF | 1686 | 1959 | 39380 |
| Critical | 37 | 41 | 369 |
| Critical Damage | 179 | 193 | 195 |
| Balance | 0 | 0 | 220 |
| Critical Resist | 0 | 0 | 356 |
| DEF Penetration | 0 | 0 | 466 |
| Additional DMG | 0 | 0 | 8830 |
| Attack Speed | 0 | 0 | 89 |
| Destruction | 0 | 0 | 11750 |
| Max HP | 7039 | 7623 | 14775 |
| Max Stamina | 202 | 202 | 255 |
| Luck | 100 | 100 | 101 |

## Relationships observed (A → B, primary-stat contribution only)

- **Title STR/AGI/INT/WIL add 1:1** to the primary stats (505+631=1136, 994+889=1883,
  813+546=1359, 809+540=1349).
- **M.ATT = 2 × INT + 700** for this character with no gear: slope
  (4466−2688)/(1883−994) = 2.0 exactly, intercept 700. Gear then adds M.ATT on top
  (C's 75019 is gear-driven and not decomposable by hand).
- Smaller derived deltas from the same title block (derivation TBD from the wiki):
  - DEF +273, Critical +4, Critical Damage +14, Max HP +584 (HP input 260 plus
    STR/WIL contributions).

Point **C** mixes gear + Redeemers + buffs, so it isn't hand-decomposable — it's the
end-to-end target the stat engine should reproduce once per-source formulas are in.

## Open questions for the engine

- Exact DEF / Critical / Critical Damage / Max HP formulas from primary stats (and
  which stat feeds each) — confirm against the wiki, then against point B.
- How Redeemers completion and each buff contribute (flat vs %).
- Gear contribution: base + tuning + destruction + set bonuses (see
  `scripts/SCRAPING.md`).
- Per-battle stat caps (how/when Balance, Critical, Critical Resist are capped).
