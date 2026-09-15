# Core Rules — Advanced Rules (pp. 60–75)

Source: Warhammer 40,000 Core Rules booklet, "ADVANCED RULES" chapter
(sections 17–23). Rule numbers below (e.g. `17.01`) match the booklet's
own numbering so they can be cross-referenced against the physical/PDF
rulebook.

## 17. Monsters and Vehicles

### Moving Monsters and Vehicles (17.01)
Each time a unit makes a **normal move** or **advance move**, any
`MONSTER`/`VEHICLE` models in that unit can be moved through friendly
and enemy models — **except** other `MONSTER`/`VEHICLE` models, which
still block movement.

### Frame (17.02)
- Some models have no base; many of these have the **`FRAME`** keyword,
  as do some other large models.
- Whenever a rule refers to a model's position relative to anything else
  on the battlefield (e.g. measuring distances), if that model has the
  `FRAME` keyword, measure to/from the **closest point on the model**
  (not necessarily the base, if it has one), unless otherwise stated.
- When rotating a `FRAME` model without a base as part of a move, it can
  be turned any amount around its central axis while keeping it upright.

### Shooting at Engaged Monsters and Vehicles (17.03)
- In your Shooting phase, enemy `MONSTER`/`VEHICLE` units that are
  **engaged** can still be selected as targets of ranged attacks (unlike
  most engaged units).
- Each time a model makes a ranged attack targeting such an engaged
  `MONSTER`/`VEHICLE`, **subtract 1 from the hit roll** — except for
  attacks made with **`[CLOSE-QUARTERS]`** weapons by models in a unit
  engaged with the target, which take no penalty.
- Sidebar callout — **Shooting while engaged with Monsters/Vehicles**: a
  unit that is engaged with an enemy `MONSTER`/`VEHICLE` unit is still
  **not eligible to shoot** and cannot make ranged attacks against that
  `MONSTER`/`VEHICLE` unit, unless that unit *is* eligible to shoot while
  engaged (e.g. because it is using close-quarters shooting).

**Worked example (p.63, "Engaged Monsters/Vehicles – Shooting")**:
- **A**: A `VEHICLE` shoots at an engaged `INFANTRY` unit using **normal
  shooting** (not close-quarters); it subtracts 1 from hit rolls, except
  for `[CLOSE-QUARTERS]` weapons. That `INFANTRY` unit can shoot back at
  the `VEHICLE` with normal shooting, also at -1 to hit; because the
  `VEHICLE` is engaged, `[BLAST]` weapons cannot target it (but can
  target other unengaged units).
- **B**: The `VEHICLE` shoots at an engaged `INFANTRY` unit using
  **close-quarters shooting**, at -1 to hit. The `INFANTRY` unit can only
  shoot back at the `VEHICLE` using close-quarters shooting, and can only
  target the `VEHICLE` it is engaged with. Because the `INFANTRY` unit is
  engaged, `[BLAST]` weapons cannot target it either.

## 18. Transports

### Transport Capacity (18.01)
- `TRANSPORT` models have a **transport capacity** listed on their
  datasheet, defining the type and maximum number of friendly models
  that are **eligible to embark** within them.
- More than one unit can be embarked within the same `TRANSPORT` at the
  same time, provided there is sufficient remaining transport capacity.
- Before the battle, in the **Declare Battle Formations** step, units can
  start the game already embarked within a friendly `TRANSPORT` that has
  sufficient capacity remaining for the whole unit.

### Embarking (18.02)
Once the first battle round has started, a friendly unit can embark
within a friendly `TRANSPORT` model **after making a normal, advance, or
fall-back move**, if **all** of the following apply:
- Each model in that unit is within 3" of that `TRANSPORT`.
- That unit was **not set up on the battlefield this turn**.
- That unit is **eligible to embark** within that `TRANSPORT`, per that
  `TRANSPORT`'s datasheet.
- That `TRANSPORT` has sufficient remaining transport capacity for each
  model in that unit.

When a unit embarks, the active player removes it from the battlefield
and sets it aside — it is now embarked within that `TRANSPORT` and is
**not on the battlefield**.

### Disembarking (18.03)
- In the active player's Movement phase, each friendly unit embarked
  within a `TRANSPORT` can disembark from it by making a **disembark
  move**.
