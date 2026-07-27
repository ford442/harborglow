# Port Economy System - HarborGlow

## Overview

A lightweight economy layer that enhances progression while keeping the core crane + light-upgrade gameplay intact. Players earn Harbor Credits (HC) and Port Reputation through skillful installations, which unlock permanent upgrades and temporary boosts.

## Core Principles

1. **Reward Skill, Not Grind** - Perfect installations earn significantly more than sloppy ones
2. **Meaningful Choices** - Permanent upgrades vs temporary specialists create interesting decisions
3. **Transparent Progress** - Clear feedback on earnings and multipliers
4. **Non-Intrusive** - Economy enhances gameplay without overshadowing the crane operation

---

## Currencies

### Harbor Credits (HC)
- **Purpose**: The **only** player currency
- **Lives in**: `harborCredits` on the Zustand store — a single wallet, persisted with the rest of the save
- **Earned From**: Installations, ship completions, shift bonuses, crane contracts, tug objectives, mission rewards
- **Spent On**: Dock upgrades, specialist hires, tugboat upgrades, salvage fees, mission penalties
- **Visual**: Gold coin icon (💰), displayed in Operator Status Panel

> **There is no second ledger.** Until save v4 the game had two: `money` on the
> store (persisted, used by tug/salvage/mission flows) and
> `economySystem.state.harborCredits` (in-memory, used by installs and the shop).
> They have been merged. `economySystem` is now a *calculator and catalog* — it
> decides how much an install is worth and what the shop sells, but never holds
> a balance.

### Port Reputation (0-1000)
- **Purpose**: Long-term progression metric
- **Earned From**: Shift performance, perfect installations, ship completions
- **Visual**: Tier-based color coding in progress bar
- **Max Cap**: 1000 points (Legendary tier)

---

## Earning Mechanics

### Base Installation Rewards

| Rig Type | Base HC |
|----------|---------|
| Basic LED | 50 |
| RGB Matrix | 75 |
| Spotlight | 100 |
| Laser Array | 150 |
| Holographic | 200 |
| Plasma Rig | 300 |

### Multipliers

| Factor | Calculation | Max Bonus |
|--------|-------------|-----------|
| **Speed** | Target time / Actual time | 2x base |
| **Precision** | <10% sway = 1.5x, <30% = 1.2x | 1.5x base |
| **Music Sync** | Beat accuracy × 0.5 | +50% base |
| **Weather** | Storm 2x, Rain 1.3x, Fog 1.5x | 2x base |
| **Events** | Active dynamic event | +50% base |
| **Streak** | 5% per consecutive perfect | +50% base |

### Ship Completion Bonus

| Ship Type | Base Completion Bonus |
|-----------|----------------------|
| Cruise | 500 HC |
| Container | 750 HC |
| Tanker | 1,000 HC |
| Bulk | 800 HC |
| LNG | 1,500 HC |

*Bonus scales with completion rate (100% = full bonus)*

### Shift Bonuses

| Condition | Bonus |
|-----------|-------|
| Perfect Shift (all installs perfect) | +500 HC |
| High Volume (10+ installs) | +200 HC |
| Base Reputation Gain | Total earnings / 100 |

---

## Spending & Progression

### Permanent Dock Upgrades

| Upgrade | Effect | Cost | Max Level |
|---------|--------|------|-----------|
| **Hydraulic Boost** | +10% crane speed | 500 HC | 5 |
| **Active Stabilizers** | -15% load sway | 750 HC | 3 |
| **Business License** | +20% credit earnings | 1,000 HC | 3 |
| **Port Authority Partnership** | +25% reputation gain | 1,500 HC | 2 |
| **Advanced Rig License** | Unlock Laser Arrays | 2,500 HC | 1 |
| **Premium LED Package** | Cosmetic: Brighter lights | 1,000 HC | 1 |

*Costs increase 50% per level*

### Specialist Hires (Temporary Boosts)

| Specialist | Role | Effect | Duration | Cost |
|------------|------|--------|----------|------|
| **Jack "Speed" Morrison** | Speed Specialist | 2x speed bonus | 10 min | 300 HC |
| **Sarah Chen** | Precision Expert | 2x precision, -sway | 15 min | 400 HC |
| **DJ Kaito** | Music Sync Specialist | 3x sync bonus | 10 min | 350 HC |
| **Maria Rodriguez** | Event Coordinator | 2x event bonuses | 20 min | 500 HC |
| **Captain Wei** | Rare Ship Broker | 2x rare ship chance | 30 min | 600 HC |

