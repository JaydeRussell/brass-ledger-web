# Core Rules — Reference: Core Abilities & Rules Appendix

Source: Warhammer 40,000 Core Rules booklet, "REFERENCE" section, pages 78–88
(section 24, "Core Abilities," plus the "Rules Appendix" pages that follow it).
Page 89 (the Core Rules Index) is a page-number index only and is not
reproduced here.

## How abilities work (24.01–24.02)

- Many units have **core abilities** listed on their datasheets, and
  **weapon abilities** listed in their weapon profiles.
- **Weapon abilities** are presented in square brackets with bold
  formatting, e.g. `[BLAST]`. Weapons are often described using a
  particular ability they have, e.g. `[BLAST]` weapons are those with the
  `[BLAST]` ability.
- If a weapon ability is followed by one or more keywords, when making
  attacks with that weapon, that ability only applies if the target unit
  has one or more of those keywords.
  - Example: `[LETHAL HITS: VEHICLE]` only applies to attacks that target
    a `VEHICLE` unit. `[SUSTAINED HITS 1: INFANTRY/BEASTS]` only applies
    to attacks that target an `INFANTRY/BEASTS` unit.
- **Duplicated abilities (24.02)**: multiple instances of the same core
  ability or weapon ability are **not cumulative**, regardless of any
  numbers or keywords included in them. In such cases, the controlling
  player must select which instance will apply at any one time. For
  duplicated weapon abilities, this selection must be made each time that
  unit makes attacks, in the Select Weapons step.
  - Multiple instances of core abilities that include a number are
    duplicated even if that number varies. **Exception: Scouts** — you
    must select the lowest number not shared by every model in that unit
    (e.g. if every model in a unit has both Scouts 6" and Scouts 8", you
    could select Scouts 8" as it is shared by every model; but if a unit
    contains one model with Scouts 6" and five with Scouts 8", you must
    select Scouts 6").
  - Multiple instances of weapon abilities that include a number (e.g.
    `[SUSTAINED HITS 1]`) are duplicated even if that number varies (e.g.
    the controlling player would have to select between
    `[SUSTAINED HITS 1]` and `[SUSTAINED HITS 2]`).
  - Multiple instances of weapon abilities that include a keyword are
    duplicated even if that keyword varies (e.g. the controlling player
    would have to select between `[ANTI-VEHICLE 4+]` and
    `[ANTI-INFANTRY 2+]`).

## Core Abilities

### `[ANTI]` (24.03)

This ability always takes the form `[ANTI-X Y+]`. Each time an attack is
made with an `[ANTI]` weapon, if the target unit has the keyword denoted
by **X**, an unmodified **wound roll** of **Y+** is a **critical wound**.

- Example: an attack made with an `[ANTI-VEHICLE 4+]` weapon against a
  `VEHICLE` unit will result in a critical wound on an unmodified wound
  roll of 4+, while an attack made with an `[ANTI-PSYKER 2+]` weapon
  against a `PSYKER` unit will result in a critical wound on an unmodified
  wound roll of 2+.

### `[ASSAULT]` (24.04)

Units containing one or more models with an `[ASSAULT]` weapon can shoot
using **assault shooting** (10.05).

### `[BLAST]` (24.05)

Each time you gather attack dice for a `[BLAST]` weapon, add one
additional attack die for every five models that were in the target unit
in the Select Targets step (rounding down).

If this ability takes the form `[BLAST X]`, each time you gather attack
dice for such a weapon, add **X** additional attack dice for every five
models that were in the target unit in the Select Targets step (rounding
down) instead.

- Example: if a `[BLAST 2]` weapon with an **A** characteristic of 3
  targets a unit containing 12 models, you would gather four additional
  attack dice for that weapon (for a total of seven for that weapon).

### `[CLEAVE]` (24.06)

This ability always takes the form `[CLEAVE X]`. Each time you gather
attack dice for a `[CLEAVE]` weapon, if you only selected one target for
all of that weapon's attacks, add **X** additional attack dice for every
five models that were in the target unit in the Select Targets step
(rounding down).

- Example: if a `[CLEAVE 1]` weapon with an **A** characteristic of 3
  targets one unit containing 16 models, you would gather three additional
  attack dice for that weapon (for a total of six for that weapon).

### `[CLOSE-QUARTERS]` (24.07)

Units containing one or more models with a `[CLOSE-QUARTERS]` weapon can
shoot using **close-quarters shooting** (10.06).

When using another shooting type, for each model in that unit (excluding
`MONSTER`/`VEHICLE` models), you can only select **one** of the following
to make attacks with:

- One or more of its `[CLOSE-QUARTERS]` weapons.
- One or more of its other ranged weapons.

### Deadly Demise (24.08)

This ability always takes the form **Deadly Demise X**. Each time a model
in this unit is **destroyed**, after the models embarked within it (if
any) have made their **emergency disembark moves**, roll one D6. On a 6,
that model suffers a **deadly demise**; each unit within 6" of that model
suffers a number of **mortal wounds** denoted by **X** (if this is a
random number, roll separately for each unit within 6").

- Example: an Impulsor with a unit of Intercessors embarked within it is
  destroyed by ranged attacks. First, any unresolved attacks made by the
  attacking unit are resolved. Then the Intercessors make an emergency
  disembark move. Then the roll is made for the Deadly Demise ability, and
  on a 6, that ability is resolved. Finally, the Impulsor is removed from
  the battlefield.

### Deep Strike (24.09)

Each time this unit makes an **ingress move** (20.04), if every model in
this unit has this ability, it can be set up anywhere on the battlefield
that is more than 8" horizontally from all enemy units, even if that is
within your opponent's deployment zone.

### `[DEVASTATING WOUNDS]` (24.10)

Each time an attack made with a `[DEVASTATING WOUNDS]` weapon results in a
**critical wound**, the attack sequence for that attack ends and the
target unit suffers a number of **mortal wounds** equal to the **D**
characteristic of that weapon. These are inflicted after resolving any
normal damage inflicted by those attacks.

Mortal wounds inflicted by `[DEVASTATING WOUNDS]` weapons can damage a
maximum of one model for each critical wound; any remaining mortal wounds
inflicted by that attack are lost.

- Example: an attack made with a `[DEVASTATING WOUNDS]` weapon with a **D**
  characteristic of 3 results in a critical wound against an Intercessor
  Squad, so inflicts 3 mortal wounds. The first 2 mortal wounds are
  sufficient to destroy 1 Intercessor model, so the remaining mortal wound
  is lost.

### `[EXTRA ATTACKS]` (24.11)

Each time a unit containing one or more models with an `[EXTRA ATTACKS]`
weapon fights, those models will make attacks with those weapons in
addition to any others. In the Select Weapons step (04.01), for each of
those models, you must select:

- All of that model's `[EXTRA ATTACKS]` weapons.
- One of that model's other melee weapons, if possible.

### Feel No Pain (24.12)

This ability always takes the form **Feel No Pain X+**. Each time a model
with this ability would lose a wound, roll one D6: on an X+, that wound is
not lost.

### Fights First (24.13)

While every model in a unit has this ability, that unit is a **Fights
First** unit.

See the Resolve Fights First Combats step in the Fight phase (12.04).

### Firing Deck (24.14)

This ability always takes the form **Firing Deck X**. In your Shooting
phase, each time this `TRANSPORT` is **selected to shoot**, if one or more
units are embarked within it, resolve the following sequence:

1. Select up to **X** models embarked within this `TRANSPORT` (excluding
   models whose units have already been **selected to shoot** this
   phase).
2. For each selected model, select one of its ranged weapons (excluding
   `[ONE SHOT]` weapons).
3. Until this `TRANSPORT` has resolved all of its attacks, it has all of
   those selected weapons in addition to its other weapons.
4. Until the end of the turn, units embarked within this `TRANSPORT` are
   **not eligible to shoot**.

### `[HAZARDOUS]` (24.15)

Each time a unit is **selected to shoot** or **selected to fight**, after
that unit has resolved all of its attacks, make a number of **hazard
rolls** (06.03) for that unit equal to the number of `[HAZARDOUS]` weapons
you selected in the Select Weapons step.

### `[HEAVY]` (24.16)

In your Shooting phase, each time an attack is made with a `[HEAVY]`
weapon, add 1 to the **hit roll** if **all** of the following apply to the
attacking unit:

- That unit is **unengaged**.
- That unit was not set up on the battlefield this turn.
- No model in that unit has moved more than 3" this turn.

### Hover (24.17)

Each time this unit **takes to the skies** (21.03), do not subtract 2"
from the **maximum distance**.

### `[IGNORES COVER]` (24.18)

Each time an attack is made with an `[IGNORES COVER]` weapon, the target
cannot have the **benefit of cover** against that attack (13.08), including
from rules that give a model or unit the benefit of cover (e.g. Stealth).

### `[INDIRECT FIRE]` (24.19)

Units containing one or more models with an `[INDIRECT FIRE]` weapon can
shoot using **indirect shooting** (10.07).

### Infiltrators (24.20)

During deployment, if every model in a unit has this ability, it can be
set up anywhere on the battlefield that is more than 8" horizontally from
your opponent's deployment zone and all enemy units.

### `[LANCE]` (24.21)

Each time an attack is made with a `[LANCE]` weapon, if the attacking
model's unit made a **charge move** this turn, add 1 to the **wound
roll**.

### Leader (24.22)

See Attached Units (section 19).

### `[LETHAL HITS]` (24.23)

Each time an attack made with a `[LETHAL HITS]` weapon results in a
**critical hit**, you can choose for that attack to automatically wound
the target.

- Designer's Note: choosing to automatically wound the target means that
  no wound roll is made for that attack. You may decide against this, as
  it means that attack cannot result in a critical wound and so cannot
  trigger other abilities such as `[DEVASTATING WOUNDS]`.

### Lone Operative (24.24)

Unless part of an **attached** unit, this unit is **not visible** to enemy
models unless they are within 12" of this unit, and it cannot be targeted
by `[INDIRECT FIRE]` weapons unless the attacking model is within 12" of
this unit.

If this ability takes the form **Lone Operative X"**, unless part of an
attached unit, this unit is not visible to enemy models unless they are
within **X"** of this unit, and it cannot be targeted by `[INDIRECT FIRE]`
weapons unless the attacking model is within **X"** of this unit.

### `[MELTA]` (24.25)

This ability always takes the form `[MELTA X]`. Each time a model makes an
attack with a `[MELTA]` weapon, if the target unit was within half range
of that weapon in the Select Targets step, until the attacking unit's
attacks have been resolved, add **X** to that weapon's **D** characteristic.

- Example: a model targets a unit that is within half range of a
  `[MELTA 2]` weapon with a **D** characteristic of D6. While resolving
  those attacks, that weapon has a **D** characteristic of D6+2.

### `[ONE SHOT]` (24.26)

Each weapon with this ability can only be selected to make attacks with
once per battle.

If a **destroyed** model is returned to a unit, all of its `[ONE SHOT]`
weapons that have already been selected to make attacks with during the
battle cannot be selected to make attacks with again.

If a new unit is added to an army, all `[ONE SHOT]` weapons in that unit
can be selected to make attacks with once per battle.

### `[PISTOL]` (24.27)

`[PISTOL]` and `[CLOSE-QUARTERS]` are identical for all rules purposes.
See `[CLOSE-QUARTERS]`.

- Designer's Note: `[PISTOL]` is a pre-existing ability that will be
  superseded by `[CLOSE-QUARTERS]` as this edition of Warhammer 40,000
  progresses. Both are functionally the same, but the latter is a more
  suitable term for weapons that function in this way.

### `[PRECISION]` (24.28)

While resolving attacks made with one or more `[PRECISION]` weapons, at
the start of the Allocation Order step (05.03), if the target unit
contains one or more `CHARACTER` models **visible** to one or more of the
attacking models, the active player can select one allocation group that
contains one of those visible `CHARACTER` models. If they do, until those
attacks resolve, or until that `CHARACTER` group is **destroyed**
(whichever happens first), that `CHARACTER` group is the current
allocation group.

### `[PSYCHIC]` (24.29)

Each time an attack is made with a `[PSYCHIC]` weapon, you can ignore any
or all modifiers to that attack's **BS** or **WS** characteristic and any
or all modifiers to the **hit roll**. Attacks made with `[PSYCHIC]`
weapons are known as **psychic attacks** (this can be important for the
triggering of other rules).

### `[RAPID FIRE]` (24.30)

This ability always takes the form `[RAPID FIRE X]`. Each time you gather
attack dice for a `[RAPID FIRE]` weapon, add **X** additional attack dice
if the target unit was within half range of that weapon in the Select
Targets step.

- Example: if a `[RAPID FIRE 1]` weapon with an **A** characteristic of 1
  targets a unit that is within half range, you would gather one
  additional attack die for that weapon (for a total of two for that
  weapon).

### Scouts (24.31)

This ability always takes the form **Scouts X"**. In the Resolve
Pre-battle Abilities step, if every model in a unit has this ability, you
can do **one** of the following:

- If that unit is in **strategic reserves**, you can set up that unit
  anywhere that is wholly within your deployment zone.
- If that unit is wholly within your deployment zone, it can make a
  **scout move** (see below).
- If that unit is embarked within a `DEDICATED TRANSPORT` that is wholly
  within your deployment zone, and if every model embarked within that
  `DEDICATED TRANSPORT` has the Scouts ability, that `DEDICATED TRANSPORT`
  can make a scout move.

**Scout Move (24.32):**

| Field | Detail |
|---|---|
| Maximum distance | The "X" in Scouts X" |
| Eligible if | It is the Resolve Pre-battle Abilities step and your unit is wholly within your deployment zone |
| Effect | Your unit moves as described in Moving (section 03) |
| After moving | Your unit must be more than 8" horizontally from all enemy units |

### Stealth (24.33)

If every model in a unit has this ability, each time a ranged attack
targets that unit, that unit has the **benefit of cover** against that
attack (13.08).

### Support (24.34)

See Attached Units (section 19).

### Super-Heavy Walker (24.35)

Each time a unit with this ability makes a **normal**, **advance**, or
**fall-back move**:

- Models in that unit can move through models (including
  `MONSTER`/`VEHICLE` models, but excluding `TITANIC` models), and can
  move horizontally through sections of **terrain features** that are 4"
  or less in height.
- Before moving that unit, you can select for all models in that unit to
  have the `MOBILE` keyword until that move ends. If you do, when that
  move ends, roll one D6: on a 1, that unit is **battle-shocked**.

- Designer's Note: gaining the `MOBILE` keyword for the duration of a move
  will enable models in that unit to move horizontally through **dense
  terrain features** (13.06).

### `[SUSTAINED HITS]` (24.36)

This ability always takes the form `[SUSTAINED HITS X]`. Each time an
attack made with a `[SUSTAINED HITS]` weapon results in a **critical
hit**, that attack results in a number of additional hits on the target
denoted by **X**.

- Example: an attack made with a `[SUSTAINED HITS 2]` weapon results in a
  critical hit. That attack therefore hits the target three times (once
  from the critical hit, and twice more from the `[SUSTAINED HITS 2]`
  ability).

### `[TORRENT]` (24.37)

Each time an attack is made with a `[TORRENT]` weapon, that attack
automatically hits the target.

### `[TWIN-LINKED]` (24.38)

Each time an attack is made with a `[TWIN-LINKED]` weapon, you can re-roll
the **wound roll**.

## Rules Appendix

The Rules Appendix collects supplementary content that is "kept in step"
with the Warhammer 40,000 app's digital FAQs/errata — clarifications and
rare-interaction rulings, rather than new core mechanics.

### Digital support

The Warhammer 40,000 app contains an expanded range of definitions, rare
rules interactions, and frequently asked questions (FAQs). These digital
resources are reviewed and updated regularly in response to player
feedback. The Rules Appendix pages present a selection of this supporting
material.

### Starting strength and half-strength

The number of models a unit contains at the start of the first battle
round is its **starting strength**. The starting strength of an
**attached** unit is the number of models that it contains at the start
of the first battle round.

Some rules refer to units being **below starting strength**, or at — or
below — **half-strength**. The meaning of these terms varies depending on
a unit's starting strength, as shown below.

| Condition | Starting strength of 1 | Starting strength of 2 or more |
|---|---|---|
| Below starting strength | Model's remaining wounds are less than its **W** characteristic | Number of remaining models in the unit is less than its starting strength |
| At half-strength | Model's remaining wounds are half of its **W** characteristic | Number of remaining models in the unit is half of its starting strength |
| Below half-strength | Model's remaining wounds are less than half of its **W** characteristic | Number of remaining models in the unit is less than half of its starting strength |

- Example: a Captain (1 model) is attached to a unit of Intercessors (5
  models). This attached unit has a starting strength of 6. If three
  Intercessors were destroyed, the unit would be **at half-strength**. If
  four Intercessors were destroyed, the unit would be **below
  half-strength**. If all of the Intercessors were destroyed, the
  remaining Captain would be **below half-strength**, despite having his
  full wounds remaining.

- Sidebar — **Some units cannot be at half-strength**: if a model's **W**
  characteristic or a unit's starting strength cannot be evenly divided in
  half, that model or unit cannot be **at half-strength** (but can be
  **below half-strength** as described above).

### Adding a new unit to your army

Some rules add a new unit to your army during a battle. That unit's
starting strength is determined when it is added to your army, but is
otherwise determined in the same way as for other units.

### Destroyed

Throughout a battle, models will suffer damage, lose wounds, and be
**destroyed**. When every model in a unit has been destroyed, that unit is
destroyed.

When a model is destroyed, first resolve any rules that are triggered when
it is destroyed. If any such rules apply, and if the model was destroyed
as the result of an attack, unless otherwise stated, those rules are only
resolved and that model is only removed after the attacking unit's attacks
have been resolved. Unless otherwise stated, destroyed models and units
cannot use abilities or be selected or targeted by rules.

### Different move characteristics

When making a normal or advance move, if different models in the moving
unit have different **M** characteristics, the maximum distance for that
move will be different for those models. For example, if a unit makes a
normal move and all models in that unit have an **M** characteristic of 6"
except for one model with an **M** characteristic of 9", that model's
maximum distance for that move is 9", while the other models' maximum
distance is 6". While that unit is making that move, all other
restrictions must be met.

### Eligible to fight, but unable to fight

During the Fight sequence, when the sequence returns to a player to select
a unit to fight, if all of that player's units that are eligible to fight
are more than 5" from all enemy units, that player can instead choose to
pass and return the sequence to their opponent to select a unit. If both
players pass in succession, or if one player passes when their opponent
has no remaining units that are eligible to fight, the Fight step ends.

- Designer's Note: occasionally, all of a unit's targets will be destroyed
  before they had a chance to fight, with no other targets close enough to
  engage with a pile-in move. In such cases, a player can choose to pass
  and wait to see if another enemy unit ends a pile-in move close enough
  to be attacked later in the phase.

### Mixed keywords in units

Some units can contain models that have different keywords, either
because they are an attached unit or as a result of separations listed on
their datasheet and/or items of wargear they have. While this is the case,
such a unit has all of the keywords of all of its models, but its models
do not gain the keywords of other models in that unit that they do not
already have. Remember that attacks target units, not models.

### Objectives not within a terrain area

If the location point of an **objective** does not coincide with a
**terrain area**, you must denote the location of that objective with a
flat, circular marker, 40 mm in diameter, centred on that point — this is
called an **objective marker**. Models can move through objective markers
and they can move on top of objective markers. A model is within range of
an objective marker while it is within 3" horizontally and 5" vertically
of that objective marker. When measuring distances to and from an
objective marker, measure to and from the closest part of it.

### Revived

When a rule revives, resurrects, or returns models to a unit, the
specified number of destroyed models are added to the unit. This cannot
expand a unit beyond its **starting strength**. Such models are added with
any wargear and enhancements they started the battle with and, unless
otherwise stated, are returned with their full wounds remaining.

Models returned to a unit on the battlefield must be set up as follows:

- In **coherency** with models in that unit that started that phase on
  the battlefield (i.e. models that were already on the battlefield when
  this rule was used).
- They can be **engaged** with one or more enemy units, but only if those
  enemy units are already engaged with the units those models are being
  returned to.

If a **leader** or **support** model in an attached unit is destroyed and
subsequently revived, it is still part of that attached unit and must be
returned to it if possible.

### See also (cross-references noted in the book)

- Starting Strength and Half-Strength → Regaining Lost Wounds
- Starting Strength and Half-Strength → Revived

(The book also includes a QR code here linking to the Warhammer 40,000
app — omitted here as promotional/non-rules content.)

### FAQs

- **Q: Is a unit with no ranged weapons eligible to shoot in its
  controlling player's Shooting phase?**
  A: Yes. Even though the unit cannot make ranged attacks, it is still
  **eligible to shoot**, which can affect its eligibility for other rules,
  e.g. starting an **action**.
- **Q: When my unit shoots using close-quarters shooting, can
  `MONSTER`/`VEHICLE` models in my unit target an engaged unit with
  `[BLAST]` weapons?**
  A: No.
- **Q: When my unit shoots at an engaged `MONSTER`/`VEHICLE` unit, can
  models in my unit target that unit with `[BLAST]` weapons?**
  A: No.
- **Q: Can a unit that is eligible to make an overrun fight be selected to
  do so if it is not also eligible to fight?**
  A: No. Sometimes a unit can become **engaged** after the start of the
  Fight step, but then become **unengaged** later in that step. If this
  happens, and it is no longer **eligible to fight**, it cannot make an
  overrun fight.
- **Q: Can a unit embark within a `TRANSPORT` after making a scout move?**
  A: No. Scout moves happen in the Resolve Pre-battle Abilities step of
  the battle, which comes after the Declare Battle Formations step and
  before the Begin the Battle step.