- If a `TRANSPORT` model is **destroyed**, before removing it from the
  battlefield the active player must make an **emergency disembark
  move** with each unit embarked within it.

### Disembark Move (18.04)
| Field | Value |
|---|---|
| Set-up distance | Rapid/Tactical Disembark: 3"; Combat Disembark: 6" |
| Eligible if | Unit is embarked within a `TRANSPORT` on the battlefield; did not embark within that `TRANSPORT` this phase; that `TRANSPORT` has not made an advance or fall-back move this phase |
| Effect | Unit is set up as described in Set Up (03.02) |

**Before moving — select a disembark mode:**
- **Rapid Disembark**: selectable if that `TRANSPORT` made a **normal**
  or **ingress move** this phase.
- **Tactical Disembark**: otherwise, if that `TRANSPORT` remained
  stationary or has not yet been selected to move this phase, and if you
  can set up your unit as described below.
- **Combat Disembark**: otherwise, mandatory. Make a **hazard roll** for
  each model in your unit.

**While moving:**
- Set up each model in your unit wholly within the set-up distance of
  that `TRANSPORT`.
- **Rapid Disembark**: if that `TRANSPORT` made an ingress move this
  turn, each model must make the same move that the `TRANSPORT` had to
  follow while resolving that move.
- **Combat Disembark**: each model can be set up **engaged** with one or
  more enemy units that `TRANSPORT` is engaged with.

**After moving:**
- **Rapid Disembark**: unit is **not eligible to declare a charge** until
  the end of the turn.
- **Tactical Disembark**: unit can make a normal or advance move.
- **Combat Disembark**: unit is **battle-shocked**, and until the end of
  the turn is **not eligible to declare a charge**.

Sidebar (**Rapid Disembark**): when a unit uses rapid disembark mode
after its `TRANSPORT` made an **ingress move**, the models must follow
the same rules/restrictions that `TRANSPORT` did — e.g. if that
`TRANSPORT` had to be set up more than 8" from all enemy units and not
within the opponent's deployment zone, the same restrictions apply to
the disembarking unit.

### Emergency Disembark Move (18.05)
| Field | Value |
|---|---|
| Set-up distance | 6" |
| Eligible if | Unit is embarked within a `TRANSPORT` that was just destroyed |
| Effect | Unit is set up as described in Set Up (03.02) |

- **Before moving**: make a hazard roll (06.03) for each model in the
  unit.
- **While moving**: set up each model within 6" of that `TRANSPORT`, and
  as close as possible to where it was. Any model that cannot be set up
  this way is **destroyed**.
- **After moving**: unit is **battle-shocked**, and until the end of the
  turn is **not eligible to declare a charge**.

See-also cross references noted in the source: Embarking → "Not on the
Battlefield"; Disembarking → "Hazard Rolls (06.03)", "Persisting Rules
Effects".

## 19. Attached Units

### Forming Attached Units (19.01)
- Some units have the **Leader** or **Support** ability listed on their
  datasheet — such units are known as **leader units** and **support
  units** respectively.
- Both abilities allow the unit to **lead** other friendly units (known
  as **bodyguard units**) to form **attached units**. An attached unit
  is a **single unit for all rules purposes**.
- Leader and support units can only lead specific bodyguard units, as
  listed in the Warhammer 40,000 app.
- Before the battle, in the **Muster Armies** step, for each leader/
  support unit in your army you can select one friendly bodyguard unit
  that it can lead; that unit will then lead that bodyguard unit for the
  battle, forming an attached unit.
- Unless otherwise stated, each **bodyguard unit can only have one
  leader unit and one support unit attached to it**.

### Attacking Attached Units (19.02)
- Each time an attack targets an attached unit that contains one or more
  bodyguard models, use the **highest Toughness (T) characteristic of
  the bodyguard models** while resolving that attack — even if the
  leader/support unit in that attached unit has a different T.
- If that unit only contains leader/support models (no bodyguard models
  left), use the highest T of those leader/support models instead.
- Rules triggered when a unit is **destroyed** only trigger when the
  **last model that started the battle in an attached unit** is
  destroyed (i.e. destroying the whole attached unit, not just part of
  it).

### Keywords in Attached Units (19.03)
- An attached unit has **all the keywords of all of its component
  units**. It is affected by any rule that applies to units with any of
  those keywords.