---

## Reputation Tiers

| Tier | Rep Required | Color | Badge |
|------|--------------|-------|-------|
| Novice | 0 | Gray | 🌱 |
| Apprentice | 100 | Blue | 🔧 |
| Operator | 250 | Teal | ⚓ |
| Veteran | 500 | Orange | 🏗️ |
| Expert | 750 | Red | ⭐ |
| Legendary | 1000 | Gold | 🏆 |

---

## UI Integration

### Operator Status Panel
- **Credit Counter**: Prominent display with gold styling
- **Reputation Bar**: Color-coded progress bar (0-1000)
- **Floating Feedback**: +HC text with breakdown on successful installs

### Upgrade Shop
- Accessible from Operator Cabin or Main Menu
- Shows available upgrades with costs
- Displays active specialist boosts
- Real-time credit balance

---

## Technical Implementation

### State Management

The wallet is store state:

```typescript
// GameState (src/store/gameStoreTypes.ts)
harborCredits: number
unlockedShopItems: string[]

addHarborCredits(amount: number, source?: string): void
spendHarborCredits(amount: number, reason?: string): boolean  // false when short
purchaseShopItem(itemId: string): boolean
```

`EconomyState` in `economySystem` keeps only effect/statistic state — no balance:

```typescript
interface EconomyState {
  lifetimeCredits: number      // statistic, not a balance
  portReputation: number
  shiftPerformance: ShiftStats
  unlockedUpgrades: string[]
  activeBoosts: ActiveBoost[]
  dockLevel: number
}
```

### Key Methods
- `recordInstallation(factors)` — calculates earnings, pays them into the store wallet
- `recordShipCompletion(shipType, completionRate)` — completion bonuses, same wallet
- `purchaseUpgrade(upgradeId)` / `hireSpecialist(specialistId)` — spend via `spendHarborCredits`
- `endShift()` — shift bonuses, reset shift stats
- `SHOP_CATALOG: ShopItem[]` — one typed surface over dock upgrades + specialists
- `applyShopItemPurchase(item)` — applies effects *after* the store has taken payment

Every spend path — shop, specialists, tugboat upgrades — goes through
`spendHarborCredits`, which refuses rather than partially debiting. The one
exception is the deprecated `deductMoney`, kept for a release: it clamps at zero
for legacy callers that never checked affordability.

### Persistence
- Wallet and unlocks are ordinary store fields, saved by the single save
  subscription (see [STORE.md](../STORE.md))
- Upgrade levels, boosts and shift stats ride along in `economyData`
- **Save v4** (`harborglow-save-v4`). Loading a v3 save migrates it forward:
  `harborCredits = money + economyData.state.harborCredits`, so credits that were
  split across the two ledgers are summed rather than lost. See `migrateV3` in
  `src/utils/storage_manager.ts`.

---

## Balance Philosophy

### Earning Rate
- Average installation: 75-150 HC
- Average shift (10 installs): 1,000-1,500 HC
- First upgrade purchase: ~30 minutes of gameplay
- All upgrades unlocked: ~10-15 hours of gameplay

### Progression Curve
- Early game: Focus on learning, low stakes
- Mid game: Meaningful upgrade choices
- Late game: Optimization, cosmetic rewards

### Anti-Grind Measures
- Diminishing returns on repetitive actions
- Shift system encourages breaks
- Perfect installation bonuses reward skill over time

---

## Debug Controls (Leva)

| Control | Function |
|---------|----------|
| Set Credits | Adjust HC balance |
| Set Reputation | Set rep score (0-1000) |
| Simulate Installation | Trigger standard install |
| Simulate Perfect Install | Trigger perfect install |
| Simulate Shift | Run 5-install simulation |
| End Shift | Trigger shift end + bonuses |
| Reset Economy | Reset all economy state |

---

## Future Extensions

### Potential Additions
1. **Daily Contracts** - Special objectives for bonus rewards
2. **Market Fluctuations** - Ship type values change over time
3. **Competition Mode** - Compare earnings with other players
4. **Achievement System** - Milestones for unique rewards
5. **Seasonal Events** - Limited-time bonus multipliers

### Integration Points
- **Training System**: Reduced/no earnings in training mode
- **Dynamic Events**: Event multipliers stack with boost multipliers
- **Reputation System**: Port rep contributes to main reputation
- **Sound System**: Coin sounds on credit earnings