- Models in an attached unit do **not** gain the keywords of other
  models in that unit that they don't already have. **Attacks still
  target models, not units**, for keyword purposes.
- **Worked example**: an attached unit contains a leader model with the
  `PSYKER` keyword. While that model is part of the unit, the *unit* has
  the `PSYKER` keyword, even though the bodyguard models do not
  individually have it. If the unit is attacked by a weapon with the
  `[ANTI-PSYKER 4+]` ability, any unmodified wound roll of 4+ against
  that unit is a **critical wound**, even if the attack itself isn't
  allocated to the leader model.

### Abilities in Attached Units (19.04)
- Abilities/rules that affect a **single specified model** (e.g. from an
  **enhancement** or an item of wargear) only ever apply to that model,
  even while it is part of an attached unit.
- Otherwise, abilities/rules that affect **a unit** (or models in it)
  apply to the **entire attached unit**, until the source of that
  ability/rule is destroyed:

| Source of ability/rule | Applies to the attached unit until... |
|---|---|
| Leader/support unit | The last model in that leader/support unit is destroyed* |
| Bodyguard unit (e.g. from a datasheet ability) | The last model in that bodyguard unit is destroyed |
| A specific model (e.g. bearer of an enhancement or wargear item) | That model is destroyed |

\* Leader/support units continue to benefit from their own "while
leading a unit" abilities even after their bodyguard unit is destroyed,
provided they started the battle in an attached unit.

- If the last model providing an ability was destroyed **as the result
  of an attack**, the ability it was conferring still applies until that
  attacking model has finished resolving all of its attacks.

Sidebar note ("Only in Death Does Duty End"): Leader and support units
often have abilities that make the units they're leading more powerful.
Likewise, some bodyguard units' abilities enhance the power of the
leader/support units leading them. The rule on the left means that once
models conferring such effects are destroyed, that attached unit no
longer continues to benefit from them. Should those models later be
**revived**, however, those abilities will once again apply to their
attached unit.

## 20. Strategic Reserves

Strategic reserves are units that arrive on the battlefield at different
times, either because they were held back during deployment, or because
they use special abilities to reposition themselves.

### Placing Units in Strategic Reserves (20.01)
- Before the battle, in the **Declare Battle Formations** step, you can
  select one or more friendly units (**excluding `FORTIFICATIONS`**) to
  place in **strategic reserves**, instead of setting them up on the
  battlefield during deployment. Set them aside; they will arrive later.
- Unless otherwise stated, the **combined points value of all your
  strategic reserves units** (including those embarked within
  `TRANSPORTS` that are themselves in strategic reserves) **cannot
  exceed 50% of your points limit** for your battle size.

### Repositioned Units (20.02)
- Some rules allow units to be removed from the battlefield and placed
  in strategic reserves during the battle — these are **repositioned
  units**. In addition to any other rules governing such units (e.g.
  where they can/cannot arrive), **all** of the following apply:
  - If used in the Movement phase, such rules can be used on units that
    have already moved that phase.
  - A repositioned unit set up in the same turn it made an advance,
    fall-back, or disembark move has **still made** an advance, fall-
    back, or disembark move that turn (i.e. that status carries over).
  - When removed from the battlefield, any rules affecting such units
    for a specified duration or under specified circumstances **continue
    to affect them** while that duration/those circumstances still
    apply.
- **Worked example**: A unit that was within range of an **aura ability**
  when removed from the battlefield would **no longer** be affected by
  that aura ability if it is no longer within range of it when it makes
  an ingress move. But a unit that was **battle-shocked** when removed
  from the battlefield **would still be battle-shocked** if it makes an
  ingress move in the same turn.

### Arriving from Strategic Reserves (20.03)
- To arrive on the battlefield, each strategic reserves unit must make
  an **ingress move**. Unless otherwise stated, they can only do so
  **from the second battle round onwards**.

### Ingress Move (20.04)
| Field | Value |
|---|---|
| Set-up distance | 6" |
| Eligible if | Unit is in strategic reserves (excluding units embarked within `TRANSPORTS` that are themselves in strategic reserves) |
| Effect | Unit is set up as described in Set Up (03.02) |

- **While moving**: set up your unit wholly within the set-up distance
  of one or more battlefield edges and **more than 8" horizontally from
  all enemy models**.
  - **Before the Third Battle Round**: while doing so, no models can be
    set up within your opponent's deployment zone.
- **After moving**: unless otherwise stated, until the start of the next
  Charge phase, the unit is **not eligible to make any other type of
  move**.

**End-of-third-battle-round rule**: at the end of the third battle
round, unless otherwise stated, **all strategic reserves units that have
not made an ingress move are destroyed**, with the following exceptions:
- Units embarked within `TRANSPORTS` that have made an ingress move
  during the battle.
- **Repositioned** units.

Cross references noted in source: "Not on the Battlefield," "Persisting
Rules Effects," "Setting Up Large Models."

## 21. Flying and Surging

This section supplements the basic movement rules, covering units that
can fly over obstacles or surge closer to the enemy.

### Surge Moves (21.01–21.02)
Some rules allow a unit to make a **surge move**.

| Field | Value |
|---|---|
| Maximum distance | As stated in the rule granting this move type |
| Eligible if | The rule allowing this move type has been triggered; unit is not battle-shocked; unit is unengaged; unit has not moved this phase |
| Effect | Unit moves as described in Moving (03) |

- **Before moving**: select the **closest enemy unit** to be the **surge
  target**.
- **While moving**:
  - Each model must end its move **engaged with the surge target** if
    possible.
  - Each model that cannot end its move engaged with the surge target
    must end its move **as close as possible** to the surge target.
- **After moving**:
  - The unit **cannot be engaged** with any enemy units that were not
    the surge target.
  - The unit **cannot move again this phase**.

**Worked example (p.70, "Making a Surge Move")**: Unit A shoots and
destroys two models from unit B. Unit B has an ability letting it make a
surge move of D6" after an enemy unit has shot it, if one or more of its
models were destroyed by those attacks. The active player rolls a D6,
getting a 4. Unit B makes a surge move, with each surviving model moving
up to 4" toward the closest enemy unit (unit C), ending the move engaged
with unit C.

### Flying Models (21.03)
- Models with the **`FLY`** keyword, and units such models are part of,
  are said to be able to **FLY**. Some rules refer to such models/units
  as **FLYING** models/units.
- Each time a FLYING unit is selected to make a **normal, advance,
  fall-back, or charge move**, before moving any models in that unit,
  the active player can declare that it will **take to the skies**. If
  it does, while resolving that move:
  - **Subtract 2" from the maximum distance.**
  - Each time a FLYING model moves:
    - **Ignore all vertical distance** for the purposes of how far it
      has moved.
    - It can **move through all types of model**, including enemy models
      and `MONSTER`/`VEHICLE` models.
    - It can move horizontally and vertically through **all categories
      of terrain feature**.

**Worked example (p.71, "Taking to the Skies")**: A Riptide Battlesuit
that can FLY makes an advance move with a maximum distance of 16".
Before moving, the active player declares it will take to the skies —
the move's maximum distance is reduced to 14", but while making that
move the Riptide can move through all enemy units (including
`VEHICLES`) and all terrain features, ignoring any vertical distance
that would normally be counted to ascend/descend terrain features.

Cross reference noted in source: Surge Moves → "Rules Sequencing."

## 22. Other Rules and Abilities

In addition to the core abilities presented elsewhere, many units have
access to other rules and ability types, described below.

### Aura Abilities (22.01)
- Abilities that affect models or units **within a stated range** are
  **aura abilities**, tagged with the word "Aura."
- While a model with an aura ability is on the battlefield, it is
  **always within range of its own aura ability**.
- A unit can be affected by more than one aura ability at a time, but if
  a unit is within range of the **same** aura ability more than once
  (e.g. from multiple sources of the identical ability), **that aura
  ability only applies to that unit once** (no stacking of the same aura
  from multiple sources).

### Faction Abilities (22.02)
- Some abilities are common to every unit belonging to a particular
  faction — these are **faction abilities** (also known as **army
  rules**), listed in the Faction Abilities section of a datasheet.
- Unless otherwise stated, a unit's faction abilities only apply if the
  **army faction** selected while mustering your army matches a faction
  keyword listed on that unit's datasheet.

### Psychic Abilities (22.03)
- Abilities tagged with the word "Psychic" are **psychic abilities**.
- If a psychic ability causes a model to lose one or more wounds, those
  wounds are said to be inflicted by a **psychic attack** (relevant for
  triggering other rules keyed off "psychic attacks").

### Wargear Abilities (22.04)
- Abilities gained when a unit (or one of its models) has a particular
  item of wargear are **wargear abilities**, listed in the Wargear
  Abilities section of a datasheet.
- If a unit has an item of wargear with a wargear ability, that ability
  applies to that unit. If a specific model within a unit has the item
  of wargear, that model is the **bearer** of that item, and the ability
  applies **until that model is destroyed**.

### Plunging Fire (22.05)
Each time a model makes a ranged attack that targets a **visible** unit
containing one or more models on ground level, **improve the BS
characteristic of that attack by 1** if one or more of the following
apply:
- The attacking model is on a section of a **terrain feature that is 3"
  or more in height**.
- The attacking model has the **`TOWERING`** keyword and the target unit
  is within 12".

**Worked example (p.73, "Plunging Fire")**: Two illustrated cases — an
attacking model atop terrain 3"+ high firing down at a unit on ground
level gets +1 BS; a `TOWERING`-keyword model on ground level firing at a
unit within 12" (also on ground level) likewise gets +1 BS to those
attacks.

## 23. Aircraft

Aircraft fulfil a unique but limited role on Warhammer 40,000
battlefields — hurtling through the skies while they duel one another,
strafe ground forces, or perform bombing runs, constantly on the move.

### Deployment (23.01)
- In the **Declare Battle Formations** step, all `AIRCRAFT` units must
  be placed in **strategic reserves** (20.01).

### Movement (23.02)
- `AIRCRAFT` units are only eligible to make an **ingress move** (20.04);
  they are **not eligible to make any other type of move**.
- At the **end of your opponent's turn**, all `AIRCRAFT` units in your
  army that are on the battlefield must be placed back in **strategic
  reserves**.
- Each time a unit makes any type of move, its models **can be moved
  through `AIRCRAFT` models**.
- Each time a unit makes a **pile-in, consolidation, or surge move**,
  unless that unit can `FLY`, it must **ignore `AIRCRAFT` units** for the
  purposes of selecting enemy units and determining the closest enemy
  unit.
- Being **engaged solely with one or more `AIRCRAFT` units** does **not**
  prevent a unit from being eligible to make a normal or advance move.

### Shooting (23.03)
- The **Plunging Fire** rule (22.05) has **no effect** on attacks made
  by, or targeting, `AIRCRAFT` units.

### Charging and Fighting (23.04)
- `AIRCRAFT` units are **not eligible to declare a charge**, and can only
  make melee attacks that target `FLYING` units.
- Only `FLYING` units can select `AIRCRAFT` units as a **charge target**,
  and only `FLYING` models can make melee attacks that target `AIRCRAFT`
  units.

---

## Key defined terms

- **MONSTER/VEHICLE model** — a model of the `MONSTER` or `VEHICLE`
  keyword type; can move through other models (except other MONSTER/
  VEHICLE models) and can be targeted by shooting even while engaged.
- **FRAME** — keyword for some large/baseless models; distances are
  measured to/from the closest point on the model rather than a base;
  can rotate freely around its central axis while staying upright.
- **Engaged** — a unit's state of being within melee range of the enemy;
  engaged MONSTER/VEHICLE units can still be shot at (at -1 to hit
  unless using close-quarters shooting from an engaged attacker).
- **[CLOSE-QUARTERS]** — a weapon ability letting a unit shoot at (and
  only at) the enemy unit it is engaged with, without the normal -1 hit
  penalty against engaged MONSTER/VEHICLE targets.
- **[BLAST]** — a weapon ability that cannot target engaged units.
- **TRANSPORT** — a model with a transport capacity that can carry
  friendly units as passengers.
- **Transport capacity** — the type/maximum number of models eligible to
  embark within a TRANSPORT model at once.
- **Embark** — to place a unit inside a friendly TRANSPORT, removing it
  from the battlefield.
- **Disembark** — to move a unit out of a TRANSPORT and onto the
  battlefield via a disembark move.
- **Disembark move** — the move type used to leave a TRANSPORT, with
  three modes: Rapid, Tactical, and Combat Disembark.
- **Rapid Disembark** — disembark mode used when the TRANSPORT made a
  normal or ingress move that phase; unit is not eligible to charge that
  turn; must replicate the TRANSPORT's ingress-move restrictions if
  applicable.
- **Tactical Disembark** — disembark mode used when the TRANSPORT
  remained stationary/hasn't moved yet; unit can make a normal or
  advance move afterward.
- **Combat Disembark** — mandatory disembark mode otherwise; requires a
  hazard roll per model, can be set up engaged with the enemy, and
  leaves the unit battle-shocked and unable to charge that turn.
- **Emergency disembark move** — the forced move made by units embarked
  in a TRANSPORT that has just been destroyed; requires a hazard roll
  per model; unplaceable models are destroyed; unit ends battle-shocked
  and unable to charge that turn.
- **Hazard roll** — a dice roll (06.03) that can destroy models, made in
  various risky circumstances (Combat Disembark, emergency disembark).
- **Attached unit** — a single unit for all rules purposes, formed by a
  leader and/or support unit joining a bodyguard unit.
- **Leader unit / Leader ability** — a unit ability letting it lead a
  specific bodyguard unit, forming an attached unit.
- **Support unit / Support ability** — like Leader, but for support-type
  units; functions the same way for forming attached units.
- **Bodyguard unit** — the unit led by a leader/support unit within an
  attached unit.
- **Muster Armies step** — the pre-battle step where leader/support
  units are assigned to their bodyguard units.
- **Strategic reserves** — units held off the battlefield at deployment
  (or later placed there by repositioning) that arrive via an ingress
  move, capped at 50% of the army's points limit.
- **Repositioned unit** — a unit removed from the battlefield and placed
  into strategic reserves mid-battle by a specific rule; retains
  in-progress move status and time-limited/conditional effects if still
  applicable.
- **Ingress move** — the move type strategic reserves units use to
  arrive on the battlefield: set up within 6" of a battlefield edge and
  more than 8" from all enemy models (not in the opponent's deployment
  zone before the third battle round); usable only from the second
  battle round onward (unless stated otherwise); not eligible to make
  another move type until the next Charge phase.
- **FORTIFICATIONS** — a unit type excluded from being placed in
  strategic reserves.
- **Surge move** — a move type triggered by specific rules that pulls a
  unit toward the closest enemy unit (the surge target), ending engaged
  with it if possible; the unit cannot end engaged with any other enemy
  unit and cannot move again that phase.
- **Surge target** — the closest enemy unit selected before a surge move.
- **FLY** — keyword marking a model/unit as able to fly.
- **FLYING model/unit** — a model/unit with (or part of a unit with) the
  FLY keyword.
- **Take to the skies** — a declarable option for a FLYING unit's normal/
  advance/fall-back/charge move: -2" to maximum distance, but ignores
  vertical distance, can move through all models (including MONSTER/
  VEHICLE) and all terrain feature categories.
- **Aura ability** — an ability (tagged "Aura") that affects models/units
  within a stated range of its bearer; doesn't stack with itself from
  the same source.
- **Faction ability / Army rule** — an ability common to all units of a
  given faction, applying only if the mustered army's faction matches.
- **Psychic ability** — an ability tagged "Psychic"; wounds it causes are
  psychic attacks.
- **Psychic attack** — a wound loss inflicted by a psychic ability.
- **Wargear ability** — an ability granted by a specific wargear item,
  applying to the unit (or, if borne by a specific model, until that
  model — the bearer — is destroyed).
- **Bearer** — the specific model carrying an item of wargear that grants
  a wargear ability.
- **Plunging Fire** — a +1 BS bonus to a ranged attack against a visible,
  ground-level-containing unit when the attacker is on terrain 3"+ high,
  or has TOWERING and the target is within 12"; has no effect on/against
  AIRCRAFT.
- **TOWERING** — keyword granting Plunging Fire's height-based bonus
  even from ground level, against targets within 12".
- **AIRCRAFT** — a unit type that must deploy into strategic reserves,
  can only ever make ingress moves, returns to strategic reserves at the
  end of the opponent's turn, is ignored by pile-in/consolidation/surge
  targeting from non-FLY units, cannot charge, and can only fight/be
  charged by FLYING units.
- **Ingress move (AIRCRAFT-specific use)** — the only move type AIRCRAFT
  units are ever eligible to make.
